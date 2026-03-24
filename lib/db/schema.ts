import { pgTable, text, timestamp, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';

export const companies = pgTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const policies = pgTable('policies', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id).notNull(),
  version: integer('version').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('idx_policies_company').on(table.companyId)
}));

export const rules = pgTable('rules', {
  id: text('id').primaryKey(),
  policyId: text('policy_id').references(() => policies.id).notNull(),
  field: text('field').notNull(),
  operator: text('operator').notNull(), // >=, ==, <, INCLUDES...
  value: jsonb('value').notNull(), // Soporta numbers, strings, booleanos
  severity: text('severity').notNull(), // BLOCKER | WARNING
  priority: integer('priority').notNull(),
  action: text('action').notNull().default('REJECT'),
  errorMessage: text('error_message').notNull(),
}, (table) => ({
  policyIdx: index('idx_rules_policy').on(table.policyId)
}));

export const dataContracts = pgTable('data_contracts', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id).notNull(),
  workflowType: text('workflow_type').notNull(),
  mappingPayload: jsonb('mapping_payload').notNull(), // ej: { "sueldo_externo": "salary" }
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const executions = pgTable('executions', {
  id: text('id').primaryKey(), // Equivalente a taskId
  companyId: text('company_id').references(() => companies.id).notNull(),
  policyVersionUsed: integer('policy_version_used').notNull(),
  workflowType: text('workflow_type').notNull(),
  status: text('status').notNull(), // PENDING | APPROVED | REJECTED | NEEDS_HUMAN_REVIEW | COMPLETED
  isSimulation: boolean('is_simulation').default(false).notNull(),
  fullState: jsonb('full_state'), // Mantiene compatibilidad con OrchestratorState (artifacts, context)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('idx_executions_company').on(table.companyId)
}));

export const executionLogs = pgTable('execution_logs', {
  id: text('id').primaryKey(),
  executionId: text('execution_id').references(() => executions.id).notNull(),
  agentRole: text('agent_role').notNull(),
  actionTaken: text('action_taken').notNull(),
  message: text('message').notNull(), // Forensic reasoning
  durationMs: integer('duration_ms').notNull(),
  attempts: integer('attempts').default(1).notNull(),
  wasCorrected: boolean('was_corrected').default(false).notNull(),
  escalatedToHuman: boolean('escalated_to_human').default(false).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  executionIdx: index('idx_execution_logs_exec').on(table.executionId)
}));

export const operations = pgTable('operations', {
  id: text('id').primaryKey(),
  operationId: text('operation_id').unique().notNull(), // OBLIGATORIO para Idempotencia Estricta
  status: text('status').notNull(), // SUCCESS | FAILED
  result: jsonb('result'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  operationIdx: index('idx_operations_id').on(table.operationId) // Índice en el operation_id para búsquedas instantáneas
}));
