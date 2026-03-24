import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orchestrator } from '@/lib/orchestrator';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  // Si envían un taskId, devolvemos un estado específico (Polling UI Dashboard)
  if (taskId) {
    const state = await orchestrator.getStatus(taskId);
    if (!state) {
      return NextResponse.json({ success: false, error: 'Task no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, state });
  }

  // Si no hay taskId, devolvemos todo (para la vista genérica de Logs y Tareas pendientes)
  return NextResponse.json({
    success: true,
    logs: await db.getLogs(),
    tasks: await db.getAllTasks()
  });
}
