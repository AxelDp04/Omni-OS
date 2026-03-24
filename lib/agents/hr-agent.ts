import { BaseAgent } from './base-agent';
import { OrchestratorState } from '@/types';

/**
 * Agente de Recursos Humanos (HR Agent)
 * 
 * Responsabilidad:
 * Recibe los datos básicos del nuevo empleado y redacta el contrato
 * inicial o paquete de bienvenida. Representa el primer paso en el
 * proceso de Onboarding.
 */
import { z } from 'zod';

export class HRAgent extends BaseAgent {
  constructor() {
    super('HR');
  }

  // Definimos el contrato de datos esperado usando Zod
  private schema = z.object({
    employeeName: z.string(),
    salary: z.number(),
    nda_signed: z.boolean(),
    documentText: z.string()
  });

  async process(state: OrchestratorState): Promise<OrchestratorState> {
    const startTime = Date.now();
    const { employeeName, position, department } = state.context;

    if (!employeeName || !position) {
      await this.logForensicAudit(state.taskId, 'RECHAZO_POR_DATOS', 'Falta nombre o posición.', Date.now() - startTime);
      throw new Error("Datos requeridos no proporcionados.");
    }

    const systemPrompt = `Eres el Agente Corporativo de Recursos Humanos.
Debes crear un documento de Oferta Laboral.
Asume que el empleado NO ha firmado NDA a menos que se especifique lo contrario.
Genera un salario inicial propuesto.`;

    const userPrompt = `Empleado: ${employeeName}
Posición: ${position}
Departamento: ${department}

Propón tú un salario razonable o el de mercado.`;

    try {
      const { data, warnings, attempts } = await this.executeWithGovernance(
        state.taskId,
        'crear_contrato',
        systemPrompt,
        userPrompt,
        this.schema
      );

      let finalSummary = `Contrato redactado. Salario final auto-corregido: $${data.salary}. Intentos requeridos: ${attempts}.`;
      if (warnings.length > 0) finalSummary += ` Advertencias: ${warnings.join(', ')}.`;

      await this.logForensicAudit(state.taskId, 'GENERACION_CONTRATO_GOBERNADO', finalSummary, Date.now() - startTime);

      return {
        ...state,
        status: warnings.length > 0 ? 'NEEDS_HUMAN_REVIEW' : 'LEGAL_REVIEW',
        artifacts: { ...state.artifacts, hrDocument: data.documentText },
        updatedAt: new Date().toISOString()
      };

    } catch (e: any) {
      if (e.message === "NEEDS_HUMAN_REVIEW_EXHAUSTED") {
        return { ...state, status: 'NEEDS_HUMAN_REVIEW', updatedAt: new Date().toISOString() };
      }
      throw e;
    }
  }
}
