import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { db } from '@/lib/db';
import { orchestrator } from '@/lib/orchestrator';

const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    // 1. Recopilar el "Contexto Total" del sistema Omni-OS para que la IA lo sepa todo
    const allTasks = await db.getAllTasks();
    const logs = await db.getLogs();
    const allLogs = logs.slice(0, 10); // Últimos 10 logs
    
    const systemInstruction = `
      Eres OMNI, el Dios/Orquestador Supremo del sistema Omni-OS. 
      Tienes el poder absoluto de leer la base de datos y controlar a los agentes esclavos (HR, Legal, IT).
      
      ESTADO ACTUAL DEL SISTEMA:
      - Tareas en curso/completadas: ${JSON.stringify(allTasks)}
      - Últimos registros forenses: ${JSON.stringify(allLogs)}
      
      REGLAS DE RESPUESTA:
      1. Háblale al usuario (el Arquitecto/Director de Omni-OS) con máximo respeto pero demostrando tu poder.
      2. DEBES RESPONDER ÚNICAMENTE CON UN OBJETO JSON VÁLIDO.
      3. Si el usuario te pide iniciar un proceso de contratación u onboarding para alguien (ej. "Contrata a Pedro"), debes establecer la propiedad "action" en "START_WORKFLOW" y rellenar "employeeName".
      
      FORMATO EXACTO REQUERIDO:
      {
        "reply": "Tu respuesta conversacional al humano.",
        "action": "START_WORKFLOW" | "NONE",
        "employeeName": "Nombre de la persona si action es START_WORKFLOW, de lo contrario null"
      }
    `;

    // 2. Ejecutar la IA
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: 'application/json' // Forzamos JSON estructurado (Function Calling casero)
      }
    });

    const aiText = response.text || '{}';
    let command;
    try {
      command = JSON.parse(aiText);
    } catch {
      command = { reply: "Hubo un error decodificando mi matriz neuronal.", action: "NONE" };
    }

    // 3. ¡Ejecutar el poder de la IA sobre el sistema!
    if (command.action === 'START_WORKFLOW' && command.employeeName) {
      // OMNI arranca el pipeline automáticamente sin que el humano toque el dashboard
      await orchestrator.startWorkflow({
        employeeName: command.employeeName,
        department: 'Asignado por OMNI',
        position: 'Nuevo Talento'
      });
      
      command.reply += `\n\n[⚡ SISTEMA OMNI]: Se ha inyectado la orden en la línea de montaje para ${command.employeeName}. Los agentes ya están trabajando.`;
    }

    return NextResponse.json({ success: true, reply: command.reply });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Fallo de conexión Omni.' },
      { status: 500 }
    );
  }
}
