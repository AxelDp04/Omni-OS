import type { Metadata } from 'next';
import FloatingAgent from '@/components/FloatingAgent';
import './globals.css';

export const metadata: Metadata = {
  title: 'Omni-OS | Enterprise Automation',
  description: 'The AI Orchestrator for Enterprise Operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased font-sans text-gray-100 bg-brand-obsidian selection:bg-brand-cyan/30">
        {/* Decorative Grid Overlay para el "Wow Factor" tecnológico */}
        <div className="fixed inset-0 z-[-1] pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Header Corporativo del SO */}
        <header className="fixed top-0 w-full h-16 glass-panel rounded-none border-t-0 border-x-0 border-b-brand-glass-border/50 z-50 flex items-center px-6 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded animate-neural-pulse bg-gradient-to-br from-brand-cyan to-brand-violet flex items-center justify-center font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              Ω
            </div>
            <h1 className="text-xl font-semibold tracking-wide text-glow-cyan"><a href="/">Omni-OS</a></h1>
            <span className="text-xs px-2 py-0.5 ml-2 rounded-full border border-brand-violet/30 text-brand-violet bg-brand-violet/10">
              Cerebro Central v1.0
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide">
            <a href="/" className="text-gray-300 hover:text-brand-cyan transition-all border-b-2 border-transparent hover:border-brand-cyan uppercase">Monitor Orquestador</a>
            <a href="/admin" className="text-gray-300 hover:text-brand-violet transition-all border-b-2 border-transparent hover:border-brand-violet uppercase">Gobierno (Reglas)</a>
          </nav>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-active opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-status-active shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
              </span>
              Nexus Conectado
            </div>
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="pt-24 px-6 pb-12 max-w-[1600px] mx-auto min-h-screen relative z-10">
          {children}
        </main>
        
        <FloatingAgent />
      </body>
    </html>
  );
}
