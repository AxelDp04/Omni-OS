export type AgentRole = 'HR' | 'LEGAL' | 'IT' | 'LOGISTICS' | 'FINANCE' | 'SALES' | 'ORCHESTRATOR' | 'DYNAMIC';

export type TaskStatus = 
  | 'PENDING' 
  | 'HR_PROCESSING' | 'LEGAL_REVIEW' | 'IT_PROVISIONING' 
  | 'LOGISTICS_CHECK' | 'FINANCE_APPROVAL' | 'SALES_UPDATE'
  | 'DYNAMIC_STEP_1' | 'DYNAMIC_STEP_2' | 'DYNAMIC_STEP_3'
  | 'COMPLETED' | 'FAILED' | 'NEEDS_HUMAN_REVIEW';

export type WorkflowType = 'ONBOARDING' | 'RETAIL_INVENTORY' | 'CUSTOM_DYNAMIC';

export type AgentStatus = 'WAITING' | 'PROCESSING' | 'ACTIVE';

export interface AuditLogEntry {
  id: string;
  taskId: string;
  agentRole: AgentRole | string;
  actionTaken: string;
  logicReasoning: string;
  timestamp: string;
  durationMs: number;
}

export interface DynamicAgentDef {
  id: string;
  name: string;
  roleDesc: string;
  power: string;
  systemPrompt: string;
}

export interface OrchestratorState {
  taskId: string;
  workflowType: WorkflowType;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  context: {
    employeeName?: string;
    department?: string;
    position?: string;
    customPrompt?: string; 
    [key: string]: any;
  };
  dynamicAgents?: DynamicAgentDef[];
  artifacts: {
    hrDocument?: string;
    legalReview?: string;
    itProvisioningStr?: string;
    inventoryReport?: string;
    financeReport?: string;
    salesUpdateStr?: string;
    dynamicResult1?: string;
    dynamicResult2?: string;
    dynamicResult3?: string;
  };
}

// --- PHASE 12: POLICY ENGINE & GOVERNANCE ---
export type RuleOperator = '==' | '!=' | '>=' | '<=' | '>' | '<' | 'INCLUDES' | 'EXCLUDES';
export type RuleAction = 'REJECT' | 'BLOCK' | 'FLAG';
export type RuleSeverity = 'BLOCKER' | 'WARNING';

export interface PolicyRule {
  id: string;
  field: string;
  operator: RuleOperator;
  value: any;
  action: RuleAction;
  severity: RuleSeverity;
  priority: number; // Mayor prioridad = sobreescribe a las de menor prioridad en caso de conflicto
  errorMessage: string;
}

export interface CompanyPolicy {
  companyId: string;
  name: string;
  version: string;
  isActive: boolean;
  rules: PolicyRule[];
}

export interface EvaluationResult {
  status: 'APPROVED' | 'REJECTED' | 'NEEDS_HUMAN_REVIEW';
  reasons: string[];
  warnings: string[];
  violatedRules: string[];
}
