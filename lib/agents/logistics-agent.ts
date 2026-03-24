import { BaseAgent } from './base-agent';
import { OrchestratorState } from '@/types';

export class LogisticsAgent extends BaseAgent {
  constructor() {
    super('LOGISTICS');
  }

  async process(state: OrchestratorState): Promise<OrchestratorState> {
    const startTime = Date.now();
    
    const systemPrompt = `Eres el Agente de Logística e Inventario de Omni-OS para una Tienda de Ropa.
    Analiza la alerta de bajo stock y genera un reporte de reposición para almacén.
    Sé muy breve y estructurado.`;

    const userPrompt = `Alerta: Quedan 2 unidades de Camisa Polo Talla M color Azul. Calcula reposición necesaria para 30 días.`;

    const inventoryReport = await this.callAI(systemPrompt, userPrompt);

    await this.logForensicAudit(state.taskId, 'AUDITORIA_INVENTARIO', 'Se detectó bajo stock y se calculó reposición.', Date.now() - startTime);

    return {
      ...state,
      status: 'FINANCE_APPROVAL',
      artifacts: { ...state.artifacts, inventoryReport },
      updatedAt: new Date().toISOString()
    };
  }
}
