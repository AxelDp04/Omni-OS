import { BaseAgent } from './base-agent';
import { OrchestratorState } from '@/types';

export class FinanceAgent extends BaseAgent {
  constructor() {
    super('FINANCE');
  }

  async process(state: OrchestratorState): Promise<OrchestratorState> {
    const startTime = Date.now();
    const prevReport = state.artifacts.inventoryReport || '';
    
    const systemPrompt = `Eres el Agente Financiero de Omni-OS. 
    Lee el reporte de inventario y aprueba el presupuesto de compra.
    Responde con: [PRESUPUESTO APROBADO] y un costo estimado breve. NO cambies el formato.`;

    const financeReport = await this.callAI(systemPrompt, prevReport);

    await this.logForensicAudit(state.taskId, 'APROBACION_PRESUPUESTO', 'Fondos liberados para reabastecimiento de ropa.', Date.now() - startTime);

    return {
      ...state,
      status: 'SALES_UPDATE',
      artifacts: { ...state.artifacts, financeReport },
      updatedAt: new Date().toISOString()
    };
  }
}
