import { NextRequest, NextResponse } from 'next/server';
import { TaskActionRequest } from '@/types/task';

export async function POST(request: NextRequest) {
  try {
    const body: TaskActionRequest = await request.json();
    const { taskId } = body;

    const task = global.activeTasks.get(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update task status
    task.status = 'stopped';
    global.activeTasks.delete(taskId);

    return NextResponse.json({
      success: true,
      taskId,
      message: 'Task stopped successfully',
    });

  } catch (error) {
    // Error stopping task
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
