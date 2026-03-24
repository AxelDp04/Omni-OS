import { BaseAgent } from './base-agent';
import { OrchestratorState, DynamicAgentDef } from '@/types';

export class DynamicAgent extends BaseAgent {
  private def: DynamicAgentDef;
  private step: 1 | 2 | 3;

  constructor(def: DynamicAgentDef, step: 1 | 2 | 3) {
    super('DYNAMIC'); // Se sobreescribirá en el log
    this.def = def;
    this.step = step;
  }

  async process(state: OrchestratorState): Promise<OrchestratorState> {
    const startTime = Date.now();
    
    // El prompt de sistema dinámico generado por el Meta-Agente
    const systemPrompt = `Eres ${this.def.name}, el Agente de ${this.def.roleDesc} en Omni-OS.\n${this.def.systemPrompt}\nRecuerda ser estructurado, profesional y actuar como un bot automatizado que genera un log rápido o resultado útil. Sé conciso pero extremadamente detallado en los datos y análisis.`;

    // Recopilar el trabajo anterior y el contexto
    let userPrompt = `Contexto del Negocio: ${state.context.customPrompt}\n`;
    if (this.step > 1) userPrompt += `\nResultado del Agente Anterior (Paso 1):\n${state.artifacts.dynamicResult1}`;
    if (this.step > 2) userPrompt += `\nResultado del Agente Anterior (Paso 2):\n${state.artifacts.dynamicResult2}`;
    
    userPrompt += `\n\nEjecuta tu rol asignado y entrega el resultado final.`;

    const result = await this.callAI(systemPrompt, userPrompt);

    // Registrar en auditoría usando el nombre dinámico del Agente
    await this.logForensicAuditOverride(
      state.taskId,
      this.def.name.toUpperCase().replace(/\s+/g, '_'),
      'EJECUCION_DINAMICA',
      `Actuó bajo el rol de ${this.def.name} aplicando su poder específico de la cadena.`,
      Date.now() - startTime
    );

    // Actualizar estado y artefactos dinámicos
    const nextStatus = this.step === 1 ? 'DYNAMIC_STEP_2' : this.step === 2 ? 'DYNAMIC_STEP_3' : 'COMPLETED';
    const artifactKey = `dynamicResult${this.step}` as keyof typeof state.artifacts;

    return {
      ...state,
      status: nextStatus as any,
      artifacts: { ...state.artifacts, [artifactKey]: result },
      updatedAt: new Date().toISOString()
    };
  }

  // Permite sobreescribir el AgentRole genérico por el nombre real en los logs
  protected async logForensicAuditOverride(taskId: string, agentName: string, action: string, logic: string, duration: number) {
    const { db } = await import('../db');
    await db.logAction({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      taskId,
      agentRole: agentName as any,
      actionTaken: action,
      logicReasoning: logic,
      timestamp: new Date().toISOString(),
      durationMs: duration
    });
  }
}
