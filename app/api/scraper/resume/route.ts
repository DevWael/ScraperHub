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

    if (task.status !== 'paused') {
      return NextResponse.json(
        { error: 'Task is not paused' },
        { status: 400 }
      );
    }

    // Update task status
    task.status = 'running';
    global.activeTasks.set(taskId, task);

    return NextResponse.json({
      success: true,
      taskId,
      message: 'Task resumed successfully',
    });

  } catch (error) {
    // Error resuming task
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
