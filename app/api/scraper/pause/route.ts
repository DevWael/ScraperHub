import { NextRequest, NextResponse } from 'next/server';
import { TaskActionRequest } from '@/types/task';

// In-memory storage for active tasks (shared with start route)
declare global {
  var activeTasks: Map<string, any>;
}

if (!global.activeTasks) {
  global.activeTasks = new Map();
}

export async function POST(request: NextRequest) {
  try {
    const body: TaskActionRequest = await request.json();
    const { taskId } = body;

    const task = global.activeTasks.get(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or not running' },
        { status: 404 }
      );
    }

    // Update task status
    task.status = 'paused';
    global.activeTasks.set(taskId, task);

    return NextResponse.json({
      success: true,
      taskId,
      message: 'Task paused successfully',
    });

  } catch (error) {
    // Error pausing task
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
