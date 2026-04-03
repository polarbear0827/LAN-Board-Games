const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

// 阿瓦隆角色配置 (人數: {好人, 壞人})
const AVALON_CONFIG = {
  5: { good: 3, bad: 2 },
  6: { good: 4, bad: 2 },
  7: { good: 4, bad: 3 },
  8: { good: 5, bad: 3 },
  9: { good: 6, bad: 3 },
  10: { good: 6, bad: 4 }
};

function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

// 遊戲狀態存儲
const rooms = {};
const DISCONNECT_TIMEOUT = 60000; 

// --- 閒置關機配置 (測試期間延長) ---
let lastActivityAt = Date.now();
const IDLE_WARNING_THRESHOLD = 1790000; // 29 分 50 秒
const IDLE_SHUTDOWN_THRESHOLD = 1800000; // 30 分鐘
let isShuttingDown = false;

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  const emitRoomUpdate = (gid, room) => {
    // 數據脫敏：如果是 AI 擔任湯主且還未解開，對所有客戶端隱藏真相
    const isAiNarrator = room.gameState.type === 'TURTLE_SOUP' && room.gameState.data?.narrator === 'AI';
    const isSolved = room.gameState.data?.isSolved;
    
    if (isAiNarrator && !isSolved) {
      const clonedRoom = JSON.parse(JSON.stringify(room));
      if (clonedRoom.gameState.data) {
        clonedRoom.gameState.data.truth = '*** 謎底由 AI 保守中 ***';
      }
      io.to(gid).emit('room_update', clonedRoom);
    } else {
      io.to(gid).emit('room_update', room);
    }
  };

  const refreshActivity = () => {
    lastActivityAt = Date.now();
    isShuttingDown = false;
  };

  io.on('connection', (socket) => {
    socket.on('join_room', ({ gameId, playerId, pin }) => {
      refreshActivity();
      const gid = gameId || 'MAIN';
      if (!playerId || !pin) return;
      
      if (!rooms[gid]) {
        rooms[gid] = {
          players: {},
          hostId: playerId,
          gameState: { 
            status: 'LOBBY', 
            type: null, 
            selectedGameId: 'LIARS_DICE',
            data: {} 
          },
          lastPlayerExitTimes: {}
        };
      }
      const room = rooms[gid];
      if (room.players[playerId] && room.players[playerId].pin !== pin) {
        socket.emit('error_message', '玩家 ID 已存在且 PIN 不正確');
        return;
      }
      room.players[playerId] = {
        id: playerId, 
        pin, 
        socketId: socket.id, 
        connected: true, 
        lastSeen: Date.now(),
        isReady: playerId === room.hostId // 房主預設 Ready
      };
      delete room.lastPlayerExitTimes[playerId];
      socket.join(gid);
      io.to(gid).emit('room_update', room);
    });

    socket.on('game_action', ({ gameId, playerId, action, payload }) => {
      refreshActivity();
      const gid = gameId || 'MAIN';
      const room = rooms[gid];
      if (!room) return;

      console.log(`[Action] Room: ${gid}, Player: ${playerId}, Action: ${action}`);

      // --- 大廳共通動作 ---

      // 房主選遊戲
      if (action === 'SELECT_GAME' && room.hostId === playerId) {
        room.gameState.selectedGameId = payload.selectedGameId;
        // 重置除了房主以外的準備狀態
        Object.keys(room.players).forEach(id => {
          if (id !== room.hostId) room.players[id].isReady = false;
        });
        emitRoomUpdate(gid, room);
        return;
      }

      // 玩家準備
      if (action === 'TOGGLE_READY') {
        if (room.players[playerId]) {
          room.players[playerId].isReady = !room.players[playerId].isReady;
          emitRoomUpdate(gid, room);
        }
        return;
      }

      const checkAllReady = () => {
        const others = Object.values(room.players).filter(p => p.id !== room.hostId);
        return others.every(p => p.isReady);
      };

      // --- 統一開始邏輯 ---
      if (action === 'START_GAME' && room.hostId === playerId) {
        if (!checkAllReady()) return socket.emit('error_message', '還有玩家未準備好');
        
        const gameType = room.gameState.selectedGameId;
        const playerIds = Object.keys(room.players);

        room.gameState.status = 'PLAYING';
        room.gameState.type = gameType;

        if (gameType === 'LIARS_DICE') {
          const initialDice = {};
          playerIds.forEach(id => {
            initialDice[id] = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
          });
          room.gameState.data = {
            round: 1, currentPlayerIndex: 0, lastBid: null, history: [], dice: initialDice, phase: 'BIDDING'
          };
        } else if (gameType === 'AVALON') {
          const count = playerIds.length;
          const config = AVALON_CONFIG[Math.min(count, 10)] || { good: 1, bad: 0 };
          const roles = ['Merlin', 'Percival'];
          for (let i = 0; i < Math.max(0, config.good - 2); i++) roles.push('忠臣');
          roles.push('Assassin', 'Morgana');
          if (config.bad >= 3) roles.push('Mordred');
          if (config.bad >= 4) roles.push('Oberon');
          while (roles.length < count) roles.push('爪牙');

          shuffle(roles);
          const playerRoles = {};
          playerIds.forEach((id, index) => { playerRoles[id] = roles[index]; });

          room.gameState.data = {
            round: 1, questNumber: 1, failedVotesCount: 0, leaderIndex: 0,
            playerOrder: shuffle([...playerIds]), playerRoles, quests: [0,0,0,0,0],
            history: [], phase: 'NOMINATING', currentTeam: [], votes: {}, questVotes: []
          };
        } else if (gameType === 'TURTLE_SOUP') {
          const isAiNarrator = payload?.aiConfig?.isAiNarrator;
          room.gameState.data = {
            narrator: isAiNarrator ? 'AI' : playerId,
            story: '',
            truth: '',
            questions: [],
            isSolved: false,
            phase: 'SETTING' 
          };
        } else if (gameType === 'WEREWOLF') {
          const count = playerIds.length;
          let roles = ['WEREWOLF', 'WEREWOLF', 'SEER', 'WITCH', 'VILLAGER', 'VILLAGER'];
          if (count >= 7) roles.push('VILLAGER');
          if (count >= 8) roles.push('WEREWOLF');
          while (roles.length < count) roles.push('VILLAGER');

          shuffle(roles);
          const playerRoles = {};
          const playerStatus = {};
          playerIds.forEach((id, idx) => {
            playerRoles[id] = roles[idx];
            playerStatus[id] = { alive: true, item: null };
          });

          room.gameState.data = {
            phase: 'NIGHT_START',
            dayCount: 1,
            roles: playerRoles,
            status: playerStatus,
            diedLastNight: [],
            wolfTarget: null,
            seerCheck: null,
            witchPotions: { save: true, kill: true },
            votes: {},
            history: []
          };
        } else if (gameType === 'DICE_MODE') {
          room.gameState.data = {
            diceCount: 1,
            diceSides: 6,
            results: [],
            history: []
          };
        }
      }

      // --- 吹牛邏輯控制 ---
      if (action === 'MOVE') {
        const data = room.gameState.data;
        if (room.gameState.type === 'LIARS_DICE') {
          if (payload.lastBid) {
            data.lastBid = payload.lastBid;
            data.history.push({ type: 'BID', ...payload.lastBid });
            data.currentPlayerIndex = (data.currentPlayerIndex + 1) % Object.keys(room.players).length;
          }
          if (payload.phase === 'REVEAL') {
            data.phase = 'REVEAL';
            data.revealResult = payload.revealResult;
            data.history.push({ type: 'CHALLENGE', playerId, success: payload.revealResult.success });
            setTimeout(() => {
              if (rooms[gid]) {
                const r = rooms[gid];
                const nextDice = {};
                Object.keys(r.players).forEach(id => {
                  nextDice[id] = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
                });
                r.gameState.data = { ...r.gameState.data, lastBid: null, phase: 'BIDDING', dice: nextDice };
                emitRoomUpdate(gid, r);
              }
            }, 5000);
          }
        }
      }

      // --- 阿瓦隆核心動作 ---
      if (action === 'AVALON_MOVE') {
        const data = room.gameState.data;
        if (payload.type === 'NOMINATE') {
          data.currentTeam = payload.team;
          data.phase = 'VOTING_TEAM';
          data.votes = {};
        }
        if (payload.type === 'VOTE_TEAM') {
          data.votes[playerId] = payload.vote;
          if (Object.keys(data.votes).length === Object.keys(room.players).length) {
            const approveCount = Object.values(data.votes).filter(v => v === true).length;
            const success = approveCount > Object.keys(room.players).length / 2;
            if (success) {
              data.phase = 'VOTING_MISSION';
              data.questVotes = [];
              data.failedVotesCount = 0;
            } else {
              data.failedVotesCount += 1;
              data.leaderIndex = (data.leaderIndex + 1) % data.playerOrder.length;
              data.phase = 'NOMINATING';
              data.currentTeam = [];
            }
            data.history.push({ type: 'TEAM_VOTE_RESULT', success, votes: data.votes });
          }
        }
        if (payload.type === 'VOTE_MISSION') {
          data.questVotes.push(payload.vote);
          if (data.questVotes.length === data.currentTeam.length) {
            const failCount = data.questVotes.filter(v => v === false).length;
            let isQuestFail = failCount > 0;
            if (Object.keys(room.players).length >= 7 && data.questNumber === 4) isQuestFail = failCount >= 2;
            data.quests[data.questNumber - 1] = isQuestFail ? -1 : 1;
            data.questNumber += 1;
            data.leaderIndex = (data.leaderIndex + 1) % data.playerOrder.length;
            data.phase = 'NOMINATING';
            data.currentTeam = [];
            data.history.push({ type: 'QUEST_RESULT', success: !isQuestFail, failCount });
          }
        }
      }

      // --- 狼人殺啟動已由單一 START_GAME 處理 ---

      // --- 狼人殺核心動作 (自動化流程) ---
      if (action === 'WEREWOLF_MOVE' && room.gameState.type === 'WEREWOLF') {
        const data = room.gameState.data;
        const playerIds = Object.keys(room.players);
        const alivePlayers = playerIds.filter(id => data.status[id].alive);
        const aliveRoles = alivePlayers.map(id => data.roles[id]);

        const getNextPhase = (current) => {
          if (current === 'NIGHT_START') return 'NIGHT_WOLF';
          if (current === 'NIGHT_WOLF') {
            if (aliveRoles.includes('SEER')) return 'NIGHT_SEER';
            if (aliveRoles.includes('WITCH')) return 'NIGHT_WITCH';
            return 'DAY_ANNOUNCE';
          }
          if (current === 'NIGHT_SEER') {
            if (aliveRoles.includes('WITCH')) return 'NIGHT_WITCH';
            return 'DAY_ANNOUNCE';
          }
          if (current === 'NIGHT_WITCH') return 'DAY_ANNOUNCE';
          if (current === 'DAY_ANNOUNCE') return 'DAY_VOTE';
          if (current === 'DAY_VOTE') return 'NIGHT_START';
          return 'LOBBY';
        };

        if (payload.type === 'START_NIGHT' && room.hostId === playerId) {
          data.phase = getNextPhase('NIGHT_START');
          data.diedLastNight = []; // 重置
          data.wolfTarget = null;
          data.seerCheck = null;
          data.witchKill = null;
        } else if (payload.type === 'WOLF_KILL' && data.roles[playerId] === 'WEREWOLF') {
          data.wolfTarget = payload.targetId;
          data.phase = getNextPhase('NIGHT_WOLF');
        } else if (payload.type === 'SEER_CHECK' && data.roles[playerId] === 'SEER') {
          data.seerCheck = { targetId: payload.targetId, isBad: data.roles[payload.targetId] === 'WEREWOLF' };
          setTimeout(() => {
            if (rooms[gid]) {
              rooms[gid].gameState.data.phase = getNextPhase('NIGHT_SEER');
              emitRoomUpdate(gid, rooms[gid]);
            }
          }, 3000); // 留 3 秒給預言家看
          return;
        } else if (payload.type === 'WITCH_ACTION' && data.roles[playerId] === 'WITCH') {
          if (payload.action === 'SAVE' && data.witchPotions.save) {
            data.wolfTarget = null;
            data.witchPotions.save = false;
          } else if (payload.action === 'KILL' && data.witchPotions.kill) {
            data.witchKill = payload.targetId;
            data.witchPotions.kill = false;
          }
          // 進入白天，結算死亡
          data.diedLastNight = [];
          if (data.wolfTarget) {
            data.status[data.wolfTarget].alive = false;
            data.diedLastNight.push(data.wolfTarget);
          }
          if (data.witchKill) {
            data.status[data.witchKill].alive = false;
            if (!data.diedLastNight.includes(data.witchKill)) data.diedLastNight.push(data.witchKill);
          }
          data.phase = getNextPhase('NIGHT_WITCH');
        } else if (payload.type === 'DAY_DISCUSS') {
          data.phase = getNextPhase('DAY_ANNOUNCE');
        } else if (payload.type === 'VOTE_EXILE') {
          data.votes[playerId] = payload.targetId;
          const votedCount = Object.keys(data.votes).length;
          if (votedCount >= alivePlayers.length) {
            const counts = {};
            Object.values(data.votes).forEach(vid => { if (vid) counts[vid] = (counts[vid] || 0) + 1; });
            let max = 0; let target = null;
            Object.entries(counts).forEach(([id, c]) => { if (c > max) { max = c; target = id; } });
            if (target) {
              data.status[target].alive = false;
              data.lastExiled = target;
            }
            data.dayCount += 1;
            data.phase = getNextPhase('DAY_VOTE');
            data.votes = {};
          }
        }
      }

      // --- 海龜湯核心動作 ---
      if (action === 'TURTLE_SOUP_MOVE') {
        const data = room.gameState.data;
        if (payload.type === 'SET_STORY') {
          data.story = payload.story;
          data.truth = payload.truth;
          data.phase = 'PUZZLING';
        }
        if (payload.type === 'ASK') {
          data.questions.push({ id: Date.now(), text: payload.text, playerId, answer: null });
        }
        if (payload.type === 'ANSWER') {
          const q = data.questions.find(q => q.id === payload.questionId);
          if (q) q.answer = payload.answer;
        }
        if (payload.type === 'SOLVED') {
          data.isSolved = true;
        }
        if (payload.type === 'SET_HINT') {
          data.history = data.history || [];
          data.history.push({ type: 'HINT', text: payload.text, timestamp: Date.now() });
        }
      }

      // --- 骰子模式核心動作 ---
      if (action === 'DICE_ROLL' && room.gameState.type === 'DICE_MODE') {
        const data = room.gameState.data;
        const count = payload.diceCount || data.diceCount || 1;
        const sides = payload.diceSides || data.diceSides || 6;
        
        const results = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
        data.diceCount = count;
        data.diceSides = sides;
        data.results = results;
        data.history.unshift({
          playerId,
          results,
          total: results.reduce((a, b) => a + b, 0),
          timestamp: Date.now()
        });
        if (data.history.length > 20) data.history.pop();
      }

      if (action === 'TRANSFER_HOST' && room.hostId === playerId) {
        if (room.players[payload.newHostId]) {
          room.hostId = payload.newHostId;
          // 新房主自動設為 Ready
          room.players[payload.newHostId].isReady = true;
          emitRoomUpdate(gid, room);
        }
        return;
      }

      if (action === 'END_GAME' && room.hostId === playerId) {
        room.gameState.status = 'LOBBY';
        // 結束時重置所有人（除房主）的準備狀態
        Object.keys(room.players).forEach(id => {
          if (id !== room.hostId) room.players[id].isReady = false;
        });
      }
      emitRoomUpdate(gid, room);
    });

    socket.on('KEEP_ALIVE', () => {
      console.log("[System] Keep Alive received.");
      refreshActivity();
    });

    socket.on('disconnect', () => {
      refreshActivity();
      Object.keys(rooms).forEach(gameId => {
        const room = rooms[gameId];
        const playerEntry = Object.entries(room.players).find(([_, p]) => p.socketId === socket.id);
        if (playerEntry) {
          const [id, player] = playerEntry;
          player.connected = false;
          room.lastPlayerExitTimes[id] = Date.now();
          emitRoomUpdate(gameId, room);
          setTimeout(() => {
            const r = rooms[gameId];
            if (r && r.lastPlayerExitTimes[id] && Date.now() - r.lastPlayerExitTimes[id] >= DISCONNECT_TIMEOUT) {
              delete r.players[id];
              delete r.lastPlayerExitTimes[id];
              if (Object.keys(r.players).length === 0) delete rooms[gameId];
              else if (r.hostId === id) r.hostId = Object.keys(r.players)[0];
              emitRoomUpdate(gameId, r);
            }
          }, DISCONNECT_TIMEOUT);
        }
      });
    });
  });

  // --- 閒置檢測計時器 (全域) ---
  setInterval(() => {
    const now = Date.now();
    const idleTime = now - lastActivityAt;

    if (idleTime >= IDLE_SHUTDOWN_THRESHOLD) {
      console.log(`[System] Server idle for ${idleTime}ms. Shutting down...`);
      process.exit(0);
    } else if (idleTime >= IDLE_WARNING_THRESHOLD) {
      const remaining = Math.ceil((IDLE_SHUTDOWN_THRESHOLD - idleTime) / 1000);
      console.log(`[System] Idle Warning: ${remaining}s left...`);
      io.emit('IDLE_WARNING', { remaining });
    }
  }, 1000);

  server.all('*', (req, res) => {
    // --- AI Proxy 路徑 ---
    if (req.method === 'POST' && req.url === '/api/ai/chat') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { provider, apiKey, model, messages } = JSON.parse(body);
          let response;

          if (provider === 'google') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: messages.map(m => ({
                  role: m.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: m.content }]
                }))
              })
            });
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'AI 回應錯誤';
            res.end(JSON.stringify({ content: text }));
          } else {
            // OpenAI, Groq, OpenRouter 共享 OpenAI 格式
            let baseUrl = 'https://api.openai.com/v1';
            if (provider === 'groq') baseUrl = 'https://api.groq.com/openai/v1';
            if (provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1';

            response = await fetch(`${baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost:3000', // OpenRouter 需求
                'X-Title': 'Board Games LAN Platform'
              },
              body: JSON.stringify({ model, messages, stream: false })
            });
            const data = await response.json();
            if (!data.choices?.[0]) {
              console.error("AI Proxy Error Data:", data);
              return res.end(JSON.stringify({ content: `AI Error: ${JSON.stringify(data.error || data)}` }));
            }
            const text = data.choices?.[0]?.message?.content;
            res.end(JSON.stringify({ content: text }));
          }
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    return handle(req, res);
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
