import { NextRequest, NextResponse } from 'next/server';
import { CreateTaskRequest, TaskUpdate } from '@/types/task';
import { taskOperations, taskRunOperations, scrapedPageOperations } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import { socketUtils } from '@/lib/socket-utils';

// In-memory storage for active tasks (for real-time updates)
declare global {
  var activeTasks: Map<string, any>;
}

if (!global.activeTasks) {
  global.activeTasks = new Map();
}

const activeTasks = global.activeTasks;

// Socket.IO server is now handled by the unified server in server.js

export async function POST(request: NextRequest) {
  try {
    const body: CreateTaskRequest = await request.json();
    const { url, settings } = body;

    // Validate URL
    if (!url || !url.startsWith('http')) {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    const taskId = uuidv4();
    const runId = uuidv4();
    const now = new Date().toISOString();

    // Create task in database
    taskOperations.create.run(
      taskId,
      url,
      JSON.stringify(settings),
      'pending',
      now,
      now
    );

    // Get run number for this task
    const runCountResult = taskRunOperations.getRunCount.get(taskId);
    const runNumber = ((runCountResult as any)?.count || 0) + 1;

    // Create task run in database
    taskRunOperations.create.run(
      runId,
      taskId,
      runNumber,
      'running',
      now,
      0
    );

    // Create task context for real-time updates
    const taskContext = {
      taskId,
      runId,
      url,
      settings,
      startTime: Date.now(),
      status: 'running' as const,
      progress: 0,
      totalUrls: 0,
      scrapedUrls: 0,
      failedUrls: 0,
      downloadedImages: 0,
      currentUrl: '',
      error: null as string | null,
    };

    activeTasks.set(taskId, taskContext);

    // Update task status in database
    taskOperations.update.run(
      'running',
      0,
      now,
      null,
      0,
      0,
      0,
      0,
      null,
      null,
      now,
      taskId
    );

    // Emit task started event
    socketUtils.emitTaskStarted(taskId);

    // Start scraping in background using child process
    const { spawn } = require('child_process');
    const path = require('path');
    
    const crawlerPath = path.join(process.cwd(), 'lib', 'crawler.js');
    const outputDir = path.join(process.cwd(), 'data', 'tasks', `${taskId}_run_${runNumber}`);
    const child = spawn('node', [crawlerPath, '--url', url, '--output', outputDir, '--format', 'md'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data: Buffer) => {
      const dataStr = data.toString();
      output += dataStr;
      
      // Parse progress from crawler output
      const lines = dataStr.split('\n');
      for (const line of lines) {
        if (line.startsWith('PROGRESS_UPDATE:')) {
          try {
            const jsonStr = line.replace('PROGRESS_UPDATE:', '');
            const progressData = JSON.parse(jsonStr);
            
            // Update task context
            const task = activeTasks.get(taskId);
            if (task) {
              task.progress = progressData.progress;
              task.totalUrls = progressData.totalUrls;
              task.scrapedUrls = progressData.scrapedUrls;
              task.failedUrls = progressData.failedUrls;
              task.downloadedImages = progressData.downloadedImages;
              task.currentUrl = progressData.currentUrl;
              
              // Update database
              taskOperations.update.run(
                'running',
                progressData.progress,
                task.startTime ? new Date(task.startTime).toISOString() : now,
                null,
                progressData.totalUrls,
                progressData.scrapedUrls,
                progressData.failedUrls,
                progressData.downloadedImages,
                outputDir,
                null,
                new Date().toISOString(),
                taskId
              );

              taskRunOperations.update.run(
                'running',
                null,
                progressData.progress,
                progressData.totalUrls,
                progressData.scrapedUrls,
                progressData.failedUrls,
                progressData.downloadedImages,
                outputDir,
                null,
                null,
                runId
              );
            }
            
            // Emit immediate progress update
            const taskUpdate: TaskUpdate = {
              taskId,
              status: 'running',
              progress: progressData.progress,
              pagesScraped: progressData.scrapedUrls,
              pagesFailed: progressData.failedUrls,
              imagesDownloaded: progressData.downloadedImages,
              currentUrl: progressData.currentUrl,
              totalUrls: progressData.totalUrls,
              elapsedTime: progressData.elapsed,
              estimatedRemaining: progressData.estimatedRemaining
            };
            
            // Emit socket event with correct field names
            const socketData = {
              taskId,
              status: 'running',
              progress: progressData.progress,
              pagesScraped: progressData.scrapedUrls,
              pagesFailed: progressData.failedUrls,
              imagesDownloaded: progressData.downloadedImages,
              currentUrl: progressData.currentUrl,
              totalUrls: progressData.totalUrls,
              elapsedTime: progressData.elapsed,
              estimatedRemaining: progressData.estimatedRemaining
            };
            
            socketUtils.emitTaskProgress(taskId, socketData);
          } catch (e) {
            // Failed to parse progress update
          }
        }
      }
    });

    child.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    child.on('close', (code: number) => {
      const endTime = new Date().toISOString();
      const task = activeTasks.get(taskId);
      
      if (code === 0) {
        // Success
        const taskUpdate: TaskUpdate = {
          taskId,
          status: 'completed',
          progress: 100,
          pagesScraped: task?.scrapedUrls || 0,
          pagesFailed: task?.failedUrls || 0,
          imagesDownloaded: task?.downloadedImages || 0,
          totalUrls: task?.totalUrls || 0,
          elapsedTime: task ? Math.round((Date.now() - task.startTime) / 1000) : 0
        };

        // Update database
        taskOperations.update.run(
          'completed',
          100,
          task?.startTime ? new Date(task.startTime).toISOString() : now,
          endTime,
          task?.totalUrls || 0,
          task?.scrapedUrls || 0,
          task?.failedUrls || 0,
          task?.downloadedImages || 0,
          outputDir,
          null,
          endTime,
          taskId
        );

        taskRunOperations.update.run(
          'completed',
          endTime,
          100,
          task?.totalUrls || 0,
          task?.scrapedUrls || 0,
          task?.failedUrls || 0,
          task?.downloadedImages || 0,
          outputDir,
          JSON.stringify({ output, successfulPages: task?.scrapedUrls || 0, failedPages: task?.failedUrls || 0, downloadedImages: task?.downloadedImages || 0 }),
          null,
          runId
        );

        activeTasks.delete(taskId);
        socketUtils.emitTaskCompleted(taskId, taskUpdate);
      } else {
        // Failed
        const taskUpdate: TaskUpdate = {
          taskId,
          status: 'failed',
          error: errorOutput || 'Process exited with non-zero code',
        };

        // Update database
        taskOperations.update.run(
          'failed',
          task?.progress || 0,
          task?.startTime ? new Date(task.startTime).toISOString() : now,
          endTime,
          task?.totalUrls || 0,
          task?.scrapedUrls || 0,
          task?.failedUrls || 0,
          task?.downloadedImages || 0,
          `output/${taskId}_run_${runNumber}`,
          errorOutput || 'Process exited with non-zero code',
          endTime,
          taskId
        );

        taskRunOperations.update.run(
          'failed',
          endTime,
          task?.progress || 0,
          task?.totalUrls || 0,
          task?.scrapedUrls || 0,
          task?.failedUrls || 0,
          task?.downloadedImages || 0,
          outputDir,
          null,
          errorOutput || 'Process exited with non-zero code',
          runId
        );

        activeTasks.delete(taskId);
        socketUtils.emitTaskFailed(taskId, taskUpdate.error || 'Unknown error');
      }
    });

    return NextResponse.json({
      success: true,
      taskId,
      runId,
      message: 'Task started successfully',
    });

  } catch (error) {
    // Error starting task
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tasks = taskOperations.getAll.all();
    return NextResponse.json({
      tasks,
      activeTasks: Array.from(activeTasks.keys()),
      totalActive: activeTasks.size,
    });
  } catch (error) {
    // Error getting tasks
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
