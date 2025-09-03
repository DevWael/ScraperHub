import { NextRequest, NextResponse } from 'next/server';
import { taskOperations } from '@/lib/database';
import path from 'path';
import fs from 'fs';
import { createReadStream } from 'fs';
import { 
  canDownloadTask, 
  getDownloadsDir, 
  ensureDirectoryExists,
  createZipFromDirectory 
} from '@/lib/utils';

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

    // Check if task can be downloaded
    if (!canDownloadTask(task)) {
      return NextResponse.json(
        { error: 'Task is not completed or output not found' },
        { status: 400 }
      );
    }

    // Create a zip file of the task results
    const zipPath = path.join(getDownloadsDir(), `${taskId}.zip`);
    
    // Ensure downloads directory exists
    ensureDirectoryExists(getDownloadsDir());

    // Create zip file
    await createZipFromDirectory(task.outputDir!, zipPath);

    // Return the zip file
    const fileStream = createReadStream(zipPath);
    
    return new NextResponse(fileStream as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="task-${taskId}-results.zip"`,
      },
    });

  } catch (error) {
    // Error downloading task results
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
