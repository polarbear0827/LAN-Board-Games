"use client";

import React from "react";
import { useGame } from "@/context/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Crown, LogOut, Play, ChevronRight, Gamepad2, CheckCircle2, Circle, AlertCircle, Settings, X, Sparkles, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import AIConfigModal from "./ai/AIConfigModal";

const GAMES = [
  { id: 'LIARS_DICE', name: '吹牛 (Liar\'s Dice)', icon: '🎲', color: 'from-orange-500 to-red-500', disabled: false },
  { id: 'AVALON', name: '阿瓦隆 (Avalon)', icon: '🛡️', color: 'from-blue-600 to-indigo-600', disabled: false },
  { id: 'TURTLE_SOUP', name: '海龜湯 (Turtle Soup)', icon: '🧩', color: 'from-emerald-500 to-teal-500', disabled: false },
  { id: 'WEREWOLF', name: '狼人殺 (Werewolf)', icon: '🐺', color: 'from-purple-600 to-slate-900', disabled: false },
  { id: 'DICE_MODE', name: '單純骰子 (Dice Mode)', icon: '✨', color: 'from-pink-500 to-rose-500', disabled: false },
];

export default function Lobby() {
  const { room, playerId, gameId, isHost, sendAction, aiConfig, updateAiConfig } = useGame();
  const [showAiSettings, setShowAiSettings] = React.useState(false);

  if (!room) return null;

  const players = Object.values(room.players);
  const selectedGameId = room.gameState.selectedGameId || 'LIARS_DICE';
  const currentGame = GAMES.find(g => g.id === selectedGameId) || GAMES[0];

  const others = players.filter(p => p.id !== room.hostId);
  const allReady = others.every(p => (p as any).isReady);
  const myReady = (room.players[playerId!] as any)?.isReady;

  const handleStart = () => {
    if (!allReady && others.length > 0) return;
    sendAction('START_GAME', { aiConfig });
  };

  const handleSelectGame = (id: string) => {
    if (isHost) {
      sendAction('SELECT_GAME', { selectedGameId: id });
    }
  };

  const handleToggleReady = () => {
    sendAction('TOGGLE_READY', {});
  };

  return (
    <div className={cn(
      "min-h-screen p-4 md:p-8 flex flex-col items-center transition-colors duration-1000",
      currentGame.id === 'LIARS_DICE' ? "bg-orange-50/50 dark:bg-orange-950/20" :
      currentGame.id === 'AVALON' ? "bg-blue-50/50 dark:bg-blue-950/20" :
      currentGame.id === 'TURTLE_SOUP' ? "bg-emerald-50/50 dark:bg-emerald-950/20" :
      currentGame.id === 'WEREWOLF' ? "bg-purple-50/50 dark:bg-purple-950/20" :
      "bg-slate-50 dark:bg-slate-950"
    )}>
      {isHost && (
        <button 
          onClick={() => setShowAiSettings(true)}
          className="fixed top-6 right-6 p-3 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-full border border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all z-50 group"
        >
          <Settings className="w-6 h-6 text-gray-500 group-hover:rotate-90 transition-transform" />
        </button>
      )}

      <AIConfigModal 
        isOpen={showAiSettings}
        onClose={() => setShowAiSettings(false)}
        config={aiConfig}
        updateConfig={updateAiConfig}
      />

      {/* 頂部當前遊戲橫條 */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "w-full max-w-4xl mb-8 p-4 rounded-2xl bg-gradient-to-r shadow-lg border border-white/10 flex items-center justify-between",
          currentGame.color
        )}
      >
        <div className="flex items-center gap-4 text-white">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm text-3xl">
            {currentGame.icon}
          </div>
          <div>
            <div className="text-xs font-bold opacity-70 uppercase tracking-widest">當前選擇遊戲</div>
            <div className="text-2xl font-black">{currentGame.name}</div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 bg-black/20 px-4 py-2 rounded-full backdrop-blur-md">
          <Gamepad2 className="w-4 h-4 text-white/70" />
          <span className="text-sm font-bold text-white">房主正在選取中...</span>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* 左側：遊戲清單 (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GAMES.map((game) => (
              <motion.div
                key={game.id}
                whileHover={!game.disabled && isHost ? { scale: 1.02, y: -2 } : {}}
                whileTap={!game.disabled && isHost ? { scale: 0.98 } : {}}
                onClick={() => handleSelectGame(game.id)}
                className={cn(
                  "relative overflow-hidden p-6 rounded-3xl border-2 transition-all cursor-pointer h-32 flex flex-col justify-between",
                  selectedGameId === game.id 
                    ? "border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10" 
                    : "border-gray-100 dark:border-white/5 bg-white/50 dark:bg-black/20 hover:border-brand-300",
                  game.disabled && "opacity-50 grayscale cursor-not-allowed",
                  !isHost && "cursor-default"
                )}
              >
                <div className="flex justify-between items-start">
                  <span className="text-4xl">{game.icon}</span>
                  {selectedGameId === game.id && (
                    <div className="bg-brand-500 text-white p-1 rounded-full">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-black text-lg">{game.name}</div>
                  {game.disabled && <div className="text-[10px] text-gray-400">目前不可用</div>}
                </div>
                {/* 裝飾性漸變 */}
                {selectedGameId === game.id && (
                  <div className={cn("absolute inset-0 -z-10 opacity-10 bg-gradient-to-br", game.color)} />
                )}
              </motion.div>
            ))}
          </div>
          <div className="flex justify-center italic text-gray-400 text-sm">
            {isHost ? "💡 身為房主，點擊卡片可切換要玩的遊戲" : "💡 房主選好遊戲後，請點擊下方的『準備好了』"}
          </div>
        </div>

        {/* 右側：玩家與啟動邏輯 (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-500" /> 冒險者名單
              </h3>
              <span className="text-xs bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-md font-mono">{gameId}</span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {players.map((player) => (
                <div 
                  key={player.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-2xl border transition-all",
                    player.id === playerId ? "border-brand-500/30 bg-brand-500/5" : "border-transparent bg-gray-50 dark:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center font-bold text-sm">
                        {player.id.charAt(0).toUpperCase()}
                      </div>
                      {room.hostId === player.id && (
                        <div className="absolute -top-1 -left-1 bg-amber-500 rounded-full p-1 border-2 border-white dark:border-zinc-900">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{player.id} {player.id === playerId && "(你)"}</span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase",
                        player.id === room.hostId ? "text-amber-500" : (player as any).isReady ? "text-green-500" : "text-gray-400"
                      )}>
                        {player.id === room.hostId ? "房主" : (player as any).isReady ? "已就緒" : "等待中"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isHost && player.id !== playerId && (
                      <button
                        onClick={() => sendAction('TRANSFER_HOST', { newHostId: player.id })}
                        className="p-1.5 hover:bg-amber-500/10 text-amber-500 rounded-lg transition-colors group"
                        title="移交房主"
                      >
                        <Crown className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                    {player.id !== room.hostId && (
                      (player as any).isReady ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-white/5">
              {!isHost ? (
                <button
                  onClick={handleToggleReady}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2",
                    myReady 
                      ? "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                      : "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30"
                  )}
                >
                  {myReady ? "取消準備" : "準備好了！"}
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={!allReady && others.length > 0}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-xl",
                    (!allReady && others.length > 0)
                      ? "bg-gray-200 dark:bg-white/5 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-brand-500/30 hover:scale-[1.02]"
                  )}
                >
                  <Play className="w-5 h-5" />
                  <span>{(!allReady && others.length > 0) ? "等待隊友就緒" : "全軍出發！"}</span>
                </button>
              )}
              {isHost && !allReady && others.length > 0 && (
                <div className="mt-3 text-center text-[10px] text-amber-500 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> 目前尚有玩家未準備
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors px-4"
          >
            <LogOut className="w-4 h-4" /> 登出並返回主選單
          </button>
        </div>
      </motion.div>
    </div>
  );
}
