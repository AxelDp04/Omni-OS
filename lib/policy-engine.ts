import { CompanyPolicy, EvaluationResult, PolicyRule } from '@/types';

export class PolicyEngine {
  
  /**
   * Evalúa un documento JSON (parseado a Objeto) contra las políticas corporativas.
   * Utiliza lógica determinística de resolución de conflictos por prioridad.
   */
  evaluate(document: any, policy: CompanyPolicy | undefined): EvaluationResult {
    const result: EvaluationResult = {
      status: 'APPROVED',
      reasons: [],
      warnings: [],
      violatedRules: []
    };

    if (!policy || !policy.isActive || policy.rules.length === 0) {
      return result; // Sin política, es pase libre.
    }

    // Ordenamos reglas por prioridad (mayor a menor) para que tengan precedencia
    const sortedRules = [...policy.rules].sort((a, b) => b.priority - a.priority);
    const evaluatedFields = new Set<string>();

    for (const rule of sortedRules) {
      // Resolución de conflictos: Si un campo ya fue evaluado por una regla de mayor prioridad, saltamos las de menor.
      if (evaluatedFields.has(rule.field)) continue;
      evaluatedFields.add(rule.field);

      const docValue = document[rule.field];
      const passed = this.evaluateCondition(docValue, rule);

      if (!passed) {
        if (rule.severity === 'BLOCKER') {
          result.status = 'REJECTED';
          result.reasons.push(`[${rule.field}]: ${rule.errorMessage}`);
          result.violatedRules.push(rule.id);
        } else if (rule.severity === 'WARNING') {
          result.warnings.push(`[${rule.field}]: ${rule.errorMessage}`);
          // Status se mantiene, a menos que ya estuviera rechazado.
          if (result.status === 'APPROVED') result.status = 'NEEDS_HUMAN_REVIEW';
        }
      }
    }

    return result;
  }

  private evaluateCondition(docValue: any, rule: PolicyRule): boolean {
    // Si el valor no existe en el documento y lo estamos validando, falla.
    if (docValue === undefined || docValue === null) return false;

    switch (rule.operator) {
      case '==': return docValue === rule.value;
      case '!=': return docValue !== rule.value;
      case '>=': return docValue >= rule.value;
      case '<=': return docValue <= rule.value;
      case '>': return docValue > rule.value;
      case '<': return docValue < rule.value;
      case 'INCLUDES': return String(docValue).includes(String(rule.value));
      case 'EXCLUDES': return !String(docValue).includes(String(rule.value));
      default: return false; // Operador desconocido falla seguro.
    }
  }
}

export const policyEngine = new PolicyEngine();
