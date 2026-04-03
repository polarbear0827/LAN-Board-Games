"use client";

import { useState, useEffect } from "react";
import { useGame } from "@/context/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Play, Users, ShieldCheck, Dice5 } from "lucide-react";
import Lobby from "@/components/Lobby";
import GameContainer from "@/components/games/GameContainer";

export default function Home() {
  const { joinRoom, room, playerId, error, darkMode, toggleDarkMode } = useGame();
  const [gid, setGid] = useState("MAIN");
  const [pid, setPid] = useState("");
  const [pin, setPin] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) setGid(roomParam.toUpperCase());
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (gid && pid && pin) {
      joinRoom(gid.toUpperCase(), pid, pin);
    }
  };

  // 如果已經在房間裡
  if (room && playerId) {
    if (room.gameState.status === "LOBBY") {
      return <Lobby />;
    }
    return <GameContainer />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {/* 頂部控制欄 */}
      <div className="fixed top-6 right-6">
        <button
          onClick={toggleDarkMode}
          className="p-3 rounded-full glass hover:scale-110 transition-transform shadow-lg"
        >
          {darkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-brand-600" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* 裝飾性背景 */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl" />

        <div className="text-center mb-8 relative">
          <div className="inline-block p-4 bg-brand-500 rounded-2xl mb-4 shadow-lg shadow-brand-500/30">
            <Dice5 className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-purple-600 dark:from-brand-400 dark:to-purple-400">
            LAN Board Games
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            進入多人遊戲大廳
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6 relative">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2 px-1">
              <Users className="w-4 h-4 text-brand-500" /> 房間 ID (英數字)
            </label>
            <input
              type="text"
              value={gid}
              onChange={(e) => setGid(e.target.value.toUpperCase())}
              placeholder="MAIN"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all uppercase"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 px-1">
                <Users className="w-4 h-4 text-brand-500" /> 玩家暱稱
              </label>
              <input
                type="text"
                value={pid}
                onChange={(e) => setPid(e.target.value)}
                placeholder="你的暱稱"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 px-1">
                <ShieldCheck className="w-4 h-4 text-brand-500" /> 3位 PIN 碼
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="***"
                maxLength={3}
                inputMode="numeric"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-center tracking-[1em]"
                required
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            <span>進入遊戲</span>
            <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 text-center text-xs text-gray-400">
          區域網路多人連線模式 · 同一網路下即可對戰
        </div>
      </motion.div>
    </main>
  );
}
