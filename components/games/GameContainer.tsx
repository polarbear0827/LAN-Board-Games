"use client";

import { useGame } from "@/context/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, HelpCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import AIConfigModal from "../ai/AIConfigModal";
import LiarsDice from "./LiarsDice";
import TurtleSoup from "./TurtleSoup";
import Avalon from "./Avalon";
import Werewolf from "./Werewolf";
import DiceMode from "./DiceMode";

const GAMES = [
  { id: 'LIARS_DICE', name: '吹牛 (Liar\'s Dice)', icon: '🎲', color: 'from-orange-500 to-red-500', disabled: false },
  { id: 'AVALON', name: '阿瓦隆 (Avalon)', icon: '🛡️', color: 'from-blue-600 to-indigo-600', disabled: false },
  { id: 'TURTLE_SOUP', name: '海龜湯 (Turtle Soup)', icon: '🧩', color: 'from-emerald-500 to-teal-500', disabled: false },
  { id: 'WEREWOLF', name: '狼人殺 (Werewolf)', icon: '🐺', color: 'from-purple-600 to-slate-900', disabled: false },
  { id: 'DICE_MODE', name: '單純骰子 (Dice Mode)', icon: '✨', color: 'from-pink-500 to-rose-500', disabled: false },
];

export default function GameContainer() {
  const { room, playerId, sendAction, aiConfig, updateAiConfig } = useGame();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  if (!room) return null;

  const isHost = room.hostId === playerId;

  const renderGame = () => {
    switch (room.gameState.type) {
      case 'LIARS_DICE':
        return <LiarsDice />;
      case 'AVALON':
        return <Avalon />;
      case 'TURTLE_SOUP':
        return <TurtleSoup />;
      case 'WEREWOLF':
        return <Werewolf />;
      case 'DICE_MODE':
        return <DiceMode />;
      default:
        return <div className="text-center p-12 glass rounded-3xl">未知的遊戲類型</div>;
    }
  };

  const [showConfirmQuit, setShowConfirmQuit] = useState(false);

  const handleQuit = () => {
    sendAction('END_GAME');
    setShowConfirmQuit(false);
  };

  const currentGame = GAMES.find(g => g.id === room.gameState.type);

  return (
    <div className={cn(
      "min-h-screen flex flex-col transition-colors duration-1000",
      currentGame?.id === 'LIARS_DICE' ? "bg-orange-50/50 dark:bg-orange-950/20" :
      currentGame?.id === 'AVALON' ? "bg-blue-50/50 dark:bg-blue-950/20" :
      currentGame?.id === 'TURTLE_SOUP' ? "bg-emerald-50/50 dark:bg-emerald-950/20" :
      currentGame?.id === 'WEREWOLF' ? "bg-purple-50/50 dark:bg-purple-950/20" :
      currentGame?.id === 'DICE_MODE' ? "bg-pink-50/50 dark:bg-pink-950/20" :
      "bg-slate-50 dark:bg-slate-950"
    )}>
      {/* 退出確認彈窗 */}
      <AnimatePresence>
        {showConfirmQuit && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="glass p-8 rounded-[2rem] border border-white/10 max-w-sm w-full text-center space-y-6 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-bold">結束目前遊戲？</h3>
                 <p className="text-gray-500 text-sm">這將會使所有玩家回到大廳，進度將不會保存。</p>
              </div>
              <div className="flex gap-3">
                 <button 
                    onClick={() => setShowConfirmQuit(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                 >
                    取消
                 </button>
                 <button 
                    onClick={handleQuit}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition-all"
                 >
                    確定結束
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 頂部固定導航欄 */}
      <header className="p-4 glass sticky top-0 z-50 flex justify-between items-center px-6 md:px-12 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
            {currentGame?.icon || '🎮'}
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">
              {currentGame?.name || '遊戲中'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">房間: {room.hostId} 的遊戲</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <button 
              onClick={() => setIsAiModalOpen(true)}
              className="p-2 text-gray-400 hover:text-brand-500 transition-colors"
              title="AI 設定"
            >
              <Settings className="w-5 h-5 animate-spin-slow" />
            </button>
          )}
          <button className="p-2 text-gray-400 hover:text-brand-500 transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          {isHost && (
            <button 
              onClick={() => setShowConfirmQuit(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">結束遊戲</span>
            </button>
          )}
        </div>
      </header>

      {/* 遊戲內容區域 */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full h-full"
        >
          {renderGame()}
        </motion.div>
      </main>

      <AIConfigModal 
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        config={aiConfig}
        updateConfig={updateAiConfig}
      />

      {/* 底部狀態欄 */}
      <footer className="p-4 text-center text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest">
        Powered by Antigravity Game Engine · Real-time LAN Mode
      </footer>
    </div>
  );
}
