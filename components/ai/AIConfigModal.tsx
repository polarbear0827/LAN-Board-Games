import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Key } from "lucide-react";
import { cn } from "@/lib/utils";

export const AI_PROVIDERS = [
  {
    id: 'google',
    name: 'Google Gemini',
    models: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: '速度最快，適合即時問答' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '邏輯最強，適合複雜規則遊戲' }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT)',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '高 CP 值，反應迅速' },
      { id: 'gpt-4o', name: 'GPT-4o', description: '最強旗艦模型' }
    ]
  },
  {
    id: 'groq',
    name: 'Groq (超高速)',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: '最新旗艦模型，強力推薦' },
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', description: '開源最強，極速反應' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: '最速模型' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: '經典混合專家模型' }
    ]
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (多模型)',
    models: [
      { id: 'google/gemini-flash-1.5-exp', name: 'Gemini Flash 1.5 (Free)', description: '免費額度首選' },
      { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B', description: '經典開源模型' }
    ]
  }
];

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: any;
  updateConfig: (newConfig: any) => void;
}

export default function AIConfigModal({ isOpen, onClose, config, updateConfig }: AIConfigModalProps) {
  if (!isOpen) return null;

  const currentProvider = AI_PROVIDERS.find(p => p.id === config.provider) || AI_PROVIDERS[0];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-xl glass rounded-[2.5rem] border border-white/10 shadow-2xl p-8 space-y-8 overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
           <Sparkles className="w-32 h-32 text-brand-500" />
        </div>

        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-500 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">AI 模式設定</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6 relative max-h-[60vh] overflow-y-auto px-1 pr-2 custom-scrollbar">
          <div className="flex items-center justify-between p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
             <div>
                <div className="font-bold text-lg">啟動 AI 模式</div>
                <div className="text-xs text-gray-500">開啟後將在海龜湯等遊戲中啟用 AI 自動判別</div>
             </div>
             <button 
                onClick={() => updateConfig({ isEnabled: !config.isEnabled })}
                className={cn(
                  "w-16 h-9 rounded-full p-1 transition-all relative overflow-hidden",
                  config.isEnabled ? "bg-brand-500 shadow-lg shadow-brand-500/30" : "bg-gray-700"
                )}
             >
               <motion.div 
                 animate={{ x: config.isEnabled ? 28 : 0 }}
                 className="w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center" 
               />
             </button>
          </div>

          <AnimatePresence>
            {config.isEnabled && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between p-5 rounded-[2rem] bg-brand-500/5 border border-brand-500/20 hover:border-brand-500/40 transition-colors">
                   <div>
                      <div className="font-bold text-brand-500">AI 智慧湯主模式</div>
                      <div className="text-[10px] text-gray-500">開啟後房主也能參與猜題，由 AI 擔任關主</div>
                   </div>
                   <button 
                      onClick={() => updateConfig({ isAiNarrator: !config.isAiNarrator })}
                      className={cn(
                        "w-14 h-8 rounded-full p-1 transition-all relative",
                        config.isAiNarrator ? "bg-brand-500" : "bg-gray-700"
                      )}
                   >
                     <motion.div 
                       animate={{ x: config.isAiNarrator ? 24 : 0 }}
                       className="w-6 h-6 bg-white rounded-full shadow-sm" 
                     />
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase ml-2 tracking-widest flex items-center gap-2">
               選擇供應商
            </label>
            <div className="grid grid-cols-2 gap-3">
               {AI_PROVIDERS.map(p => (
                 <button 
                   key={p.id}
                   onClick={() => updateConfig({ provider: p.id, model: p.models[0].id })}
                   className={cn(
                     "p-5 rounded-2xl border transition-all text-sm font-bold text-left group relative overflow-hidden",
                     config.provider === p.id 
                      ? "border-brand-500 bg-brand-500/10 text-brand-500" 
                      : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"
                   )}
                 >
                   {p.name}
                   {config.provider === p.id && (
                     <motion.div layoutId="provider-bg" className="absolute inset-0 bg-brand-500/5 -z-10" />
                   )}
                 </button>
               ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase ml-2 tracking-widest flex items-center gap-2">
               <Key className="w-3 h-3" /> API Key
            </label>
            <div className="relative group">
              <input 
                type="password"
                value={config.apiKey}
                onChange={(e) => updateConfig({ apiKey: e.target.value })}
                placeholder="在此輸入 API Key..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pr-14 focus:ring-2 ring-brand-500/50 outline-none transition-all placeholder:text-gray-600 group-hover:bg-white/10"
              />
              {config.apiKey && (
                <button 
                  onClick={() => updateConfig({ apiKey: '' })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-xl text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase ml-2 tracking-widest">
               選擇模型 (推薦列表)
            </label>
            <div className="relative">
              <select
                value={config.model}
                onChange={(e) => updateConfig({ model: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:ring-2 ring-brand-500/50 outline-none transition-all appearance-none cursor-pointer hover:bg-white/10 pr-12"
              >
                {currentProvider.models.map(m => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white p-4">
                    {m.name} - {m.description}
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                 <X className="w-4 h-4 rotate-45" />
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-5 bg-white text-black dark:bg-brand-500 dark:text-white font-black rounded-3xl hover:scale-[1.02] active:scale-[0.98] transition-all text-base shadow-xl shadow-brand-500/20"
        >
          儲存設定並返回
        </button>
      </motion.div>
    </div>
  );
}
