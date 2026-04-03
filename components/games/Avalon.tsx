"use client";

import React, { useState, useEffect } from "react";
import { useGame } from "@/context/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sword, User, Users, Check, X, AlertTriangle, Eye, EyeOff, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_INFO: Record<string, { desc: string; side: 'GOOD' | 'BAD'; color: string; icon: any }> = {
  'Merlin': { desc: '知道誰是壞人（除了莫德雷德），但不能暴露自己。', side: 'GOOD', color: 'blue', icon: Eye },
  'Percival': { desc: '知道誰是梅林與莫甘娜。', side: 'GOOD', color: 'cyan', icon: Sword },
  '忠臣': { desc: '亞瑟的誠實部下，努力讓任務成功。', side: 'GOOD', color: 'green', icon: Shield },
  'Assassin': { desc: '在好人勝利後，若成功刺殺梅林則反敗為勝。', side: 'BAD', color: 'red', icon: Sword },
  'Morgana': { desc: '假扮成梅林，迷惑派西維爾。', side: 'BAD', color: 'purple', icon: EyeOff },
  'Mordred': { desc: '梅林看不見的壞人。', side: 'BAD', color: 'orange', icon: User },
  'Oberon': { desc: '壞人不知道他是誰，他也不知道壞人是誰。', side: 'BAD', color: 'pink', icon: Info },
  '爪牙': { desc: '莫德雷德的爪牙，努力讓任務失敗。', side: 'BAD', color: 'slate', icon: Sword },
};

