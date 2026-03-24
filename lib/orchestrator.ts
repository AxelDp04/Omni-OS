import { OrchestratorState, WorkflowType, DynamicAgentDef } from '@/types';
import { db } from './db';
import { HRAgent } from './agents/hr-agent';
import { LegalAgent } from './agents/legal-agent';
import { ITAgent } from './agents/it-agent';
import { LogisticsAgent } from './agents/logistics-agent';
import { FinanceAgent } from './agents/finance-agent';
import { SalesAgent } from './agents/sales-agent';
import { DynamicAgent } from './agents/dynamic-agent';
import { DateTime } from 'luxon';

/**
 * El Cerebro Central (The Orchestrator)
 */
export class Orchestrator {
  private hr = new HRAgent();
  private legal = new LegalAgent();
  private it = new ITAgent();

  private logistics = new LogisticsAgent();
  private finance = new FinanceAgent();
  private sales = new SalesAgent();

  async startWorkflow(context: OrchestratorState['context'], workflowType: WorkflowType = 'ONBOARDING', dynamicAgents?: DynamicAgentDef[]): Promise<string> {
    const taskId = `task_${Date.now()}`;
    
    // Estado y Origen según el tipo de flujo
    let initialStatus: any = 'HR_PROCESSING';
    if (workflowType === 'RETAIL_INVENTORY') initialStatus = 'LOGISTICS_CHECK';
    if (workflowType === 'CUSTOM_DYNAMIC') initialStatus = 'DYNAMIC_STEP_1';

    let state: OrchestratorState = {
      taskId,
      workflowType,
      status: initialStatus,
      createdAt: DateTime.now().setZone('UTC').toISO() || new Date().toISOString(),
      updatedAt: DateTime.now().setZone('UTC').toISO() || new Date().toISOString(),
      context,
      dynamicAgents,
      artifacts: {}
    };

    await db.saveState(state);
    
    await db.logAction({
      id: `log_${Date.now()}`,
      taskId,
      agentRole: 'ORCHESTRATOR',
      actionTaken: `INICIO_FLUJO_${workflowType}`,
      logicReasoning: `Flujo disparado. Contexto: ${context.customPrompt || context.employeeName || 'Retail Stock'}`,
      timestamp: DateTime.now().setZone('UTC').toISO() || new Date().toISOString(),
      durationMs: 0
    });

    this.runPipeline(taskId, workflowType).catch(async (err) => {
      console.error('El pipeline falló catastróficamente:', err);
      const failedState = await db.getState(taskId);
      if (failedState) {
        await db.saveState({ ...failedState, status: 'FAILED' });
      }
    });

    return taskId;
  }

  private async runPipeline(taskId: string, workflowType: WorkflowType) {
    let currentState = (await db.getState(taskId))!;

    try {
      if (workflowType === 'ONBOARDING') {
        currentState = await this.hr.process(currentState);
        await db.saveState(currentState);
        if (currentState.status === 'NEEDS_HUMAN_REVIEW') return;
        await new Promise(r => setTimeout(r, 2000));

        currentState = await this.legal.process(currentState);
        await db.saveState(currentState);
        if (currentState.status === 'NEEDS_HUMAN_REVIEW') return;
        await new Promise(r => setTimeout(r, 2000));

        currentState = await this.it.process(currentState);
        await db.saveState(currentState);
        if (currentState.status === 'NEEDS_HUMAN_REVIEW') return;
      } 
      else if (workflowType === 'RETAIL_INVENTORY') {
        currentState = await this.logistics.process(currentState);
        await db.saveState(currentState);
        if (currentState.status === 'NEEDS_HUMAN_REVIEW') return;
        await new Promise(r => setTimeout(r, 2000));

        currentState = await this.finance.process(currentState);
        await db.saveState(currentState);
        if (currentState.status === 'NEEDS_HUMAN_REVIEW') return;
        await new Promise(r => setTimeout(r, 2000));

        currentState = await this.sales.process(currentState);
        await db.saveState(currentState);
        if (currentState.status === 'NEEDS_HUMAN_REVIEW') return;
      }
      else if (workflowType === 'CUSTOM_DYNAMIC') {
        if (!currentState.dynamicAgents || currentState.dynamicAgents.length < 3) throw new Error("Missing Dynamic Agents");
        
        const agent1 = new DynamicAgent(currentState.dynamicAgents[0], 1);
        currentState = await agent1.process(currentState);
        await db.saveState(currentState);
        if (currentState.status === 'NEEDS_HUMAN_REVIEW') return;
        await new Promise(r => setTimeout(r, 2000));

        const agent2 = new DynamicAgent(currentState.dynamicAgents[1], 2);
        currentState = await agent2.process(currentState);
        await db.saveState(currentState);
        if (currentState.status === 'NEEDS_HUMAN_REVIEW') return;
        await new Promise(r => setTimeout(r, 2000));

        const agent3 = new DynamicAgent(currentState.dynamicAgents[2], 3);
        currentState = await agent3.process(currentState);
        await db.saveState(currentState);
        if (currentState.status === 'NEEDS_HUMAN_REVIEW') return;
      }

      // Finalización
      await db.logAction({
        id: `log_${Date.now()}_end`,
        taskId,
        agentRole: 'ORCHESTRATOR',
        actionTaken: 'FIN_FLUJO',
        logicReasoning: `Secuencia de Agentes completada. Esperando Aprobación Ejecutiva.`,
        timestamp: DateTime.now().setZone('UTC').toISO() || new Date().toISOString(),
        durationMs: 0
      });

    } catch (error: any) {
      await db.saveState({ ...currentState, status: 'FAILED' });
      await db.logAction({
        id: `log_${Date.now()}_err`,
        taskId,
        agentRole: 'ORCHESTRATOR',
        actionTaken: 'INTERRUPCION_EMERGENCIA',
        logicReasoning: `Error en tiempo de ejecución: ${error.message}`,
        timestamp: DateTime.now().setZone('UTC').toISO() || new Date().toISOString(),
        durationMs: 0
      });
    }
  }

  async getStatus(taskId: string): Promise<OrchestratorState | undefined> {
    return await db.getState(taskId);
  }
}

export const orchestrator = new Orchestrator();
