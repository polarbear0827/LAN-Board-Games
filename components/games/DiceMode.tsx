"use client";

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCw, History, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DiceMode() {
  const { room, playerId, sendAction } = useGame();
  const [localCount, setLocalCount] = useState(1);
  const [localSides, setLocalSides] = useState(6);
  const [isRolling, setIsRolling] = useState(false);

  if (!room || !playerId) return null;

  const data = room.gameState.data;

  const handleRoll = () => {
    setIsRolling(true);
    sendAction('DICE_ROLL', { diceCount: localCount, diceSides: localSides });
    setTimeout(() => setIsRolling(false), 600);
  };

  const getDiceIcon = (val: number) => {
    if (localSides !== 6) return <span className="text-2xl font-black">{val}</span>;
    switch (val) {
      case 1: return <Dice1 className="w-12 h-12" />;
      case 2: return <Dice2 className="w-12 h-12" />;
      case 3: return <Dice3 className="w-12 h-12" />;
      case 4: return <Dice4 className="w-12 h-12" />;
      case 5: return <Dice5 className="w-12 h-12" />;
      case 6: return <Dice6 className="w-12 h-12" />;
      default: return <span className="text-2xl font-black">{val}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* 設置區 */}
      <div className="glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-wrap gap-8 items-end justify-center">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase ml-1 flex items-center gap-2">
            <Hash className="w-3 h-3" /> 骰子顆數 (1-10)
          </label>
          <input 
            type="number" 
            min={1} max={10}
            value={localCount}
            onChange={(e) => setLocalCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-24 bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-2 ring-pink-500 outline-none transition-all text-center text-xl font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase ml-1 flex items-center gap-2">
            <RotateCw className="w-3 h-3" /> 骰子面數 (D?)
          </label>
          <select 
            value={localSides}
            onChange={(e) => setLocalSides(parseInt(e.target.value))}
            className="w-24 bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-2 ring-pink-500 outline-none transition-all text-center text-xl font-bold appearance-none cursor-pointer"
          >
            {[4, 6, 8, 10, 12, 20, 100].map(s => <option key={s} value={s} className="bg-slate-900 text-white">D{s}</option>)}
          </select>
        </div>
        <button
          onClick={handleRoll}
          disabled={isRolling}
          className={cn(
            "px-12 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black rounded-2xl shadow-xl shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3",
            isRolling && "opacity-50 grayscale cursor-not-allowed"
          )}
        >
          <RotateCw className={cn("w-6 h-6", isRolling && "animate-spin")} />
          擲骰子！
        </button>
      </div>

      {/* 結果區 */}
      <div className="min-h-[200px] flex flex-wrap justify-center gap-6 py-8">
        <AnimatePresence mode="popLayout">
          {data.results.map((val: number, idx: number) => (
            <motion.div
              key={`${idx}-${val}-${data.results.length}`}
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: idx * 0.05 }}
              className="w-24 h-24 glass rounded-3xl border border-white/20 flex items-center justify-center text-pink-500 shadow-xl relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {getDiceIcon(val)}
            </motion.div>
          ))}
        </AnimatePresence>
        {data.results.length > 1 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full text-center mt-4"
          >
            <div className="inline-block glass px-6 py-2 rounded-full border border-pink-500/20 text-pink-500 font-black text-xl">
              總和：{data.results.reduce((a: any, b: any) => a + b, 0)}
            </div>
          </motion.div>
        )}
      </div>

      {/* 歷史記錄 */}
      <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
        <h3 className="font-bold flex items-center gap-2 text-gray-400 uppercase text-xs tracking-widest">
          <History className="w-4 h-4" /> 最近擲骰記錄
        </h3>
        <div className="space-y-3">
          {data.history.map((log: any, idx: number) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={log.timestamp}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center font-bold text-pink-500 text-xs">
                    {idx + 1}
                 </div>
                 <div>
                    <span className="font-bold text-sm text-gray-200">{log.playerId}</span>
                    <span className="text-[10px] text-gray-500 ml-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="text-xs text-gray-400">
                    {log.results.join(' + ')}
                 </div>
                 <div className="font-black text-pink-500 bg-pink-500/10 px-3 py-1 rounded-lg">
                    {log.total}
                 </div>
              </div>
            </motion.div>
          ))}
          {data.history.length === 0 && <div className="text-center py-8 text-gray-600 italic">尚無擲骰記錄</div>}
        </div>
      </div>
    </div>
  );
}
