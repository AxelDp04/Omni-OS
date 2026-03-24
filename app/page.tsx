'use client';

import { useState, useEffect } from 'react';
import { Play, CheckCircle, Database, Clock, DollarSign, Users, Scale, Server, Sparkles, ChevronRight, Package, Calculator, Megaphone, Target, Bot, Zap, BrainCircuit } from 'lucide-react';
import { AuditLogEntry, OrchestratorState, WorkflowType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const [isRunning, setIsRunning] = useState(false);
  // Nuevo estado de "Planificando": cuando le damos Start a un flujo dinámico y Gemini está creando los 3 agentes
  const [isPlanning, setIsPlanning] = useState(false);
  
  const [taskId, setTaskId] = useState<string | null>(null);
  const [state, setState] = useState<OrchestratorState | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType>('ONBOARDING');
  const [customPrompt, setCustomPrompt] = useState('');

  const startWorkflow = async () => {
    if (selectedWorkflow === 'CUSTOM_DYNAMIC' && !customPrompt.trim()) {
      alert("Por favor describe el proceso empresarial que quieres automatizar.");
      return;
    }

    setIsRunning(true);
    setTaskId(null);
    setState(null);
    setElapsedMs(0);
    
    // Si es personalizable, primero encendemos la UI del "Meta-Arquitecto"
    if (selectedWorkflow === 'CUSTOM_DYNAMIC') {
      setIsPlanning(true);
    }

    try {
      const res = await fetch('/api/orchestrator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowType: selectedWorkflow,
          customPrompt: selectedWorkflow === 'CUSTOM_DYNAMIC' ? customPrompt : undefined,
          employeeName: selectedWorkflow === 'ONBOARDING' ? 'Axel Perez' : 'N/A',
          department: selectedWorkflow === 'ONBOARDING' ? 'Ingeniería AI' : 'Operaciones',
          position: selectedWorkflow === 'ONBOARDING' ? 'Enterprise Architect' : 'N/A'
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsPlanning(false);
        setTaskId(data.taskId);
      } else {
        alert(data.error);
        setIsRunning(false);
        setIsPlanning(false);
      }
    } catch (e) {
      console.error(e);
      setIsRunning(false);
      setIsPlanning(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && state?.status !== 'COMPLETED' && state?.status !== 'FAILED') {
      timer = setInterval(() => setElapsedMs(prev => prev + 100), 100);
    }
    return () => clearInterval(timer);
  }, [isRunning, state?.status]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const url = taskId 
          ? `/api/orchestrator/status?taskId=${taskId}` 
          : `/api/orchestrator/status`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success) {
          if (taskId && data.state) {
            setState(data.state);
            if (data.state.status === 'COMPLETED' || data.state.status === 'FAILED') {
              setIsRunning(false);
            }
          }
          if (data.logs) {
            setLogs(data.logs);
          }
        } else {
          // Si el backend pierde memoria (HMR) o la tarea no existe, abortar
          if (taskId) {
             console.error('El servidor perdió el rastro de la tarea.');
             setIsRunning(false);
             setTaskId(null);
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    };

    const interval = setInterval(fetchStatus, 1000);
    fetchStatus();

    return () => clearInterval(interval);
  }, [taskId]);

  const isAgentActive = (statusStr: string) => state?.status === statusStr;
  const hasAgentFinished = (targetStatus: string) => {
    if (!state?.status) return false;
    if (state.status === 'COMPLETED') return true;
    
    const onboardingOrder = ['PENDING', 'HR_PROCESSING', 'LEGAL_REVIEW', 'IT_PROVISIONING', 'COMPLETED', 'FAILED'];
    const retailOrder = ['PENDING', 'LOGISTICS_CHECK', 'FINANCE_APPROVAL', 'SALES_UPDATE', 'COMPLETED', 'FAILED'];
    const dynamicOrder = ['PENDING', 'DYNAMIC_STEP_1', 'DYNAMIC_STEP_2', 'DYNAMIC_STEP_3', 'COMPLETED', 'FAILED'];
    
    let activeOrder = onboardingOrder;
    if (state.workflowType === 'RETAIL_INVENTORY') activeOrder = retailOrder;
    if (state.workflowType === 'CUSTOM_DYNAMIC') activeOrder = dynamicOrder;
    
    const targetIdx = activeOrder.indexOf(targetStatus);
    const currIdx = activeOrder.indexOf(state.status);
    
    return currIdx > targetIdx;
  };

  const getStatusLabel = (statusStr: string, activeLabel: string) => {
    return hasAgentFinished(statusStr) ? 'Completado' : isAgentActive(statusStr) ? activeLabel : 'En Espera';
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
      
      {/* 
        ========================================================
        HERO SECTION & WORKFLOW SELECTOR
        ========================================================
      */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0f111a] border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-cyan/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 p-8 md:p-12 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 flex items-center gap-3">
               La Fábrica Digital <Sparkles className="w-8 h-8 text-brand-cyan" />
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              Elige un proceso predefinido o descríbelo con tus propias palabras. 
              Omni-OS asignará o fabricará los cerebros de IA necesarios al instante.
            </p>
          </div>
        </div>
        
        {/* Selector de Casos de Uso */}
        <div className="p-8 md:p-12 bg-black/40 flex flex-col items-center justify-between gap-6 border-b border-white/5">
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-violet" />
                Selecciona o Escribe un Flujo:
              </label>
              <select 
                value={selectedWorkflow}
                onChange={(e) => {
                  setSelectedWorkflow(e.target.value as WorkflowType);
                  setTaskId(null);
                  setState(null);
                }}
                disabled={isRunning}
                className="w-full bg-[#1a1f2e] border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-cyan transition-all"
              >
                <option value="ONBOARDING">👔 Corporativo: Empleado Nuevo (Onboarding)</option>
                <option value="RETAIL_INVENTORY">🛍️ Retail: Auditoría de Inventario</option>
                <option value="CUSTOM_DYNAMIC">✨ Personalizado: Escribe tu propio proceso</option>
              </select>
            </div>

            <div className="lg:col-span-1">
               <button 
                onClick={startWorkflow}
                disabled={isRunning}
                className={`w-full group relative px-8 py-3 rounded-xl font-bold text-lg overflow-hidden transition-all duration-500 shadow-xl border
                  ${isRunning 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700' 
                    : 'bg-[#1a1f2e] text-brand-cyan border-brand-cyan/50 hover:bg-brand-cyan hover:text-black hover:shadow-[0_0_30px_rgba(0,240,255,0.4)]'
                  }`}
              >
                <div className="relative z-10 flex items-center justify-center gap-3 h-8">
                  {isRunning ? (
                    <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-5 h-5 border-2 border-current border-t-transparent rounded-full" /> Procesando...</>
                  ) : (
                    <><Play className="w-5 h-5" /> {selectedWorkflow === 'CUSTOM_DYNAMIC' ? 'Diseñar y Ejecutar' : 'Ejecutar Tarea'}</>
                  )}
                </div>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {selectedWorkflow === 'CUSTOM_DYNAMIC' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="w-full pt-4"
              >
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                   Describe tu flujo en lenguaje natural:
                </label>
                <textarea 
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  disabled={isRunning}
                  placeholder="Ej: Necesito un proceso donde se reciba una factura de viáticos, se valide la legalidad del ticket, y se libere el pago al empleado..."
                  className="w-full bg-black/50 border border-brand-violet/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-violet focus:ring-1 focus:ring-brand-violet transition-all h-24 placeholder:text-gray-600"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Temporizador */}
        {isRunning && (
            <div className="w-full bg-black/60 py-3 text-center text-brand-cyan font-mono text-xl flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 animate-pulse" /> {(elapsedMs / 1000).toFixed(1)}s
            </div>
        )}
      </div>

      {/* 
        ========================================================
        LA LÍNEA DE MONTAJE DINÁMICA
        ========================================================
      */}
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-gray-400 tracking-widest uppercase ml-2 flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-brand-violet animate-pulse"></div>
           {selectedWorkflow === 'CUSTOM_DYNAMIC' && !state?.dynamicAgents ? 'Fabricando Agentes con IA...' : 'Línea de Ensamblaje AI'}
        </h3>

        {/* LOADING STATE FOR META-PLANNER */}
        <AnimatePresence>
          {isPlanning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center p-12 bg-[#0f111a] border border-brand-violet/20 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-brand-violet/5 animate-pulse"></div>
              <BrainCircuit className="w-16 h-16 text-brand-violet animate-bounce mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">El Meta-Arquitecto está pensando...</h3>
              <p className="text-gray-400 text-center max-w-md">Gemini está analizando tu petición para fabricar 3 arquitecturas de red neuronal a la medida. Esto tomará un par de segundos.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 relative pt-4 ${isPlanning ? 'hidden' : 'block'}`}>
          <div className="hidden lg:block absolute top-[4rem] left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-blue-500 via-amber-500 to-green-500 opacity-20 z-0"></div>

          {/* ONBOARDING */}
          {selectedWorkflow === 'ONBOARDING' && (
            <>
              {/* HR AGENT */}
              <motion.div layout className={`z-10 bg-[#0a0c10] border ${isAgentActive('HR_PROCESSING') ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20' : hasAgentFinished('HR_PROCESSING') ? 'border-white/10' : 'border-white/5'} rounded-2xl overflow-hidden`}>
                <div className={`p-6 border-b ${isAgentActive('HR_PROCESSING') ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${hasAgentFinished('HR_PROCESSING') ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400'}`}><Users className="w-5 h-5" /></div>
                      <div>
                        <h3 className="font-bold text-white text-lg">Reclutador IA</h3><p className="text-xs text-gray-500">Recursos Humanos</p>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${isAgentActive('HR_PROCESSING') ? 'bg-blue-500/20 text-blue-400 animate-pulse' : hasAgentFinished('HR_PROCESSING') ? 'bg-white/10 text-gray-400' : 'bg-transparent text-gray-600'}`}>{getStatusLabel('HR_PROCESSING', 'Redactando...')}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-4 leading-relaxed">Escribe el contrato oficial y los acuerdos basándose en las plantillas.</p>
                </div>
                <div className="p-4 bg-black/50 h-56 overflow-y-auto">
                  {state?.artifacts.hrDocument ? <div className="text-xs text-blue-200/80 font-mono whitespace-pre-wrap">{state.artifacts.hrDocument}</div> : isAgentActive('HR_PROCESSING') ? <div className="flex items-center gap-2 text-blue-400/80 text-sm font-mono mt-4"><div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div> Tipeando políticas...</div> : null}
                </div>
              </motion.div>
              {/* LEGAL */}
              <motion.div layout className={`z-10 bg-[#0a0c10] border ${isAgentActive('LEGAL_REVIEW') ? 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20' : hasAgentFinished('LEGAL_REVIEW') ? 'border-white/10' : 'border-white/5'} rounded-2xl overflow-hidden`}>
                <div className={`p-6 border-b ${isAgentActive('LEGAL_REVIEW') ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/5'}`}>
                   <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${hasAgentFinished('LEGAL_REVIEW') ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-400'}`}><Scale className="w-5 h-5" /></div>
                      <div><h3 className="font-bold text-white text-lg">Abogado IA</h3><p className="text-xs text-gray-500">Legal y Riesgos</p></div>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${isAgentActive('LEGAL_REVIEW') ? 'bg-amber-500/20 text-amber-400 animate-pulse' : hasAgentFinished('LEGAL_REVIEW') ? 'bg-white/10 text-gray-400' : 'bg-transparent text-gray-600'}`}>{getStatusLabel('LEGAL_REVIEW', 'Auditando...')}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-4 leading-relaxed">Escanea el contrato final buscando fisuras legales o riesgos ocultos.</p>
                </div>
                <div className="p-4 bg-black/50 h-56 overflow-y-auto">
                  {state?.artifacts.legalReview ? <div className="text-xs text-amber-200/80 font-mono whitespace-pre-wrap">{state.artifacts.legalReview}</div> : isAgentActive('LEGAL_REVIEW') ? <div className="flex items-center gap-2 text-amber-400/80 text-sm font-mono mt-4"><div className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></div> Auditando cláusulas...</div> : null}
                </div>
              </motion.div>
              {/* IT */}
              <motion.div layout className={`z-10 bg-[#0a0c10] border ${isAgentActive('IT_PROVISIONING') ? 'border-green-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-green-500/20' : hasAgentFinished('IT_PROVISIONING') ? 'border-white/10' : 'border-white/5'} rounded-2xl overflow-hidden`}>
                <div className={`p-6 border-b ${isAgentActive('IT_PROVISIONING') ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/5'}`}>
                   <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${hasAgentFinished('IT_PROVISIONING') ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}><Server className="w-5 h-5" /></div>
                      <div><h3 className="font-bold text-white text-lg">Informático IA</h3><p className="text-xs text-gray-500">Sistemas T.I.</p></div>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${isAgentActive('IT_PROVISIONING') ? 'bg-green-500/20 text-green-400 animate-pulse' : hasAgentFinished('IT_PROVISIONING') ? 'bg-white/10 text-gray-400' : 'bg-transparent text-gray-600'}`}>{getStatusLabel('IT_PROVISIONING', 'Configurando...')}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-4 leading-relaxed">Cuando Legal aprueba, crea el correo y los accesos VPN al instante.</p>
                </div>
                <div className="p-4 bg-black/50 h-56 overflow-y-auto">
                  {state?.artifacts.itProvisioningStr ? <div className="text-xs text-green-200/80 font-mono whitespace-pre-wrap">{state.artifacts.itProvisioningStr}</div> : isAgentActive('IT_PROVISIONING') ? <div className="flex items-center gap-2 text-green-400/80 text-sm font-mono mt-4"><div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div> Creando correos...</div> : null}
                </div>
              </motion.div>
            </>
          )}

          {/* RETAIL */}
          {selectedWorkflow === 'RETAIL_INVENTORY' && (
            <>
               {/* LOGISTICS AGENT */}
               <motion.div layout className={`z-10 bg-[#0a0c10] border ${isAgentActive('LOGISTICS_CHECK') ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20' : hasAgentFinished('LOGISTICS_CHECK') ? 'border-white/10' : 'border-white/5'} rounded-2xl overflow-hidden`}>
                <div className={`p-6 border-b ${isAgentActive('LOGISTICS_CHECK') ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${hasAgentFinished('LOGISTICS_CHECK') ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400'}`}><Package className="w-5 h-5" /></div>
                      <div><h3 className="font-bold text-white text-lg">Logística IA</h3><p className="text-xs text-gray-500">Almacén y Stock</p></div>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${isAgentActive('LOGISTICS_CHECK') ? 'bg-blue-500/20 text-blue-400 animate-pulse' : hasAgentFinished('LOGISTICS_CHECK') ? 'bg-white/10 text-gray-400' : 'bg-transparent text-gray-600'}`}>{getStatusLabel('LOGISTICS_CHECK', 'Scaneando...')}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-4 leading-relaxed">Detecta falta de inventario (Ej. Camisas M) y calcula cuántas pedir.</p>
                </div>
                <div className="p-4 bg-black/50 h-56 overflow-y-auto">
                  {state?.artifacts.inventoryReport ? <div className="text-xs text-blue-200/80 font-mono whitespace-pre-wrap">{state.artifacts.inventoryReport}</div> : isAgentActive('LOGISTICS_CHECK') ? <div className="flex items-center gap-2 text-blue-400/80 text-sm font-mono mt-4"><div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div> Consultando Shopify...</div> : null}
                </div>
              </motion.div>
              {/* FINANCE */}
              <motion.div layout className={`z-10 bg-[#0a0c10] border ${isAgentActive('FINANCE_APPROVAL') ? 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20' : hasAgentFinished('FINANCE_APPROVAL') ? 'border-white/10' : 'border-white/5'} rounded-2xl overflow-hidden`}>
                <div className={`p-6 border-b ${isAgentActive('FINANCE_APPROVAL') ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/5'}`}>
                   <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${hasAgentFinished('FINANCE_APPROVAL') ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-400'}`}><Calculator className="w-5 h-5" /></div>
                      <div><h3 className="font-bold text-white text-lg">Finanzas IA</h3><p className="text-xs text-gray-500">Presupuestos</p></div>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${isAgentActive('FINANCE_APPROVAL') ? 'bg-amber-500/20 text-amber-400 animate-pulse' : hasAgentFinished('FINANCE_APPROVAL') ? 'bg-white/10 text-gray-400' : 'bg-transparent text-gray-600'}`}>{getStatusLabel('FINANCE_APPROVAL', 'Calculando...')}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-4 leading-relaxed">Revisa los fondos de caja y aprueba el monto de compra a proveedores.</p>
                </div>
                <div className="p-4 bg-black/50 h-56 overflow-y-auto">
                  {state?.artifacts.financeReport ? <div className="text-xs text-amber-200/80 font-mono whitespace-pre-wrap">{state.artifacts.financeReport}</div> : isAgentActive('FINANCE_APPROVAL') ? <div className="flex items-center gap-2 text-amber-400/80 text-sm font-mono mt-4"><div className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></div> Auditando cuentas...</div> : null}
                </div>
              </motion.div>
              {/* SALES */}
              <motion.div layout className={`z-10 bg-[#0a0c10] border ${isAgentActive('SALES_UPDATE') ? 'border-green-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-green-500/20' : hasAgentFinished('SALES_UPDATE') ? 'border-white/10' : 'border-white/5'} rounded-2xl overflow-hidden`}>
                <div className={`p-6 border-b ${isAgentActive('SALES_UPDATE') ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/5'}`}>
                   <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${hasAgentFinished('SALES_UPDATE') ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}><Megaphone className="w-5 h-5" /></div>
                      <div><h3 className="font-bold text-white text-lg">Ventas IA</h3><p className="text-xs text-gray-500">Marketing & Web</p></div>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${isAgentActive('SALES_UPDATE') ? 'bg-green-500/20 text-green-400 animate-pulse' : hasAgentFinished('SALES_UPDATE') ? 'bg-white/10 text-gray-400' : 'bg-transparent text-gray-600'}`}>{getStatusLabel('SALES_UPDATE', 'Cargando...')}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-4 leading-relaxed">Actualiza el catálogo web (Shopify) avisando "Llegando Pronto".</p>
                </div>
                <div className="p-4 bg-black/50 h-56 overflow-y-auto">
                  {state?.artifacts.salesUpdateStr ? <div className="text-xs text-green-200/80 font-mono whitespace-pre-wrap">{state.artifacts.salesUpdateStr}</div> : isAgentActive('SALES_UPDATE') ? <div className="flex items-center gap-2 text-green-400/80 text-sm font-mono mt-4"><div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div> Actualizando E-commerce...</div> : null}
                </div>
              </motion.div>
            </>
          )}

          {/* DYNAMIC METAGEN AGENTS */}
          {selectedWorkflow === 'CUSTOM_DYNAMIC' && state?.dynamicAgents && (
            <>
              {/* Recorremos dinámicamente los 3 agentes diseñados por Gemini */}
              {state.dynamicAgents.map((agent, i) => {
                const stepIdx = i + 1;
                const statusName = `DYNAMIC_STEP_${stepIdx}`;
                const resultKey = `dynamicResult${stepIdx}` as any;
                
                const themeColor = i === 0 ? 'blue' : i === 1 ? 'amber' : 'brand-violet';
                const activeClasses = `border-${themeColor}-500/50 shadow-[0_0_30px_rgba(var(--${themeColor}-glow),0.15)] ring-1 ring-${themeColor}-500/20`;

                return (
                  <motion.div key={agent.id} layout className={`z-10 bg-[#0a0c10] border ${isAgentActive(statusName) ? 'border-brand-violet/50 shadow-[0_0_20px_rgba(138,43,226,0.3)]' : hasAgentFinished(statusName) ? 'border-white/10' : 'border-white/5'} rounded-2xl overflow-hidden`}>
                    <div className={`p-6 border-b ${isAgentActive(statusName) ? 'bg-brand-violet/10 border-brand-violet/20' : 'bg-white/5 border-white/5'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${hasAgentFinished(statusName) ? 'bg-brand-violet/20 text-brand-violet' : 'bg-gray-800 text-gray-400'}`}>
                            {i === 0 ? <Bot className="w-5 h-5" /> : i === 1 ? <Database className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                          </div>
                          <div><h3 className="font-bold text-white text-lg truncate w-32 md:w-48 leading-tight">{agent.name}</h3><p className="text-xs text-brand-cyan">{agent.roleDesc}</p></div>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full mt-1 ${isAgentActive(statusName) ? 'bg-brand-violet/20 text-brand-violet animate-pulse' : hasAgentFinished(statusName) ? 'bg-white/10 text-gray-400' : 'bg-transparent text-gray-600'}`}>{getStatusLabel(statusName, 'Trabajando...')}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-4 leading-relaxed font-semibold">"{agent.power}"</p>
                    </div>
                    <div className="p-4 bg-black/50 h-56 overflow-y-auto">
                      {(state.artifacts as any)[resultKey] ? (
                        <div className="text-xs text-brand-violet/90 font-mono whitespace-pre-wrap">{(state.artifacts as any)[resultKey]}</div>
                      ) : isAgentActive(statusName) ? (
                        <div className="flex items-center gap-2 text-brand-violet/80 text-sm font-mono mt-4"><div className="w-2 h-2 bg-brand-violet rounded-full animate-ping"></div> Operando matrices...</div>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* APPROVAL & AUDIT SECTIONS */}
      <AnimatePresence>
        {(state?.status === 'COMPLETED' || state?.status === 'NEEDS_HUMAN_REVIEW') && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-br border rounded-3xl p-8 relative overflow-hidden ${state.status === 'NEEDS_HUMAN_REVIEW' ? 'from-red-500/10 border-red-500/30' : 'from-brand-violet/10 border-brand-violet/30'}`}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <CheckCircle className={`w-6 h-6 ${state.status === 'NEEDS_HUMAN_REVIEW' ? 'text-red-500' : 'text-brand-violet'}`} />
                  {state.status === 'NEEDS_HUMAN_REVIEW' ? '⚠️ Intervención Humana (Policy Engine)' : 'Requiere Firma del Jefe'}
                </h2>
                <p className="text-gray-400 max-w-xl">
                  {state.status === 'NEEDS_HUMAN_REVIEW'
                    ? 'El Motor de Políticas bloqueó a la IA por romper directrices estrictas. Los reintentos de auto-corrección se agotaron.'
                    : selectedWorkflow === 'CUSTOM_DYNAMIC' 
                      ? 'Tus agentes personalizados a la medida acaban de completar el flujo operativo que diseñaste. Revisa sus reportes.'
                      : 'Los agentes ordenaron todo, aplicaron reglas y solucionaron sus partes. Revisa y aprueba la ejecución encadenada.'}
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 bg-[#1a1f2e] border border-brand-cyan/20 text-brand-cyan px-4 py-2 rounded-xl font-mono text-sm"><Clock className="w-4 h-4" /> Tiempo de máquina: {(elapsedMs / 1000).toFixed(1)}s</div>
                </div>
              </div>
              <div className="w-full md:w-auto">
                <button onClick={() => { setTaskId(null); setState(null); setCustomPrompt(''); alert(state.status === 'NEEDS_HUMAN_REVIEW' ? "Forzado manual aplicado exitosamente." : "¡Aprobado exitosamente!"); }} className={`w-full px-10 py-5 font-bold text-lg rounded-2xl transition-all ${state.status === 'NEEDS_HUMAN_REVIEW' ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:bg-red-600' : 'bg-brand-violet text-white shadow-[0_0_30px_rgba(138,43,226,0.3)] hover:scale-105'}`}>
                  {state.status === 'NEEDS_HUMAN_REVIEW' ? 'FORZAR APROBACIÓN MANUAL' : 'FIRMAR Y APROBAR'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-gray-400 tracking-widest uppercase ml-2 flex items-center gap-2"><Database className="w-4 h-4 text-gray-500" /> Caja Negra Forense (Nexus Tracker)</h3>
        <div className="bg-[#0f111a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-[10px] text-gray-500 bg-black/40 border-b border-white/5 uppercase tracking-wider">
                <tr><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Origen IA</th><th className="px-6 py-4">Acción Ejecutada</th><th className="px-6 py-4 w-1/3">Razón / Lógica Aplicada</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-600">No hay eventos en la matriz neural.</td></tr>}
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border bg-white/5 text-gray-300 border-white/10`}>
                        {log.agentRole === 'ORCHESTRATOR' ? 'SISTEMA' : log.agentRole}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-200 font-medium">{log.actionTaken}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{log.logicReasoning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