export default function Avalon() {
  const { room, playerId, sendAction } = useGame();
  const [showRole, setShowRole] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  if (!room || !playerId) return null;

  const { gameState, players } = room;
  const data = gameState.data;
  const myRole = data.playerRoles[playerId];
  const isLeader = data.playerOrder[data.leaderIndex] === playerId;
  const myInfo = ROLE_INFO[myRole];

  // 計算每個階段顯示的狀態
  const teamSize = getQuestTeamSize(Object.keys(players).length, data.questNumber);

  function getQuestTeamSize(playersCount: number, quest: number) {
    const table: Record<number, number[]> = {
      5: [2, 3, 2, 3, 3],
      6: [2, 3, 4, 3, 4],
      7: [2, 3, 3, 4, 4],
      8: [3, 4, 4, 5, 5],
      9: [3, 4, 4, 5, 5],
      10: [3, 4, 4, 5, 5],
    };
    return table[playersCount]?.[quest - 1] || 2;
  }

  // 獲取私密資訊（誰看到誰）
  const getHiddenKnowledge = () => {
    const kb: string[] = [];
    const roles = data.playerRoles;
    
    if (myRole === 'Merlin') {
      Object.entries(roles).forEach(([id, role]) => {
        if (id !== playerId && ROLE_INFO[role as string].side === 'BAD' && role !== 'Mordred') {
          kb.push(`${id} 是壞人`);
        }
      });
    } else if (myRole === 'Percival') {
      Object.entries(roles).forEach(([id, role]) => {
        if (role === 'Merlin' || role === 'Morgana') {
          kb.push(`${id} 可能是梅林`);
        }
      });
    } else if (myInfo.side === 'BAD' && myRole !== 'Oberon') {
      Object.entries(roles).forEach(([id, role]) => {
        if (id !== playerId && ROLE_INFO[role as string].side === 'BAD' && role !== 'Oberon') {
          kb.push(`${id} 是同隊`);
        }
      });
    }
    return kb;
  };

  const handleNominate = () => {
    if (selectedPlayers.length !== teamSize) return;
    sendAction('AVALON_MOVE', { type: 'NOMINATE', team: selectedPlayers });
  };

  const handleVoteTeam = (vote: boolean) => {
    sendAction('AVALON_MOVE', { type: 'VOTE_TEAM', vote });
  };

  const handleVoteMission = (vote: boolean) => {
     sendAction('AVALON_MOVE', { type: 'VOTE_MISSION', vote });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
      {/* 頂部任務進度 */}
      <div className="flex justify-center gap-4 py-4 overflow-x-auto scrollbar-hide">
        {data.quests.map((q: number, i: number) => (
          <div key={i} className="flex flex-col items-center gap-2 min-w-[60px]">
             <div className={cn(
               "w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-lg",
               q === 1 ? "bg-blue-500 border-blue-600 text-white" : 
               q === -1 ? "bg-red-500 border-red-600 text-white" : 
               "bg-white/10 border-white/20 text-gray-400"
             )}>
                {i + 1}
             </div>
             <span className="text-[10px] text-gray-500">
                {getQuestTeamSize(Object.keys(players).length, i+1)}人
                {Object.keys(players).length >= 7 && i === 3 && "(需2敗)"}
             </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：身份卡 */}
        <div className="lg:col-span-1 space-y-4">
          <motion.div 
            className={cn(
              "glass p-6 rounded-3xl border-2 relative overflow-hidden transition-all duration-500",
              showRole ? (myInfo.side === 'GOOD' ? "border-blue-500 bg-blue-500/10" : "border-red-500 bg-red-500/10") : "border-white/10"
            )}
            onClick={() => setShowRole(!showRole)}
          >
            <div className="flex justify-between items-start mb-6">
               <h3 className="font-bold text-gray-400 uppercase tracking-widest text-xs">你的身份</h3>
               {showRole ? <Eye className="w-4 h-4 text-gray-400" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
            </div>
            
            <AnimatePresence mode="wait">
              {showRole ? (
                <motion.div 
                  key="role" 
                  initial={{ opacity: 0, scale: 0.8 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="space-y-4"
                >
                  <div className="text-4xl font-black mb-2">{myRole}</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{myInfo.desc}</p>
                  
                  {/* 私密資訊 */}
                  {getHiddenKnowledge().length > 0 && (
                    <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                       <span className="text-[10px] font-bold text-brand-500">私密筆記:</span>
                       {getHiddenKnowledge().map((note, i) => (
                         <div key={i} className="text-xs text-brand-400">• {note}</div>
                       ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="hint" className="py-12 text-center text-gray-500 italic">點擊揭開身份</motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="glass p-4 rounded-2xl border border-white/10">
             <div className="text-xs font-bold text-gray-500 mb-2 uppercase">失敗提議計數器 (5次則壞人贏)</div>
             <div className="flex gap-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={cn(
                    "flex-1 h-3 rounded-full transition-all",
                    i <= data.failedVotesCount ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-white/10"
                  )} />
                ))}
             </div>
          </div>
        </div>

        {/* 右側：主遊戲區 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 當前階段面板 */}
          <div className="glass p-8 rounded-3xl border-l-8 border-brand-500 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Users className="w-32 h-32" />
             </div>

             <h2 className="text-2xl font-black mb-1">
                {data.phase === 'NOMINATING' ? '隊伍提議階段' : 
                 data.phase === 'VOTING_TEAM' ? '全體投票階段' : 
                 data.phase === 'VOTING_MISSION' ? '任務執行階段' : '遊戲進行中'}
             </h2>
             <p className="text-gray-500 mb-6 font-medium">
                {data.phase === 'NOMINATING' ? `領袖 ${data.playerOrder[data.leaderIndex]} 正在挑選 ${teamSize} 名隊員...` : 
                 data.phase === 'VOTING_TEAM' ? `大家對此團隊是否滿意？` : 
                 `被選中的隊員正在秘密執行任務...`}
             </p>

             {/* NOMINATING UI */}
             {data.phase === 'NOMINATING' && (
               <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {data.playerOrder.map((id: string) => (
                      <button
                        key={id}
                        disabled={!isLeader}
                        onClick={() => {
                          if (selectedPlayers.includes(id)) setSelectedPlayers(selectedPlayers.filter(p => p !== id));
                          else if (selectedPlayers.length < teamSize) setSelectedPlayers([...selectedPlayers, id]);
                        }}
                        className={cn(
                          "px-4 py-3 rounded-2xl border-2 transition-all flex items-center gap-2",
                          selectedPlayers.includes(id) ? "border-brand-500 bg-brand-500/10 text-brand-600" : "border-transparent bg-white/5 text-gray-400 hover:bg-white/10"
                        )}
                      >
                         <User className="w-4 h-4" />
                         <span>{id}</span>
                         {id === data.playerOrder[data.leaderIndex] && <span className="text-[10px] bg-brand-500 text-white px-1.5 rounded">領袖</span>}
                      </button>
                    ))}
                  </div>
                  {isLeader && (
                    <button
                      onClick={handleNominate}
                      disabled={selectedPlayers.length !== teamSize}
                      className="w-full py-4 bg-brand-600 text-white font-black rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:bg-brand-500 transition-all"
                    >
                      出發！(確認提議)
                    </button>
                  )}
               </div>
             )}

             {/* VOTING_TEAM UI */}
             {data.phase === 'VOTING_TEAM' && (
               <div className="space-y-6">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-xs text-gray-500 font-bold uppercase">提議團隊:</span>
                    <div className="flex gap-2 mt-2">
                      {data.currentTeam.map((id: string) => (
                        <div key={id} className="px-3 py-1 bg-brand-500/20 text-brand-400 rounded-lg text-sm font-bold border border-brand-500/20">{id}</div>
                      ))}
                    </div>
                 </div>
                 {data.votes[playerId] === undefined ? (
                    <div className="flex gap-4">
                      <button onClick={() => handleVoteTeam(true)} className="flex-1 py-4 bg-green-500 rounded-2xl text-white font-black hover:bg-green-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"><Check className="w-6 h-6" /> 支持</button>
                      <button onClick={() => handleVoteTeam(false)} className="flex-1 py-4 bg-red-500 rounded-2xl text-white font-black hover:bg-red-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"><X className="w-6 h-6" /> 反對</button>
                    </div>
                 ) : (
                    <div className="text-center py-6 text-brand-500 font-bold italic animate-pulse">等待其他玩家投票中...</div>
                 )}
               </div>
             )}

             {/* VOTING_MISSION UI */}
             {data.phase === 'VOTING_MISSION' && (
               <div className="space-y-6">
                 {data.currentTeam.includes(playerId) ? (
                    <div>
                      <h4 className="text-center text-sm font-bold text-brand-500 mb-6">你是執行者，請選擇任務結果：</h4>
                      <div className="flex gap-4">
                        <button onClick={() => handleVoteMission(true)} className="flex-1 h-32 bg-blue-600 rounded-3xl text-white font-black flex flex-col items-center justify-center gap-3 shadow-xl hover:bg-blue-500 transition-all animate-glow"><Sword className="w-10 h-10" /> 成功</button>
                        {myInfo.side === 'BAD' && (
                          <button onClick={() => handleVoteMission(false)} className="flex-1 h-32 bg-red-600 rounded-3xl text-white font-black flex flex-col items-center justify-center gap-3 shadow-xl hover:bg-red-500 transition-all"><AlertTriangle className="w-10 h-10" /> 失敗</button>
                        )}
                      </div>
                    </div>
                 ) : (
                    <div className="text-center py-12 text-gray-500 border-2 border-dashed border-white/10 rounded-3xl animate-pulse">
                      任務執行中... 請等待結果揭曉
                    </div>
                 )}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
