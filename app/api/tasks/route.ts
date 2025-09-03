import { NextRequest, NextResponse } from 'next/server';
import { taskOperations } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get all tasks from database
    const tasks = taskOperations.getAll.all();
    
    // Transform the data to match frontend expectations
    const transformedTasks = tasks.map((task: any) => ({
      ...task,
      settings: JSON.parse(task.settings),
      // Map database fields to frontend fields
      pagesScraped: task.scrapedUrls || 0,
      pagesFailed: task.failedUrls || 0,
      imagesDownloaded: task.downloadedImages || 0,
      totalUrls: task.totalUrls || 0
    }));

    return NextResponse.json({
      tasks: transformedTasks
    });
  } catch (error) {
    // Error getting tasks
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
