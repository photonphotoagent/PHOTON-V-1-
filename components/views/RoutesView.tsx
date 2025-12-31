import React, { useState } from 'react';
import { RouteChatMessage, Workflow } from '../../types';
import * as GeminiService from '../../services/geminiService';
import { MapIcon, ArrowRightIcon } from '../icons';

export const RoutesView: React.FC = () => {
  const [messages, setMessages] = useState<RouteChatMessage[]>([
    {
      role: 'model',
      text: 'I am your Strategy Consultant. What business process do you want to automate today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const newMessages = [...messages, { role: 'user', text } as RouteChatMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const history = newMessages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const response = await GeminiService.routeStrategistChat(history, text);

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: response.text,
          options: response.options,
        },
      ]);

      if (response.build_trigger && response.final_prompt) {
        setMessages((prev) => [
          ...prev,
          { role: 'model', text: 'Generating your route workflow...' },
        ]);
        const wf = await GeminiService.generateWorkflowFromPrompt(response.final_prompt);
        setWorkflow(wf);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Sorry, I encountered an error.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto pt-24 h-screen flex flex-col">
      <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
        <MapIcon className="w-8 h-8 text-indigo-400" /> Route Builder
      </h1>

      <div className="flex-grow bg-gray-900/50 border border-white/10 rounded-2xl p-6 overflow-hidden flex flex-col md:flex-row gap-6">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-grow overflow-y-auto space-y-4 mb-4 custom-scrollbar pr-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-200 border border-white/5'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.options && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleSend(opt)}
                          className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-xs font-bold transition-colors"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-gray-500 text-xs animate-pulse">
                Strategist is thinking...
              </div>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Describe your goal..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bg-indigo-600 p-1.5 rounded-lg text-white disabled:opacity-50"
            >
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workflow Preview Area */}
        <div className="w-full md:w-80 bg-black/20 border-l border-white/5 pl-6 hidden md:flex flex-col">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
            Active Route
          </h3>
          {workflow ? (
            <div className="space-y-4 overflow-y-auto flex-grow">
              <div className="bg-indigo-900/20 border border-indigo-500/30 p-3 rounded-xl">
                <h4 className="font-bold text-white text-sm">{workflow.title}</h4>
                <p className="text-xs text-gray-400 mt-1">{workflow.description}</p>
              </div>
              <div className="space-y-2">
                {workflow.steps.map((step, i) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-3 p-2 rounded-lg bg-white/5"
                  >
                    <div className="bg-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-200">{step.name}</p>
                      <p className="text-[10px] text-gray-500">{step.actor.toUpperCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-center p-4">
              <p className="text-gray-600 text-sm">
                Chat with the strategist to build a new workflow.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
