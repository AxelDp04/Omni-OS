<div align="center">
  <img src="https://img.shields.io/badge/Status-Enterprise_Ready-success?style=for-the-badge" alt="Enterprise Ready" />
  <img src="https://img.shields.io/badge/Next.js_14-App_Router-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Neon-PostgreSQL-blue?style=for-the-badge&logo=postgresql" alt="Neon Postgres" />
  <img src="https://img.shields.io/badge/AI-Google_Gemini-orange?style=for-the-badge" alt="Gemini" />
  
  <br />
  <br />
  <h1>⚙️ Omni-OS</h1>
  <p><b>El Sistema Operativo Neuronal B2B para la Empresa Moderna</b></p>
  <br />
</div>

## 📌 ¿Qué es Omni-OS?

Omni-OS no es un simple bot conversacional; es el **Sistema Nervioso Central** de las operaciones empresariales. Actúa como un motor de orquestación asíncrono donde múltiples Agentes de IA (Recursos Humanos, T.I., Legal, Finanzas) colaboran de forma paralela para ejecutar tareas complejas (ej: Onboarding de empleados, Auditoría de Stock en Retail), **supervisados por reglas matemáticas estrictas en Base de Datos.**

Pensado para operar de forma desatendida y escalar a nivel Enterprise, el sistema procesa Webhooks (*Data Contracts*), ejecuta lógica de IA probabilística y la somete a validaciones determinísticas antes de impactar los sistemas financieros o recursos de la empresa.

---

## 🔥 Arquitectura y Capacidades Clave

### 🤖 1. Orquestación Multi-Agente Asíncrona
Una línea de ensamblaje digital. Cuando ingresa una tarea, el sistema asigna múltiples agentes especializados (LLMs) que evalúan los datos en cadena o en paralelo. Sus deducciones quedan registradas paso por paso.

### 🛡️ 2. Motor de Gobernanza (Policy Engine)
La Inteligencia Artificial puede ser imprecisa (alucinaciones), por ende Omni-OS integra una barrera determinística (Zod + Drizzle). Las **Políticas de Negocio** (ej: *"El salario no puede ser mayor a 100k"*, *"Se requiere firma NDA"*) viven en `PostgreSQL`. Si la IA rompe una política, el motor le forza una auto-corrección (3 intentos) antes de escalar a intervención humana `NEEDS_HUMAN_REVIEW`.

### 🔄 3. Normalización API (Data Contract Layer)
Diseñado para la reventa SaaS. Puedes conectar un ERP externo (SAP, Workday) que envíe JSON con llaves incompatibles (`{"sueldo_neto": 90000}`). La capa de **Data Contracts** mapea e inyecta la información silenciosamente hacia el vocabulario cerrado que el Policy Engine de Omni-OS entiende (`{"salary": 90000}`) sin requerir escribir código backend para cada nuevo cliente.

### 💾 4. Persistencia e Idempotencia Real (Neon DB)
Omni-OS no usa memoria volátil. Todo se traza en la nube usando `Drizzle ORM`.
- **Idempotencia Absoluta:** Restricciones de unicidad en bases de datos evitan que una falla de red vuelva a ejecutar una transacción crítica.
- **Auditoría Forense Inmutable:** La "Caja Negra" registra milisegundo a milisegundo qué Agente tomó qué decisión y por qué lógica interna.

---

## 🏗️ Stack Tecnológico

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Base de Datos:** [Neon serverless Postgres](https://neon.tech/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Validación & Tipado:** TypeScript + [Zod](https://zod.dev/)
- **Inteligencia Automotriz:** `@google/genai` (Modelo Primario), Groq Llama-3 (Failover fallback).
- **Diseño & UI:** Tailwind CSS, Framer Motion, Lucide Icons.

---

## 🚀 Inicio Rápido (Local Development)

Si eres desarrollador o contribuidor del clúster Omni-OS, sigue estos pasos para arrancar el orquestador en tu máquina.

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/Omni-OS.git
cd Omni-OS

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno 
# Crear un archivo .env.local en la raíz con las credenciales:
DATABASE_URL=postgresql://[usuario]:[pass]@[host-neon]/neondb?sslmode=require
GEMINI_API_KEY=AIzaSyTuKeyAqui...

# 4. Pushear la base de datos relacional
npx drizzle-kit push

# 5. Levantar el Motor Central
npm run dev
```
> Accede a **http://localhost:3000** para el Monitor del Orquestador y **http://localhost:3000/admin** para el Portal de Políticas B2B.

---

*Proyecto diseñado por Antigravity (IA) en colaboración con Nexus SRE Architecture.*
