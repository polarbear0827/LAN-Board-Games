"use client";

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Send, CheckCircle2, MessageSquare, BookOpen, Lock, ShieldCheck, X, Search, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TURTLE_SOUP_QUESTIONS } from "@/lib/turtleSoupData";

export default function TurtleSoup() {
  const { room, playerId, sendAction, aiConfig } = useGame();
  const [inputText, setInputText] = useState("");
  const [story, setStory] = useState("");
  const [truth, setTruth] = useState("");
  const [isAiAnswering, setIsAiAnswering] = useState(false);
  const [isGettingHint, setIsGettingHint] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  if (!room || !playerId) return null;

  const { gameState, players } = room;
  const data = gameState.data;
  // 如果是 AI 湯主模式且還沒結案，就算你是房主，也不具備「湯主」權限看謎底
  const isNarrator = data.narrator === playerId;
  const isAiNarrator = data.narrator === 'AI';
  const canSeeTruth = isNarrator || data.isSolved;

  const handleSetStory = () => {
    if (!story || !truth) return;
    sendAction('TURTLE_SOUP_MOVE', { type: 'SET_STORY', story, truth });
  };

  const handleAsk = () => {
    if (!inputText.trim()) return;
    sendAction('TURTLE_SOUP_MOVE', { type: 'ASK', text: inputText });
    setInputText("");
  };

  const handleAnswer = (questionId: number, answer: string) => {
    sendAction('TURTLE_SOUP_MOVE', { type: 'ANSWER', questionId, answer });
  };

  const handleSolved = () => {
    sendAction('TURTLE_SOUP_MOVE', { type: 'SOLVED' });
  };

  const handleRandomAiStory = () => {
    const randomIdx = Math.floor(Math.random() * TURTLE_SOUP_QUESTIONS.length);
    const q = TURTLE_SOUP_QUESTIONS[randomIdx];
    sendAction('TURTLE_SOUP_MOVE', { 
      type: 'SET_STORY', 
      story: q.question, 
      truth: q.answer 
    });
  };

  const handleAiGenerateStory = async () => {
    if (isGeneratingStory) return;
    setIsGeneratingStory(true);
    try {
      const systemPrompt = `你是一個創意無限的海龜湯（情境猜謎）構思者。
請生成一個全新、原創且具有震撼反轉的海龜湯題目。

輸出格式必須為 JSON：
{
  "question": "故事的開頭（給玩家看的謎題）",
  "answer": "故事的真相（真相必須邏輯自洽且具有反轉感）"
}

要求：
1. 故事要驚悚或溫馨，感人或詭異均可，但必須邏輯通順。
2. 真相不能太直白，需要多層次思考。
3. 繁體中文輸出。`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiConfig.provider, apiKey: aiConfig.apiKey, model: aiConfig.model,
          messages: [{ role: 'system', content: systemPrompt }]
        })
      });
      const resData = await res.json();
      // 嘗試解析 JSON 或直接使用內容
      let parsed;
      try {
        parsed = JSON.parse(resData.content);
      } catch (e) {
        // 如果不是 JSON，嘗試正則提取
        const qMatch = resData.content.match(/"question":\s*"(.*?)"/m);
        const aMatch = resData.content.match(/"answer":\s*"(.*?)"/m);
        if (qMatch && aMatch) parsed = { question: qMatch[1], answer: aMatch[1] };
      }

      if (parsed?.question && parsed?.answer) {
        sendAction('TURTLE_SOUP_MOVE', { 
          type: 'SET_STORY', 
          story: parsed.question, 
          truth: parsed.answer 
        });
      } else {
        alert("AI 生成失敗，請重試或切換模型。");
      }
    } catch (e) { console.error("Generation Failed", e); }
    finally { setIsGeneratingStory(false); }
  };

  const handleGetHint = async () => {
    if (isGettingHint) return;
    setIsGettingHint(true);
    try {
      const systemPrompt = `你是一個海龜湯的提示者。
題目：${data.story}
真相：${data.truth}

請針對目前的問答進度給出一個「隱晦但有幫助」的小提示，只能給一句話，絕對不可以直接說出真相關鍵。`;
      
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiConfig.provider, apiKey: aiConfig.apiKey, model: aiConfig.model,
          messages: [{ role: 'system', content: systemPrompt }]
        })
      });
      const resData = await res.json();
      if (resData.content) {
        sendAction('TURTLE_SOUP_MOVE', { type: 'SET_HINT', text: resData.content });
      }
    } catch (e) { console.error("Hint Failed", e); }
    finally { setIsGettingHint(false); }
  };

  // AI 自動回答邏輯
  React.useEffect(() => {
    const unanswered = data.questions?.filter((q: any) => q.answer === null);
    // 只有房主負責觸發 AI 回答（避免多個客戶端重複請求，且確保有 API Key 的房主執行）
    if (room.hostId === playerId && aiConfig.isEnabled && unanswered?.length > 0 && !isAiAnswering) {
      const q = unanswered[0];
      askAi(q);
    }
  }, [data.questions, aiConfig.isEnabled, room.hostId, playerId, isAiAnswering]);

  const askAi = async (q: any) => {
    setIsAiAnswering(true);
    try {
      const systemPrompt = `你是一個海龜湯（情境猜謎）的湯主。
題目：${data.story}
真相：${data.truth}

玩家提問：${q.text}

規則：
1. 你只能回答「是」、「不是」或「無關」。
2. 如果玩家問的內容與真相核心非常接近，可以回答「是，且非常接近關鍵」。
3. 如果玩家完全猜中真相，請回答「完全正確，恭喜破案！」。
4. 嚴禁直接洩漏真相細節，除非玩家問對。
5. 請保持神祕感且回答簡短。`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiConfig.provider,
          apiKey: aiConfig.apiKey,
          model: aiConfig.model,
          messages: [{ role: 'system', content: systemPrompt }]
        })
      });
      const resData = await res.json();
      const aiReply = resData.content || "無關";
      
      handleAnswer(q.id, aiReply);

      // 自動結案判定
      if (aiReply.includes("完全正確") || aiReply.includes("恭喜破案")) {
        setTimeout(handleSolved, 2000);
      }
    } catch (e) {
      console.error("AI Answer Failed", e);
    } finally {
      setIsAiAnswering(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tighter text-brand-600 dark:text-brand-400">海龜湯</h2>
        <p className="text-gray-500 font-medium">水平思考解謎遊戲</p>
      </div>

      {data.phase === 'SETTING' ? (
        <div className="glass p-10 rounded-[3rem] border border-white/20 shadow-2xl">
          {isAiNarrator ? (
            <div className="py-20 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="p-4 bg-brand-500/10 rounded-full animate-pulse">
                        <Sparkles className="w-12 h-12 text-brand-500" />
                    </div>
                </div>
                <h3 className="text-2xl font-black">AI 智慧湯主已就緒</h3>
                <p className="text-gray-500 leading-relaxed">
                    AI 將負責為大家挑選題目與判斷回答。<br/>
                    房主點擊下方按鈕即可隨機啟動一則案例。
                </p>
                {room.hostId === playerId && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleRandomAiStory}
                            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            <Search className="w-5 h-5" /> 從題庫挑選
                        </button>
                        <button
                            disabled={isGeneratingStory}
                            onClick={handleAiGenerateStory}
                            className="px-10 py-5 bg-brand-500 hover:bg-brand-400 text-white font-black rounded-3xl shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group relative overflow-hidden"
                        >
                            {isGeneratingStory ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                            <span>AI 創作新題目</span>
                            {isGeneratingStory && <motion.div layoutId="gen-bg" className="absolute inset-0 bg-brand-600/50" />}
                        </button>
                    </div>
                )}
            </div>
          ) : isNarrator ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-brand-600 dark:text-brand-400 mb-4">
                <BookOpen className="w-6 h-6" />
                <h3 className="text-xl font-bold">你是湯主，請出題</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  <label className="text-xs font-bold text-gray-400 uppercase col-span-full">從經典題庫挑選：</label>
                  {TURTLE_SOUP_QUESTIONS.slice(0, 9).map(q => (
                    <button 
                      key={q.id}
                      onClick={() => { setStory(q.question); setTruth(q.answer); }}
                      className="text-left px-3 py-2 text-[10px] bg-brand-500/5 hover:bg-brand-500/20 rounded-xl border border-brand-500/10 transition-all truncate font-bold text-brand-600 dark:text-brand-400"
                    >
                      {q.title}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-400 uppercase ml-1">故事開頭 (給玩家看)</label>
                   <textarea
                     value={story}
                     onChange={(e) => setStory(e.target.value)}
                     placeholder="例如：小明走進餐廳點了一碗海龜湯，點完後他就自殺了。為什麼？"
                     className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[100px] focus:ring-2 ring-brand-500 outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-400 uppercase ml-1">故事真相 (僅你看得見)</label>
                   <textarea
                     value={truth}
                     onChange={(e) => setTruth(e.target.value)}
                     placeholder="只有湯主知道的完整反轉劇情..."
                     className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[100px] focus:ring-2 ring-brand-500 outline-none transition-all"
                   />
                </div>
                <button
                  onClick={handleSetStory}
                  className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl shadow-xl transition-all"
                >
                  發布題目，開始喝湯！
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center space-y-4">
               <div className="flex justify-center">
                  <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center animate-bounce">
                     <HelpCircle className="w-8 h-8 text-brand-500" />
                  </div>
               </div>
               <h3 className="text-xl font-bold">等待湯主 {data.narrator} 出題中...</h3>
               <p className="text-gray-500 italic">準備好你的邏輯，真相只有一個！</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：故事資訊 */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass p-6 rounded-3xl border border-white/20 shadow-xl sticky top-24">
              <h3 className="font-bold flex items-center gap-2 mb-4 text-brand-500">
                <BookOpen className="w-5 h-5" /> 題目故事
              </h3>
              <p className="text-lg font-medium leading-relaxed mb-6">
                {data.story}
              </p>
              
              {canSeeTruth && (
                <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-xs mb-2">
                    <ShieldCheck className="w-4 h-4" /> 故事真相 {data.isSolved ? "(揭曉)" : "(僅湯主可見)"}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    {data.truth}
                  </p>
                </div>
              )}

              {/* 小提示區域 (AI 模式下顯示) */}
              {(aiConfig.isEnabled || isAiNarrator) && !data.isSolved && (
                <div className="mt-6 space-y-3">
                   {room.hostId === playerId && (
                     <button
                        disabled={isGettingHint}
                        onClick={handleGetHint}
                        className="w-full py-3 bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 text-xs font-bold border border-brand-500/20 rounded-2xl transition-all flex items-center justify-center gap-2"
                     >
                        {isGettingHint ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        索取 AI 小提示
                     </button>
                   )}
                   
                   {data.history?.filter((h: any) => h.type === 'HINT').map((h: any, idx: number) => (
                     <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl"
                     >
                        <div className="text-[9px] text-yellow-600 font-bold uppercase mb-1">提示 #{idx+1}</div>
                        <p className="text-xs italic text-gray-500">{h.text}</p>
                     </motion.div>
                   ))}
                </div>
              )}
            </div>
          </div>

          {/* 右側：問答區 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass flex flex-col h-[600px] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative z-10">
              <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center relative z-20">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <h3 className="font-bold">問答廣場</h3>
                  {(aiConfig.isEnabled || isAiNarrator) && (
                    <div className="flex items-center gap-1 text-[10px] bg-brand-500/10 text-brand-500 px-2 py-1 rounded-full font-bold animate-pulse">
                      <Sparkles className="w-3 h-3" /> AI {isAiNarrator ? "湯主" : "模式"} 已啟動
                    </div>
                  )}
                </div>
                {isNarrator && !data.isSolved && (
                  <button
                    onClick={handleSolved}
                    className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white text-xs font-black rounded-full transition-all"
                  >
                    揭曉真相 (結案)
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {data.questions.map((q: any) => (
                  <motion.div
                    key={q.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={cn(
                      "group p-4 rounded-2xl border transition-all",
                      q.answer ? "bg-white/5 border-white/5" : "bg-brand-500/5 border-brand-500/20 shadow-lg shadow-brand-500/5"
                    )}
                  >
                    <div className="flex justify-between items-start gap-4">
                       <div className="space-y-1">
                          <span className="text-[10px] text-gray-500 font-bold uppercase">{q.playerId} 的提問:</span>
                          <p className="font-bold text-lg">{q.text}</p>
                       </div>
                       
                       {q.answer ? (
                         <div className={cn(
                           "px-4 py-2 rounded-xl text-xs font-black border uppercase tracking-widest",
                           q.answer === 'YES' ? "bg-green-500 border-green-400 text-white" :
                           q.answer === 'NO' ? "bg-red-500 border-red-400 text-white" :
                           "bg-gray-500 border-gray-400 text-white"
                         )}>
                            {q.answer === 'YES' ? '是' : q.answer === 'NO' ? '不是' : q.answer === 'IRRELEVANT' ? '無關' : q.answer}
                         </div>
                       ) : isNarrator && !aiConfig.isEnabled ? (
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleAnswer(q.id, 'YES')} className="p-2 bg-green-500 text-white rounded-lg hover:scale-110"><CheckCircle2 className="w-4 h-4" /></button>
                            <button onClick={() => handleAnswer(q.id, 'NO')} className="p-2 bg-red-500 text-white rounded-lg hover:scale-110"><X className="w-4 h-4" /></button>
                            <button onClick={() => handleAnswer(q.id, 'IRRELEVANT')} className="p-2 bg-gray-500 text-white rounded-lg hover:scale-110"><HelpCircle className="w-4 h-4" /></button>
                         </div>
                       ) : (
                         <div className="text-[10px] text-brand-500 font-bold animate-pulse uppercase tracking-widest flex items-center gap-1">
                            {aiConfig.isEnabled && <Loader2 className="w-3 h-3 animate-spin" />}
                            思考中...
                         </div>
                       )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 輸入框 (僅限猜題者且未結束) */}
              {!isNarrator && !data.isSolved && (
                <div className="p-6 bg-white/5 border-t border-white/5 relative z-30">
                  <div className="flex gap-3">
                     <input
                       type="text"
                       value={inputText}
                       onChange={(e) => setInputText(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                       placeholder="輸入你的提問..."
                       className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-brand-500 transition-all"
                     />
                     <button
                       onClick={handleAsk}
                       className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white hover:bg-brand-500 transition-all shadow-lg"
                     >
                       <Send className="w-5 h-5" />
                     </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
