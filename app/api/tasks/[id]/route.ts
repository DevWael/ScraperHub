import { NextRequest, NextResponse } from 'next/server';
import { taskOperations, taskRunOperations, scrapedPageOperations, db } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    
    // Get task details
    const task = taskOperations.getById.get(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get task runs (history)
    const runs = taskRunOperations.getByTaskId.all(taskId);
    
    // Get scraped pages for the latest run
    const latestRun = runs[0];
    let scrapedPages = [];
    if (latestRun) {
      scrapedPages = scrapedPageOperations.getByRunId.all(latestRun.id);
    }

    // Get task statistics
    const stats = scrapedPageOperations.getStats.get(taskId);

    return NextResponse.json({
      task: {
        ...task,
        settings: JSON.parse(task.settings)
      },
      runs,
      scrapedPages,
      stats: stats || {
        total: 0,
        successful: 0,
        failed: 0,
        totalWords: 0,
        totalImages: 0,
        totalLinks: 0
      }
    });
  } catch (error) {
    // Error getting task details
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    
    // Check if task exists
    const task = taskOperations.getById.get(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Delete in correct order to avoid foreign key constraint issues
    // First delete scraped pages
    db.exec(`DELETE FROM scraped_pages WHERE taskId = '${taskId}'`);
    
    // Then delete task runs
    db.exec(`DELETE FROM task_runs WHERE taskId = '${taskId}'`);
    
    // Finally delete the task
    taskOperations.delete.run(taskId);

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    // Error deleting task
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
