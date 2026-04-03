"use client";

import { useGame } from "@/context/GameContext";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Gavel, User, AlertCircle, History } from "lucide-react";
import { cn } from "@/lib/utils";

const DICE_ICONS = [null, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export default function LiarsDice() {
  const { room, playerId, sendAction } = useGame();
  const [bidAmount, setBidAmount] = useState(1);
  const [bidFace, setBidFace] = useState(2);

  if (!room || !playerId) return null;

  const { gameState, players } = room;
  const gameData = gameState.data;
  const myPlayer = players[playerId];
  const isMyTurn = players[Object.keys(players)[gameData.currentPlayerIndex || 0]]?.id === playerId;
  
  // 初始化自定義骰子 (如果是新的一局且我還沒骰子)
  useEffect(() => {
    if (gameData.status === 'ROUND_START' && !gameData.dice?.[playerId]) {
      // 實際邏輯應該由 Server 統一生成並發送私有數據，
      // 但為了簡化 LAN Demo，我們在 Client 生成後同步（或由 Host 生成）
      // 這裡採用最簡單的：由 Host 在進入 PLAYING 狀態時初始化所有人的骰子
    }
  }, [gameData.status]);

  const handleBid = () => {
    if (!isMyTurn) return;
    
    // 驗證叫價是否合法 (必須比上一個叫價高)
    const lastBid = gameData.lastBid;
    const isValid = !lastBid || 
                   (bidAmount > lastBid.amount) || 
                   (bidAmount === lastBid.amount && bidFace > lastBid.face);

    if (!isValid) {
      alert("叫價必須高於上一個玩家！");
      return;
    }

    sendAction('MOVE', {
      lastBid: { amount: bidAmount, face: bidFace, bidderId: playerId },
      history: [...(gameData.history || []), { type: 'BID', playerId, amount: bidAmount, face: bidFace }],
      currentPlayerIndex: (gameData.currentPlayerIndex + 1) % Object.keys(players).length
    });
  };

  const handleChallenge = () => {
    if (!isMyTurn || !gameData.lastBid) return;

    // 計算全場骰子數量
    const allDice = Object.values(players).flatMap(p => (gameData.dice?.[p.id] || []));
    const count = allDice.filter(d => d === gameData.lastBid.face || d === 1).length; // 1 通常是王

    const success = count < gameData.lastBid.amount; // 如果實際數量少於叫價，質疑成功

    sendAction('MOVE', {
      phase: 'REVEAL',
      revealResult: {
        success,
        count,
        targetAmount: gameData.lastBid.amount,
        targetFace: gameData.lastBid.face,
        challenger: playerId,
        bidder: gameData.lastBid.bidderId
      },
      history: [...(gameData.history || []), { type: 'CHALLENGE', playerId, success }]
    });

    // 延時後重置或扣血邏輯此處簡化
    setTimeout(() => {
        // 發送重置回合動作...
    }, 5000);
  };

  const renderDice = (dice: number[]) => (
    <div className="flex gap-2 justify-center py-4">
      {dice.map((d, i) => {
        const Icon = DICE_ICONS[d] || Dice1;
        return (
          <motion.div
            key={i}
            initial={{ rotate: -20, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-inner flex items-center justify-center border border-gray-100 dark:border-white/10"
          >
            <Icon className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      {/* 玩家桌面 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 我的區域 */}
        <div className="glass p-6 rounded-3xl border-2 border-brand-500/50 shadow-brand-500/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3">
             <span className="text-[10px] font-bold bg-brand-500 text-white px-2 py-1 rounded-lg">YOU</span>
          </div>
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-brand-500" /> 我的骰盒
          </h3>
          {renderDice(gameData.dice?.[playerId] || [1, 2, 3, 4, 5])}
          <div className="mt-4 text-center text-sm text-gray-500">
            你目前有 {gameData.dice?.[playerId]?.length || 5} 顆骰子
          </div>
        </div>

        {/* 狀態與叫價區 */}
        <div className="glass p-6 rounded-3xl flex flex-col justify-between border border-white/20">
          <div>
            <h3 className="font-bold flex items-center gap-2 mb-4 text-gray-500">
              <Gavel className="w-5 h-5" /> 當前叫價
            </h3>
            {gameData.lastBid ? (
              <div className="text-center p-6 bg-brand-500/5 rounded-2xl border border-brand-500/10">
                <div className="text-sm text-gray-400 mb-1">玩家 {gameData.lastBid.bidderId} 叫了</div>
                <div className="text-5xl font-black text-brand-600 dark:text-brand-400 flex items-center justify-center gap-4">
                  {gameData.lastBid.amount} 個 
                  <span className="text-4xl inline-block transition-transform scale-125">
                    {(() => {
                      const Icon = DICE_ICONS[gameData.lastBid.face];
                      return Icon ? <Icon className="w-10 h-10" /> : gameData.lastBid.face;
                    })()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                尚未有人叫價
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3">
             <div className="text-center text-sm">
                現在輪到: <span className={cn("font-black px-3 py-1 rounded-full", isMyTurn ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-800")}>
                    {players[Object.keys(players)[gameData.currentPlayerIndex]]?.id}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* 操作面板 */}
      {isMyTurn && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass p-8 rounded-3xl border-t-4 border-brand-500 shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-tighter">數量</span>
                <div className="flex items-center gap-4">
                    <button onClick={() => setBidAmount(Math.max(1, bidAmount - 1))} className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10">-</button>
                    <span className="text-3xl font-black min-w-[3rem] text-center">{bidAmount}</span>
                    <button onClick={() => setBidAmount(bidAmount + 1)} className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-tighter">點數</span>
                <div className="flex gap-2">
                    {[2, 3, 4, 5, 6, 1].map((f) => {
                        const Icon = DICE_ICONS[f]!;
                        return (
                            <button
                                key={f}
                                onClick={() => setBidFace(f)}
                                className={cn(
                                    "p-2 rounded-xl border-2 transition-all",
                                    bidFace === f ? "border-brand-500 bg-brand-500/10" : "border-transparent bg-white dark:bg-black/20"
                                )}
                            >
                                <Icon className={cn("w-6 h-6", bidFace === f ? "text-brand-500" : "text-gray-400")} />
                            </button>
                        )
                    })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleBid}
                className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95"
              >
                確認叫價
              </button>
              {gameData.lastBid && (
                <button
                  onClick={handleChallenge}
                  className="w-full py-4 bg-red-500 hover:bg-red-400 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-5 h-5" /> 抓開 (質疑)
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* 歷史記錄 */}
      <div className="glass p-6 rounded-3xl">
        <h3 className="text-sm font-bold text-gray-500 flex items-center gap-2 mb-4">
            <History className="w-4 h-4" /> 遊戲歷程
        </h3>
        <div className="max-h-40 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
            {(gameData.history || []).slice().reverse().map((h: any, i: number) => (
                <div key={i} className="text-sm p-3 rounded-xl bg-white/30 dark:bg-black/20 flex justify-between items-center border border-white/10">
                    <span className="font-bold text-brand-600 dark:text-brand-400">{h.playerId === playerId ? '你' : h.playerId}</span>
                    <span className="text-gray-500">
                        {h.type === 'BID' ? `叫了 ${h.amount} 個 ${h.face}` : (h.success ? '質疑成功！' : '質疑失敗...')}
                    </span>
                </div>
            ))}
        </div>
      </div>
      {/* 揭曉畫面 (Phase: REVEAL) */}
      <AnimatePresence>
        {gameData.phase === 'REVEAL' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-4xl glass rounded-[3rem] border border-white/20 p-10 overflow-hidden shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Dice5 className="w-40 h-40" />
              </div>

              <div className="text-center space-y-4 mb-10">
                <h2 className={cn(
                  "text-5xl font-black italic",
                  gameData.revealResult.success ? "text-green-500" : "text-red-500"
                )}>
                  {gameData.revealResult.success ? "質疑成功！" : "質疑失敗..."}
                </h2>
                <p className="text-xl text-gray-400">
                  全場共有 <span className="text-white font-bold">{gameData.revealResult.count}</span> 個 
                  <span className="inline-block translate-y-1 mx-2">
                    {(() => {
                      const Icon = DICE_ICONS[gameData.revealResult.targetFace];
                      return Icon ? <Icon className="w-8 h-8" /> : gameData.revealResult.targetFace;
                    })()}
                  </span>
                  (包含星星)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Object.entries(gameData.dice).map(([pid, dice]) => (
                  <div key={pid} className={cn(
                    "p-6 rounded-3xl border transition-all",
                    pid === gameData.revealResult.bidder ? "bg-red-500/10 border-red-500/30" : 
                    pid === gameData.revealResult.challenger ? "bg-green-500/10 border-green-500/30" : 
                    "bg-white/5 border-white/10"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-bold flex items-center gap-2">
                        <User className="w-4 h-4" /> {pid}
                        {pid === gameData.revealResult.bidder && <span className="text-[10px] bg-red-500 text-white px-2 rounded">叫價者</span>}
                        {pid === gameData.revealResult.challenger && <span className="text-[10px] bg-green-500 text-white px-2 rounded">質疑者</span>}
                      </span>
                    </div>
                    {renderDice(dice as number[])}
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-center text-gray-500 font-mono text-xs animate-pulse">
                下一回合即將開始...
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
