"use client";

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Skull, Shield, Eye, Droplets, User, MessageSquare, AlertTriangle, CheckCircle2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WEREWOLF_SCRIPTS } from "@/lib/games/werewolfPhrases";

const DroneOscillator = () => {
  const audioCtx = React.useRef<AudioContext | null>(null);
  const osc = React.useRef<OscillatorNode | null>(null);

  React.useEffect(() => {
    return () => {
      if (osc.current) osc.current.stop();
      if (audioCtx.current) audioCtx.current.close();
    };
  }, []);

  const startDrone = () => {
    if (audioCtx.current) return;
    audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    osc.current = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    
    osc.current.type = 'sine';
    osc.current.frequency.setValueAtTime(55, audioCtx.current.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.current.currentTime);
    
    osc.current.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.current.start();
  };

  return { startDrone };
};

export default function Werewolf() {
  const { room, playerId, sendAction } = useGame();
  const [audioStarted, setAudioStarted] = React.useState(false);
  const lastPhase = React.useRef<string | null>(null);
  const { startDrone } = DroneOscillator();
  
  if (!room || !playerId) return null;

  const { gameState } = room;
  const data = gameState.data;
  const myRole = data.roles[playerId];
  const myStatus = data.status[playerId];
  const alivePlayers = Object.keys(data.status).filter(id => data.status[id].alive);

  // 語音播放邏輯
  React.useEffect(() => {
    if (!audioStarted || data.phase === lastPhase.current) return;
    
    const script = WEREWOLF_SCRIPTS[data.phase];
    if (script) {
      const utterance = new SpeechSynthesisUtterance(script);
      utterance.lang = 'zh-TW';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
    lastPhase.current = data.phase;
  }, [data.phase, audioStarted]);

  // 夜晚閉眼判定
  const isMyTurn = (
    (data.phase === 'NIGHT_WOLF' && myRole === 'WEREWOLF') ||
    (data.phase === 'NIGHT_SEER' && myRole === 'SEER') ||
    (data.phase === 'NIGHT_WITCH' && myRole === 'WITCH')
  );
  const shouldCloseEyes = data.phase.startsWith('NIGHT_') && !isMyTurn && myStatus.alive && data.phase !== 'NIGHT_START';

  const handleWolfKill = (targetId: string) => {
    sendAction('WEREWOLF_MOVE', { type: 'WOLF_KILL', targetId });
  };

  const handleSeerCheck = (targetId: string) => {
    sendAction('WEREWOLF_MOVE', { type: 'SEER_CHECK', targetId });
  };

  const handleWitchAction = (action: 'SAVE' | 'KILL' | 'PASS', targetId?: string) => {
    sendAction('WEREWOLF_MOVE', { type: 'WITCH_ACTION', action, targetId });
  };

  const handleVoteExile = (targetId: string) => {
    sendAction('WEREWOLF_MOVE', { type: 'VOTE_EXILE', targetId });
  };

  const handleNextDay = () => {
    sendAction('WEREWOLF_MOVE', { type: 'DAY_DISCUSS' });
  };

  // 渲染夜晚視角
  const renderNight = () => {
    if (!myStatus.alive) return (
      <div className="text-center py-20 space-y-4">
        <Skull className="w-20 h-20 text-gray-600 mx-auto" />
        <h3 className="text-2xl font-bold text-gray-500">你已死亡，請保持安靜</h3>
      </div>
    );

    switch (data.phase) {
      case 'NIGHT_START':
        if (room.hostId === playerId) {
          return (
            <div className="py-20 text-center space-y-6">
              <Moon className="w-20 h-20 text-blue-400 mx-auto animate-pulse" />
              <h3 className="text-2xl font-black">準備好開始夜晚了嗎？</h3>
              <p className="text-gray-400 text-sm">點擊按鈕後，系統將開始自動語音導覽與流程切換。</p>
              <button 
                onClick={() => sendAction('WEREWOLF_MOVE', { type: 'START_NIGHT' })}
                className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl transition-all"
              >
                開始入睡
              </button>
            </div>
          );
        }
        return (
          <div className="py-20 text-center animate-pulse">
            <Moon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold">天黑請閉眼，等待房主啟動夜晚...</h3>
          </div>
        );

      case 'NIGHT_WOLF':
        if (myRole === 'WEREWOLF') {
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-red-500 mb-4">
                <Moon className="w-8 h-8" />
                <h3 className="text-2xl font-black italic">狼人請睜眼，你要殺誰？</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {alivePlayers.map(id => (
                  <button
                    key={id}
                    onClick={() => handleWolfKill(id)}
                    className={cn(
                      "glass p-4 rounded-2xl border transition-all text-center group",
                      data.wolfTarget === id ? "border-red-500 bg-red-500/20" : "border-white/5 hover:border-red-500/50"
                    )}
                  >
                    <User className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-red-500" />
                    <span className="font-bold">{id}</span>
                    {data.roles[id] === 'WEREWOLF' && <span className="ml-2 text-[10px] bg-red-500 text-white px-1 rounded">同伴</span>}
                  </button>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div className="py-20 text-center animate-pulse">
            <Moon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold">天黑請閉眼，狼人正在行動...</h3>
          </div>
        );

      case 'NIGHT_SEER':
        if (myRole === 'SEER') {
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-blue-400 mb-4">
                <Eye className="w-8 h-8" />
                <h3 className="text-2xl font-black">預言家請睜眼，你要查驗誰？</h3>
              </div>
              {data.seerCheck && (
                <div className={cn("p-4 rounded-2xl border text-center font-bold mb-4", data.seerCheck.isBad ? "bg-red-500/20 border-red-500 text-red-500" : "bg-green-500/20 border-green-500 text-green-500")}>
                  查驗結果：{data.seerCheck.targetId} 是 {data.seerCheck.isBad ? '壞人' : '好人'}
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {alivePlayers.filter(id => id !== playerId).map(id => (
                  <button
                    key={id}
                    onClick={() => handleSeerCheck(id)}
                    className="glass p-4 rounded-2xl border border-white/5 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-center"
                  >
                    <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <span className="font-bold">{id}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div className="py-20 text-center animate-pulse">
            <Moon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold">天黑請閉眼，預言家正在查驗...</h3>
          </div>
        );

      case 'NIGHT_WITCH':
        if (myRole === 'WITCH') {
          return (
            <div className="space-y-6 text-center">
              <div className="flex items-center justify-center gap-3 text-purple-400 mb-8">
                <Droplets className="w-8 h-8" />
                <h3 className="text-2xl font-black">女巫請睜眼</h3>
              </div>
              <div className="space-y-8">
                <div className="glass p-6 rounded-3xl border border-purple-500/30">
                  <p className="text-lg mb-4">昨晚死的是：<span className="text-red-500 font-black">{data.wolfTarget || '無人'}</span></p>
                  <div className="flex justify-center gap-4">
                    {data.witchPotions.save && data.wolfTarget && (
                      <button onClick={() => handleWitchAction('SAVE')} className="px-6 py-3 bg-green-600 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2">
                        <Shield className="w-4 h-4" /> 使用解藥
                      </button>
                    )}
                    {data.witchPotions.kill && (
                      <div className="flex flex-col gap-2">
                         <div className="text-xs text-gray-500">或 毒殺一名玩家</div>
                         <div className="flex flex-wrap gap-2 justify-center">
                           {alivePlayers.map(id => (
                             <button key={id} onClick={() => handleWitchAction('KILL', id)} className="px-3 py-1 bg-red-900/50 border border-red-500/50 rounded-lg text-xs hover:bg-red-500 transition-colors">
                               毒 {id}
                             </button>
                           ))}
                         </div>
                      </div>
                    )}
                    <button onClick={() => handleWitchAction('PASS')} className="px-6 py-3 bg-gray-600 rounded-xl font-bold hover:scale-105 transition-transform">
                      不進行動作
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="py-20 text-center animate-pulse">
            <Moon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold">天黑請閉眼，女巫正在用藥...</h3>
          </div>
        );
      
      default: return null;
    }
  };

  // 渲染白天視角
  const renderDay = () => {
    switch (data.phase) {
      case 'DAY_ANNOUNCE':
        return (
          <div className="text-center space-y-8 py-10">
            <Sun className="w-20 h-20 text-yellow-500 mx-auto animate-spin-slow" />
            <div>
              <h3 className="text-3xl font-black mb-2">昨晚死亡情況</h3>
              <div className="flex justify-center gap-4 flex-wrap">
                {data.diedLastNight.length > 0 ? data.diedLastNight.map((id: string) => (
                  <div key={id} className="glass px-6 py-3 rounded-2xl border border-red-500/30 text-red-500 font-bold flex items-center gap-2">
                    <Skull className="w-5 h-5" /> {id} 死了
                  </div>
                )) : (
                  <div className="glass px-6 py-3 rounded-2xl border border-green-500/30 text-green-500 font-bold">
                    昨晚是個平安夜
                  </div>
                )}
              </div>
            </div>
            <button
               onClick={handleNextDay}
               className="px-12 py-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl shadow-xl transition-all"
            >
              進入討論與投票
            </button>
          </div>
        );

      case 'DAY_VOTE':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-yellow-600 dark:text-yellow-400 mb-4">
              <MessageSquare className="w-8 h-8" />
              <h3 className="text-2xl font-black">公投環節：誰是狼人？</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alivePlayers.map(id => (
                <button
                  key={id}
                  onClick={() => handleVoteExile(id)}
                  className={cn(
                    "glass p-6 rounded-3xl border text-left flex justify-between items-center transition-all group",
                    data.votes[playerId] === id ? "border-brand-500 bg-brand-500/10" : "border-white/5 hover:border-brand-500/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-bold">
                       {id[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{id}</div>
                      <div className="text-xs text-gray-500">
                        {Object.values(data.votes).filter(v => v === id).length} 票
                      </div>
                    </div>
                  </div>
                  {data.votes[playerId] === id && <CheckCircle2 className="w-6 h-6 text-brand-500" />}
                </button>
              ))}
              <button
                 onClick={() => handleVoteExile("")}
                 className={cn("glass p-6 rounded-3xl border text-center font-bold", !data.votes[playerId] ? "border-gray-500 bg-gray-500/10" : "border-white/5")}
              >
                棄票
              </button>
            </div>
          </div>
        );
      
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 relative overflow-hidden">
      {/* 背景低頻律動動畫 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={cn(
          "absolute inset-0 transition-opacity duration-[3000ms]",
          data.phase.startsWith('NIGHT') ? "opacity-30" : "opacity-0"
        )}>
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent animate-pulse-slow" />
        </div>
      </div>

      {!audioStarted && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center p-8 glass rounded-3xl border border-brand-500/30 max-w-sm"
          >
            <Volume2 className="w-16 h-16 text-brand-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-black mb-2">啟動同步語音</h2>
            <p className="text-gray-400 mb-6 text-sm">為了確保遊戲體驗，請點擊下方按鈕啟動角色配音與環境音效。</p>
            <button 
              onClick={() => { setAudioStarted(true); startDrone(); }}
              className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl shadow-xl shadow-brand-500/20"
            >
              我也要加入！
            </button>
          </motion.div>
        </div>
      )}

      {/* 閉眼遮罩 (Night Overlay) */}
      <AnimatePresence>
        {shouldCloseEyes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center text-center p-8"
          >
            <div className="relative">
               <Moon className="w-32 h-32 text-blue-900/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-2xl" />
               <Moon className="w-24 h-24 text-blue-500 animate-pulse-slow relative z-10" />
            </div>
            <h2 className="text-3xl font-black mt-8 tracking-widest text-blue-200">天黑請閉眼</h2>
            <p className="text-blue-400/60 mt-4 font-bold flex items-center gap-2">
               <Droplets className="w-4 h-4 animate-bounce" /> 
               {data.phase === 'NIGHT_WOLF' ? "狼人正在覓食..." : 
                data.phase === 'NIGHT_SEER' ? "預言家正在查驗..." : "女巫正在調配毒藥..."}
            </p>
            <div className="mt-12 w-48 h-1 bg-blue-950 rounded-full overflow-hidden">
               <motion.div 
                 animate={{ x: [-200, 200] }}
                 transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                 className="w-full h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
           key={data.phase}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -20 }}
           className="max-w-4xl mx-auto relative z-10"
        >
          {/* 角色顯示區 */}
          <div className="glass p-6 rounded-[2.5rem] border border-white/5 mb-8 flex justify-between items-center overflow-hidden relative shadow-2xl">
             <div className="z-10">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">你的身份</div>
                <div className="text-3xl font-black flex items-center gap-3">
                   {myRole === 'WEREWOLF' ? <Skull className="text-red-500" /> : <Shield className="text-blue-500" />}
                   {myRole === 'WEREWOLF' ? '狼人' : myRole === 'SEER' ? '預言家' : myRole === 'WITCH' ? '女巫' : '村民'}
                </div>
             </div>
             <div className="z-10 text-right">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">遊戲時間</div>
                <div className="text-2xl font-mono font-bold">
                   第 {data.dayCount} {data.phase.startsWith('NIGHT') ? '晚' : '天'}
                </div>
             </div>
             <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", myRole === 'WEREWOLF' ? "from-red-600" : "from-blue-600")} />
          </div>

          {/* 遊戲核心渲染 */}
          {data.phase.startsWith('NIGHT') ? renderNight() : renderDay()}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
