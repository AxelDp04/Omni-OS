import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/orchestrator';
import { GoogleGenAI } from '@google/genai';
import { DynamicAgentDef } from '@/types';
import { dataContractLayer } from '@/lib/data-contract';

const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  try {
    const rawInput = await request.json();
    
    // 0. DATA CONTRACT LAYER (Enterprise Normalization)
    const normalizedPayload = await dataContractLayer.normalize('DEFAULT_COMPANY', rawInput.workflowType || 'ONBOARDING', rawInput);

    const { workflowType, customPrompt, ...context } = normalizedPayload;
    let dynamicAgents: DynamicAgentDef[] | undefined;

    // Si es DYNAMIC, usamos al Meta-Agente para diseñar el equipo de IA
    if (workflowType === 'CUSTOM_DYNAMIC' && customPrompt) {
      const systemInstruction = `
        Eres el Meta-Arquitecto de Omni-OS...
        (Instrucciones de diseño de agente)
      `;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'Diseña los 3 agentes en estricto JSON array [{' + '"id":"x", "name":"x", "roleDesc":"x", "power":"x", "systemPrompt":"x"' + '}] para: ' + customPrompt,
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        });

        dynamicAgents = JSON.parse(response.text || '[]') as DynamicAgentDef[];
        if (!Array.isArray(dynamicAgents) || dynamicAgents.length < 3) throw new Error('Array inválido');

      } catch (err) {
        console.warn('Gemini Meta-Planner falló. Entrando en Failover...');
        // FAILOVER PARA EL META-PLANIFICADOR (EVITAR CRASH)
        dynamicAgents = [
          { id: "agent_1", name: "Agente de Análisis AI", roleDesc: "Datos", power: "Procesa información inicial", systemPrompt: "Analiza el contexto y devuelve el paso 1 completado." },
          { id: "agent_2", name: "Auditor de Flujo AI", roleDesc: "Control", power: "Verifica el paso 1", systemPrompt: "Verifica el paso 1 y devuelve el paso 2." },
          { id: "agent_3", name: "Ejecutor AI", roleDesc: "Operaciones", power: "Cierra el proceso", systemPrompt: "Ejecuta la salida final." }
        ];
      }
    }
    
    // Iniciamos la pipeline de agentes asíncrona
    // Guardamos el customPrompt en el contexto si existe
    const finalContext = { ...context, customPrompt };
    const taskId = await orchestrator.startWorkflow(finalContext, workflowType || 'ONBOARDING', dynamicAgents);
    
    // Devolvemos el taskId inmediatamente para que la UI haga polling
    return NextResponse.json({ success: true, taskId });

  } catch (error: any) {
    console.error('Orchestrator Run API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error iniciando la matriz.' },
      { status: 500 }
    );
  }
}
