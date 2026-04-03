import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Timer, Play } from "lucide-react";

interface IdleWarningModalProps {
  remaining: number;
  onKeepAlive: () => void;
}

export default function IdleWarningModal({ remaining, onKeepAlive }: IdleWarningModalProps) {
  return (
    <AnimatePresence>
      {remaining > 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md glass rounded-[3rem] border border-white/20 p-10 text-center space-y-8 shadow-2xl shadow-red-500/20"
          >
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-12 h-12 text-red-500" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-xl border-4 border-slate-900">
                  {remaining}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-red-500 tracking-tighter uppercase">伺服器閒置警告</h2>
              <p className="text-gray-400 font-medium leading-relaxed">
                偵測到目前處於長期閒置狀態，<br/>
                系統將在 <span className="text-white font-bold">{remaining} 秒</span> 後自動關閉連線。
              </p>
            </div>

            <button
              onClick={onKeepAlive}
              className="w-full py-5 bg-white text-black dark:bg-brand-500 dark:text-white font-black rounded-3xl hover:scale-105 active:scale-95 transition-all text-lg shadow-xl shadow-brand-500/30 flex items-center justify-center gap-3 group"
            >
              <Play className="w-6 h-6 fill-current group-hover:animate-ping" />
              繼續遊戲
            </button>
            
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase opacity-50">
              點擊上方按鈕以撤銷關機指令
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
