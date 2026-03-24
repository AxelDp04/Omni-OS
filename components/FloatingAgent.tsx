'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader } from 'lucide-react';

type Message = { role: 'omni' | 'user', text: string };

export default function FloatingAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'omni', text: 'Saludos, Arquitecto. Soy OMNI, el Cerebro Supremo de este OS. Puedo informarte de todo lo que hacen mis agentes de HR, Legal e IT... o bien darles órdenes directas si me lo pides.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al mandar mensajes
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { role: 'omni', text: data.reply }]);
      } else {
         setMessages(prev => [...prev, { role: 'omni', text: 'Error de conexión con la matriz.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'omni', text: 'Sistemas fuera de línea.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* El Botón Flotante */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full bg-brand-violet text-white shadow-[0_0_20px_rgba(138,43,226,0.5)] hover:bg-brand-violet/80 transition-transform hover:scale-110 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* La Interfaz de Chat (Glassmorphism) */}
      <div className={`fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-2xl glass-panel shadow-[0_0_30px_rgba(0,0,0,0.8)] border-t-2 border-t-brand-violet flex flex-col transition-all duration-300 transform origin-bottom-right overflow-hidden ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-brand-obsidian to-brand-violet/20 p-4 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-violet/20 border border-brand-violet/50 flex items-center justify-center shadow-[0_0_10px_rgba(138,43,226,0.5)]">
               <Bot className="w-4 h-4 text-brand-cyan" />
            </div>
            <div>
              <h3 className="font-bold text-gray-100 flex items-center gap-2">Asistente OMNI <div className="w-2 h-2 rounded-full bg-status-active animate-pulse"></div></h3>
              <p className="text-[10px] text-brand-cyan">Ctrl. Total del Sistema</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Historial de Mensajes */}
        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-black/40">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                msg.role === 'user' 
                ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 rounded-br-none' 
                : 'bg-gray-800/80 text-gray-200 border border-gray-700/50 rounded-bl-none'
              }`}>
                {msg.role === 'omni' && <Bot className="w-3 h-3 text-brand-violet mb-1" />}
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="max-w-[80%] rounded-2xl p-3 bg-gray-800/80 text-gray-400 border border-gray-700/50 rounded-bl-none text-xs flex items-center gap-2">
                 <Loader className="w-3 h-3 animate-spin text-brand-violet" /> OMNI está analizando...
               </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Cajas de Entrada */}
        <form onSubmit={sendMessage} className="p-3 bg-brand-obsidian border-t border-gray-800 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej: Contrata a Marta de Diseño..."
            disabled={isLoading}
            className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/50 transition-all placeholder:text-gray-600"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-lg bg-brand-violet hover:bg-brand-violet/80 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </>
  );
}
