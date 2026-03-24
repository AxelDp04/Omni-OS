import { BaseAgent } from './base-agent';
import { OrchestratorState } from '@/types';

/**
 * Agente de Tecnologías de la Información (IT Agent)
 * 
 * Responsabilidad:
 * Recibe un perfil de empleado ya aprobado por RRHH y Legal,
 * y genera las instrucciones de aprovisionamiento de software
 * (correo electrónico, acceso a VPN, licencias de Office/Slack).
 */
export class ITAgent extends BaseAgent {
  constructor() {
    super('IT');
  }

  async process(state: OrchestratorState): Promise<OrchestratorState> {
    const startTime = Date.now();
    const { employeeName, department } = state.context;

    // 1. El Agente de IT es el último eslabón, necesita saber a quién le crea cuentas
    if (!employeeName) {
      await this.logForensicAudit(state.taskId, 'ERROR_DATOS', 'Falta el nombre para crear la cuenta de red.', Date.now() - startTime);
      throw new Error("Nombre requerido para aprovisionamiento IT.");
    }

    // 2. Construir la orden de provisión
    const systemPrompt = `
      Eres el Agente de IT Infraestructura de Omni-OS.
      Genera una lista técnica (JSON simulado o viñetas) de las credenciales
      generadas para el empleado.
      Incluye: Email corporativo, accesos por defecto y permisos de red según su departamento.
      Sé extremadamente conciso. Estilo "Log de Terminal".
    `;

    const userPrompt = `Empleado: ${employeeName}. Departamento: ${department}.`;

    // 3. Ejecutar la llamada a la IA
    const itProvisioningStr = await this.callAI(systemPrompt, userPrompt);

    // 4. Log forense documentando que se crearon los accesos sin intervención humana
    await this.logForensicAudit(
      state.taskId,
      'APROVISIONAMIENTO_COMPLETADO',
      `Se generaron cuentas y accesos para ${department} automáticamente.`,
      Date.now() - startTime
    );

    // 5. Como el Agente IT es el último, el estado finaliza y requiere Aprobación Ejecutiva (Human in the loop)
    return {
      ...state,
      status: 'COMPLETED', // Terminado, listo para revisión humana final
      artifacts: {
        ...state.artifacts,
        itProvisioningStr,
      },
      updatedAt: new Date().toISOString()
    };
  }
}
