'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, List, AlertTriangle, ShieldCheck, Link2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const [policy, setPolicy] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mappings State
  const [contractWorkflow, setContractWorkflow] = useState('ONBOARDING');
  const [mappingPayloadStr, setMappingPayloadStr] = useState('{\n  "sueldo_externo": "salary"\n}');

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [formConfig, setFormConfig] = useState({
    field: '',
    operator: '==',
    value: '',
    severity: 'BLOCKER',
    errorMessage: ''
  });

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/policies');
      const data = await res.json();
      if (data.success) {
        setPolicy(data.policy);
        setRules(data.rules);
      }
      // Fetch data contract for ONBOARDING by default
      const resDc = await fetch('/api/data-contracts?workflowType=ONBOARDING');
      const dcData = await resDc.json();
      if (dcData.success && dcData.contract && dcData.contract.mappingPayload) {
        setMappingPayloadStr(JSON.stringify(dcData.contract.mappingPayload, null, 2));
      } else {
        setMappingPayloadStr('{\n  "sueldo_externo": "salary"\n}');
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleAddRule = async () => {
    if (!formConfig.field || !formConfig.value) return alert('Completa Campo y Valor');
    
    try {
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formConfig)
      });
      const data = await res.json();
      if (data.success) {
        setIsAdding(false);
        setFormConfig({ field: '', operator: '==', value: '', severity: 'BLOCKER', errorMessage: '' });
        fetchPolicies(); // Refrescar tabla
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveContract = async () => {
    try {
      const parsedJson = JSON.parse(mappingPayloadStr);
      const res = await fetch('/api/data-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowType: contractWorkflow, mappingPayload: parsedJson })
      });
      const data = await res.json();
      if (data.success) alert("Diccionario de Mapeo guardado exitosamente en Postgres.");
      else alert(data.error);
    } catch(e) {
      alert("JSON inválido. Revisa la sintaxis del diccionario.");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20 max-w-6xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0f111a] border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-violet/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 p-8 md:p-12 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 flex items-center gap-3">
               Portal de Gobernanza B2B <Shield className="w-8 h-8 text-brand-violet" />
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              El cerebro determinístico de Omni-OS. Aquí defines las leyes matemáticas y lógicas que tus Agentes IA 
              están obligados a respetar. Si un agente rompe una política, el Policy Engine lo bloqueará instantáneamente.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded-2xl border border-white/5 min-w-[200px]">
            <span className="text-brand-violet font-mono text-4xl font-bold mb-2">{rules.length}</span>
            <span className="text-gray-400 text-sm font-semibold uppercase tracking-widest">Reglas Activas</span>
            {policy && <span className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Activity className="w-3 h-3 text-green-500" /> v{policy.version} Operativa</span>}
          </div>
        </div>
      </div>

      {/* RULES TABLE */}
      <div className="space-y-6">
        <div className="flex justify-between items-center ml-2">
          <h3 className="text-sm font-semibold text-gray-400 tracking-widest uppercase flex items-center gap-2">
            <List className="w-4 h-4 text-gray-500" /> Libro de Reglas Maestro (Neon DB)
          </h3>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-brand-violet/10 hover:bg-brand-violet/20 text-brand-violet border border-brand-violet/30 px-4 py-2 rounded-xl transition-all text-sm font-bold"
          >
            <Plus className="w-4 h-4" /> {isAdding ? 'Cancelar' : 'Añadir Nueva Política'}
          </button>
        </div>

        {/* ADD RULE FORM (COLLAPSIBLE) */}
        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#1a1f2e] border border-brand-violet/30 p-6 rounded-2xl mb-6 shadow-xl">
                <h4 className="text-lg font-bold text-white mb-4">Declarar Nueva Ley Paramétrica</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="col-span-1">
                     <label className="block text-xs text-gray-400 uppercase mb-2">Campo a Auditar</label>
                     <input type="text" placeholder="Ej: salary o nda_signed" value={formConfig.field} onChange={e => setFormConfig({...formConfig, field: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-violet outline-none font-mono" />
                  </div>
                  <div className="col-span-1">
                     <label className="block text-xs text-gray-400 uppercase mb-2">Operador Lógico</label>
                     <select value={formConfig.operator} onChange={e => setFormConfig({...formConfig, operator: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-violet outline-none font-mono">
                       <option value="==">== (Igual A)</option>
                       <option value=">=">{'>='} (Mayor o Igual)</option>
                       <option value="<=">{'<='} (Menor o Igual)</option>
                       <option value="INCLUDES">INCLUDES (Contiene String)</option>
                       <option value="NO_INCLUDES">NO_INCLUDES (No Contiene)</option>
                     </select>
                  </div>
                  <div className="col-span-1">
                     <label className="block text-xs text-gray-400 uppercase mb-2">Valor Requerido</label>
                     <input type="text" placeholder="Ej: 150000 o true" value={formConfig.value} onChange={e => setFormConfig({...formConfig, value: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-violet outline-none font-mono" />
                  </div>
                  <div className="col-span-1">
                     <label className="block text-xs text-gray-400 uppercase mb-2">Nivel de Severidad</label>
                     <select value={formConfig.severity} onChange={e => setFormConfig({...formConfig, severity: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-violet outline-none font-bold">
                       <option value="BLOCKER" className="text-red-400">BLOCKER (Rechazo Total)</option>
                       <option value="WARNING" className="text-amber-400">WARNING (Alerta Naranja)</option>
                     </select>
                  </div>
                  <div className="col-span-3">
                     <label className="block text-xs text-gray-400 uppercase mb-2">Mensaje de Excepción (Feedback para la IA)</label>
                     <input type="text" placeholder="¿Qué le diremos al Agente IA cuando se equivoque? Ej: El salario no cumple..." value={formConfig.errorMessage} onChange={e => setFormConfig({...formConfig, errorMessage: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-violet outline-none" />
                  </div>
                  <div className="col-span-1 flex items-end">
                     <button onClick={handleAddRule} className="w-full bg-brand-violet hover:bg-[#9b4dff] text-white font-bold py-2 px-4 rounded-lg transition-all shadow-[0_0_15px_rgba(138,43,226,0.4)]">
                       Guardar Regla
                     </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-[#0f111a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-[10px] text-gray-500 bg-black/40 border-b border-white/5 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">ID Regla</th>
                  <th className="px-6 py-4">Severidad</th>
                  <th className="px-6 py-4">Lógica Evaluada</th>
                  <th className="px-6 py-4 w-1/3">Exception Message / Corrector AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-600">Cargando arquitecturas de matriz...</td></tr>}
                {!loading && rules.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-600">No hay reglas en la política activa.</td></tr>}
                
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{rule.id}</td>
                    <td className="px-6 py-4">
                      {rule.severity === 'BLOCKER' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide bg-red-500/10 text-red-400 border border-red-500/20">
                          <AlertTriangle className="w-3 h-3" /> BLOCKER
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <ShieldCheck className="w-3 h-3" /> WARNING
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-brand-cyan text-sm bg-black/20 rounded">
                      <span className="text-gray-400">datos.</span>{rule.field} <span className="text-brand-violet font-bold">{rule.operator}</span> {rule.value.toString()}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs italic">
                      "{rule.errorMessage}"
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DATA CONTRACT MAPPINGS SECTION */}
      <div className="space-y-6 pt-8 border-t border-white/5">
        <div className="flex justify-between items-center ml-2">
          <h3 className="text-sm font-semibold text-gray-400 tracking-widest uppercase flex items-center gap-2">
            <Link2 className="w-4 h-4 text-brand-cyan" /> Data Contract Layer (Normalizador de Webhooks)
          </h3>
        </div>

        <div className="bg-[#1a1f2e] border border-brand-cyan/30 p-6 rounded-2xl shadow-xl">
          <h4 className="text-lg font-bold text-white mb-2">Diccionario de Traducción Empresa-Omni</h4>
          <p className="text-sm text-gray-400 mb-6">Convierte las llaves JSON de los sistemas externos de tus clientes (ERP/CRM) al esquema estándar que los agentes Omni-OS esperan (e.g., de "comp_anual" a "salary"). Drizzle inyecta esto antes de arrancar los llms.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-1">
               <label className="block text-xs text-gray-400 uppercase mb-2">Flujo Destino</label>
               <select value={contractWorkflow} onChange={e => {
                  setContractWorkflow(e.target.value);
                  fetch(`/api/data-contracts?workflowType=${e.target.value}`)
                    .then(r => r.json())
                    .then(d => {
                      if(d.success && d.contract) setMappingPayloadStr(JSON.stringify(d.contract.mappingPayload, null, 2));
                      else setMappingPayloadStr('{\n  "clave_externa": "clave_interna"\n}');
                    });
               }} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-cyan outline-none font-bold">
                 <option value="ONBOARDING">ONBOARDING</option>
                 <option value="RETAIL_INVENTORY">RETAIL_INVENTORY</option>
                 <option value="CUSTOM_DYNAMIC">CUSTOM_DYNAMIC</option>
               </select>
            </div>
            <div className="col-span-2">
               <label className="block text-xs text-gray-400 uppercase mb-2">Diccionario JSON</label>
               <textarea rows={4} value={mappingPayloadStr} onChange={e => setMappingPayloadStr(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-brand-cyan text-sm focus:border-brand-cyan outline-none font-mono placeholder:text-gray-600" />
            </div>
            <div className="col-span-1 flex items-end">
               <button onClick={handleSaveContract} className="w-full bg-brand-cyan hover:bg-[#00e5ff] text-black font-bold py-2 px-4 rounded-lg transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] h-12">
                 Guardar Mapeo (DB)
               </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
