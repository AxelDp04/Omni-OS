import { BaseAgent } from './base-agent';
import { OrchestratorState } from '@/types';

export class SalesAgent extends BaseAgent {
  constructor() {
    super('SALES');
  }

  async process(state: OrchestratorState): Promise<OrchestratorState> {
    const startTime = Date.now();
    
    const systemPrompt = `Eres el Agente de Ventas y Marketing de Omni-OS.
    Genera un JSON simulado con la actualización del catálogo web indicando "Próximamente en Stock".
    Sé muy breve, estilo log de terminal.`;

    const salesUpdateStr = await this.callAI(systemPrompt, "Actualizar catálogo: Camisa Polo Azul Talla M llegando la próxima semana.");

    await this.logForensicAudit(state.taskId, 'ACTUALIZACION_ECOMMERCE', 'Se actualizó la tienda online con llegada de nuevo stock.', Date.now() - startTime);

    return {
      ...state,
      status: 'COMPLETED',
      artifacts: { ...state.artifacts, salesUpdateStr },
      updatedAt: new Date().toISOString()
    };
  }
}
