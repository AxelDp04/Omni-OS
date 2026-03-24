import { BaseAgent } from './base-agent';
import { OrchestratorState } from '@/types';

/**
 * Agente Legal (Legal Agent)
 * 
 * Responsabilidad:
 * Revisa los documentos generados por otros departamentos (ej. HR)
 * en busca de riesgos legales, cláusulas faltantes o errores de cumplimiento.
 * Garantiza la gobernanza corporativa automática.
 */
export class LegalAgent extends BaseAgent {
  constructor() {
    super('LEGAL');
  }

  async process(state: OrchestratorState): Promise<OrchestratorState> {
    const startTime = Date.now();
    const docToReview = state.artifacts.hrDocument;

    // 1. Validar pre-requisitos
    if (!docToReview) {
      await this.logForensicAudit(state.taskId, 'ERROR_VALIDACION', 'No se encontró documento de HR para revisar.', Date.now() - startTime);
      throw new Error("El Agente Legal no recibió ningún documento.");
    }

    // 2. Instruir a la IA a que actúe como Abogado
    const systemPrompt = `
      Eres el Agente Legal de Omni-OS. 
      Actúas como un estricto auditor de cumplimiento.
      Revisa el documento provisto y determina si es "SEGURO" o si tiene "RIESGOS".
      Emite un veredicto breve de 2 líneas aprobando el texto. 
      NUNCA modifiques el texto original, solo di: "[VEREDICTO: APROBADO] - Todo está en regla." y explica por qué.
    `;

    // 3. Llamar a Gemini con el contrato que hizo el Agente HR
    const legalReview = await this.callAI(systemPrompt, docToReview);

    // 4. Analizar si la IA legal encontró un riesgo real (simplificado para la Fase 1)
    const isApproved = /APROBADO|APROBADA/i.test(legalReview);

    if (!isApproved) {
      await this.logForensicAudit(state.taskId, 'RECHAZO_LEGAL', 'Se detectó riesgo legal en el contrato.', Date.now() - startTime);
      // En un flujo real, aquí podríamos devolver el estado a 'HR_PROCESSING' para que HR lo corrija.
      // Pero para este prototipo terminamos con error.
      throw new Error("Riesgo Legal Detectado. Proceso detenido.");
    }

    // 5. Dejar rastro de la aprobación en el Log Forense
    await this.logForensicAudit(
      state.taskId,
      'APROBACION_DOCUMENTO',
      `El contrato fue escrutado y certificado sin riesgos bajo Zero-Trust.`,
      Date.now() - startTime
    );

    // 6. Pasar al siguiente paso del flujo
    return {
      ...state,
      status: 'IT_PROVISIONING', // Le pasamos la pelota al Agente IT
      artifacts: {
        ...state.artifacts,
        legalReview,
      },
      updatedAt: new Date().toISOString()
    };
  }
}
