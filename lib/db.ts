import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './db/schema';
import { AuditLogEntry, OrchestratorState, CompanyPolicy } from '@/types';
import { DateTime } from 'luxon';

// Configurando la conexión a Neon y Drizzle ORM
const sql = neon(process.env.DATABASE_URL!);
export const dbConn = drizzle(sql, { schema });

/**
 * Motor de Base de Datos Real (Producción)
 * Sustituye al antiguo InMemoryDB, utilizando PostgreSQL (Neon.tech)
 * y Drizzle ORM para garantizar persistencia e Idempotencia real.
 */
class DatabaseEngine {
  
  // Constructor para seed de datos (En desarrollo)
  constructor() {
    this.seedDefaultCompany();
  }

  private async seedDefaultCompany() {
    try {
      // 1. Verificar/Crear Company
      let comp = await dbConn.query.companies.findFirst({ where: eq(schema.companies.id, 'DEFAULT_COMPANY') });
      if (!comp) {
        await dbConn.insert(schema.companies).values({ id: 'DEFAULT_COMPANY', name: 'Omni-OS Standard' });
      }
      
      // 2. Verificar/Crear Policy
      let pol = await dbConn.query.policies.findFirst({ where: eq(schema.policies.companyId, 'DEFAULT_COMPANY') });
      if (!pol) {
        await dbConn.insert(schema.policies).values({ id: 'pol_1', companyId: 'DEFAULT_COMPANY', version: 1, isActive: true });
        
        // Reglas
        await dbConn.insert(schema.rules).values([
          { id: 'R1', policyId: 'pol_1', field: 'salary', operator: '>=', value: 120000, severity: 'BLOCKER', priority: 100, errorMessage: 'El salario no puede ser inferior al tabulador estándar de 120k.' },
          { id: 'R2', policyId: 'pol_1', field: 'nda_signed', operator: '==', value: true, severity: 'BLOCKER', priority: 100, errorMessage: 'Todo contrato requiere firma de NDA obligatoria.' }
        ]);
      }
    } catch(e) { /* Ignorar si ya está sembrado o hay error de concurrencia */ }
  }

  // --- Operaciones de Gobernanza ---
  async getPolicy(companyId: string = 'DEFAULT_COMPANY'): Promise<CompanyPolicy | undefined> {
    const policy = await dbConn.query.policies.findFirst({
      where: eq(schema.policies.companyId, companyId)
    });
    if (!policy) return undefined;

    const rules = await dbConn.query.rules.findMany({
      where: eq(schema.rules.policyId, policy.id)
    });

    return {
      companyId: policy.companyId,
      name: `Policy v${policy.version}`,
      version: String(policy.version),
      isActive: policy.isActive,
      rules: rules as any
    };
  }

  // --- Capa de Idempotencia ---
  async hasOperation(operationId: string): Promise<boolean> {
    const op = await dbConn.query.operations.findFirst({
      where: eq(schema.operations.operationId, operationId)
    });
    return !!op;
  }

  async getOperationResult(operationId: string): Promise<any> {
    const op = await dbConn.query.operations.findFirst({
      where: eq(schema.operations.operationId, operationId)
    });
    return op?.result as any;
  }

  async saveOperation(operationId: string, result: any) {
    try {
      await dbConn.insert(schema.operations).values({
        id: `op_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        operationId,
        status: 'SUCCESS',
        result
      });
    } catch(e) { /* Evitar crashes por carreras en UNIQUE */ }
  }


  // --- Operaciones de Estado del Orquestador ---
  async saveState(state: OrchestratorState) {
    const existing = await dbConn.query.executions.findFirst({
      where: eq(schema.executions.id, state.taskId)
    });

    if (!existing) {
      await dbConn.insert(schema.executions).values({
        id: state.taskId,
        companyId: 'DEFAULT_COMPANY',
        policyVersionUsed: 1, // Fix hardcode to match seeded version
        workflowType: state.workflowType,
        status: state.status,
        fullState: state as object,
        isSimulation: false
      });
    } else {
      await dbConn.update(schema.executions)
        .set({ status: state.status, fullState: state as object, updatedAt: new Date() })
        .where(eq(schema.executions.id, state.taskId));
    }
  }

  async getState(taskId: string): Promise<OrchestratorState | undefined> {
    const exec = await dbConn.query.executions.findFirst({
      where: eq(schema.executions.id, taskId)
    });
    if (!exec || !exec.fullState) return undefined;
    
    // Devolvemos el JSONB con el payload compatible completo
    return exec.fullState as OrchestratorState;
  }

  async getAllTasks(): Promise<OrchestratorState[]> {
    const execs = await dbConn.query.executions.findMany({
      orderBy: (executions, { desc }) => [desc(executions.createdAt)]
    });
    const states = execs.map(exec => exec.fullState as OrchestratorState).filter(e => e);
    return states;
  }

  // --- Operaciones de Auditoría Forense ---
  async logAction(entry: AuditLogEntry) {
    await dbConn.insert(schema.executionLogs).values({
      id: entry.id,
      executionId: entry.taskId,
      agentRole: entry.agentRole,
      actionTaken: entry.actionTaken,
      message: entry.logicReasoning,
      durationMs: entry.durationMs || 0,
      attempts: 1,
      wasCorrected: false,
      escalatedToHuman: false,
      timestamp: new Date(entry.timestamp)
    });
  }

  async getLogs(): Promise<AuditLogEntry[]> {
    const logs = await dbConn.query.executionLogs.findMany({
      orderBy: (logs, { desc }) => [desc(logs.timestamp)],
      limit: 50 // Para interfaz rápida
    });

    return logs.map(l => ({
      id: l.id,
      taskId: l.executionId,
      agentRole: l.agentRole as any,
      actionTaken: l.actionTaken,
      logicReasoning: l.message,
      timestamp: l.timestamp.toISOString(),
      durationMs: l.durationMs
    }));
  }
}

// Singleton Drizzle Wrapper
const globalForDb = globalThis as unknown as { db: DatabaseEngine | undefined; };
export const db = globalForDb.db ?? new DatabaseEngine();
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
