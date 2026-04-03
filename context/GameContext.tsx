"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import IdleWarningModal from "@/components/ui/IdleWarningModal";

interface Player {
  id: string;
  connected: boolean;
  isReady: boolean;
}

interface Room {
  hostId: string;
  players: Record<string, Player>;
  gameState: {
    status: "LOBBY" | "PLAYING";
    type: string | null;
    selectedGameId: string;
    data: any;
  };
}

interface AiConfig {
  isEnabled: boolean;
  isAiNarrator: boolean;
  provider: string;
  apiKey: string;
  model: string;
}

interface GameContextType {
  socket: Socket | null;
  room: Room | null;
  playerId: string | null;
  gameId: string | null;
  isHost: boolean;
  error: string | null;
  joinRoom: (gameId: string, playerId: string, pin: string) => void;
  sendAction: (action: string, payload?: any) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  aiConfig: AiConfig;
  updateAiConfig: (config: Partial<AiConfig>) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [aiConfig, setAiConfig] = useState<AiConfig>({
    isEnabled: false,
    isAiNarrator: false,
    provider: 'google',
    apiKey: '',
    model: 'gemini-1.5-flash',
  });
  const [idleRemaining, setIdleRemaining] = useState<number>(0);

  // Load AI Config
  useEffect(() => {
    const saved = localStorage.getItem("ai_config");
    if (saved) {
      try { setAiConfig(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // Initialize Socket
  useEffect(() => {
    const s = io();
    setSocket(s);

    s.on("room_update", (updatedRoom: Room) => {
      setRoom(updatedRoom);
      setError(null);
    });

    s.on("error_message", (msg: string) => {
      setError(msg);
    });

    s.on("IDLE_WARNING", ({ remaining }: { remaining: number }) => {
      setIdleRemaining(remaining);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // Sync Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const joinRoom = (gid: string, pid: string, pin: string) => {
    if (socket) {
      setPlayerId(pid);
      setGameId(gid);
      socket.emit("join_room", { gameId: gid, playerId: pid, pin });
    }
  };

  const sendAction = (action: string, payload: any = {}) => {
    if (socket && gameId && playerId) {
      socket.emit("game_action", { gameId, playerId, action, payload });
    }
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const isHost = room?.hostId === playerId;

  const updateAiConfig = (config: Partial<AiConfig>) => {
    const newConfig = { ...aiConfig, ...config };
    setAiConfig(newConfig);
    localStorage.setItem("ai_config", JSON.stringify(newConfig));
  };

  const handleKeepAlive = () => {
    if (socket) {
      socket.emit("KEEP_ALIVE");
      setIdleRemaining(0);
    }
  };

  return (
    <GameContext.Provider
      value={{
        socket,
        room,
        playerId,
        gameId,
        isHost,
        error,
        joinRoom,
        sendAction,
        darkMode,
        toggleDarkMode,
        aiConfig,
        updateAiConfig,
      }}
    >
      {children}
      <IdleWarningModal remaining={idleRemaining} onKeepAlive={handleKeepAlive} />
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
};