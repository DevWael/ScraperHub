import { NextRequest, NextResponse } from 'next/server';
import { taskRunOperations } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;
    
    // Get all runs for this task
    const runs = taskRunOperations.getByTaskId.all(taskId);
    
    return NextResponse.json({
      success: true,
      runs: runs || [],
      total: runs?.length || 0
    });

  } catch (error) {
    // Error fetching task runs
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
