# 🎮 LAN Board Game Online (全能聚會遊戲平台)

![Project Banner](https://raw.githubusercontent.com/polarbear0827/LAN-Board-Games/main/public/banner_placeholder.png)

一套專為區域網路與好友聚會打造的 **全能板凳遊戲平台**。
結合了 **Next.js 14**, **Socket.io** 實時同步技術，以及強大的 **Groq AI** 遊戲主持系統。
不再需要實體牌組與骰盅，只要一個網頁，隨時隨地開啟高品質的博弈與智力對抗。

---

## 🌟 核心特色 (Features)

### 🤖 智慧遊戲主持 (AI Narrator System)
- **海龜湯 AI 主持 (`Turtle Soup`)**：內建 AI 自動生成故事與解答。AI 會根據玩家的提問即時回答「是」、「不是」或「與此無關」，並在大家卡關時提供關鍵提示。支援 Groq (Llama 3)、OpenRouter 等多種強大模型。
- **情境語音引導 (`Werewolf`)**：狼人殺模式內建語音導覽，自動引導「天黑請閉眼」、「狼人請睜眼」等流程，營造沉浸式遊戲氛圍。

### 🎲 多元遊戲庫 (Game Library)
- **🎲 吹牛 (Liar's Dice)**：極致流暢的骰子博弈。具備實時叫價歷史、精美的骰盒動畫，以及新開發的 **5 秒自動揭曉 UI**，讓每一局的勝負都富有衝擊力。
- **🛡️ 阿瓦隆 (Avalon)**：亞瑟王傳奇角色扮演。支援 5-10 人，自動分配角色（梅林、派西維爾等），內建秘密資訊面板與投票系統。
- **🐺 狼人殺 (Werewolf)**：經典社交推理。支援預言家、女巫、快節奏流程切換與公投系統。
- **🧩 海龜湯 (Turtle Soup)**：無限腦洞的情境猜謎。可選擇「玩家主持」或「AI 主持」模式。
- **✨ 骰子模式 (Dice Mode)**：單純的隨機數組，適合任何需要擲骰子的場景，同步歷史紀錄防止作弊。

### 💎 頂級視覺體驗 (Premium Design)
- **動態流光 UI**：基於 **Framer Motion** 的微交互動畫，玻璃擬態 (Glassmorphism) 設計風格。
- **暗黑沉浸模式**：深色的背景搭配鮮艷的模型主題色（橙、藍、綠、紫），為不同遊戲營造獨特氣場。
- **完全響應式**：無論是手機、平板還是筆記型電腦，皆能完美適配螢幕尺寸。

### 🛡️ 穩定與安全鎖 (Stability)
- **房間加密系統**：自定義房間 ID 與 PIN 碼鎖定，防止路人誤入。
- **實時狀態同步**：Socket.io 確保所有玩家在同一毫秒看到同樣的叫價與投票結果。
- **資源節約機制**：內建自動閒置關閉 (Idle Shutdown) 偵測，無人遊戲時自動釋放伺服器資源。

---

## 🛠️ 技術棧 (Tech Stack)

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, Framer Motion
- **Backend**: Express.js, Socket.io
- **UI Components**: Lucide React, Shadcn UI
- **AI Engine**: Groq API, OpenRouter API

---

## 🚀 快速開始 (Setup Guide)

### 1. 環境準備
請確保你的設備已安裝：
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) 或 [yarn](https://yarnpkg.com/)

### 2. 下載並安裝
```bash
git clone https://github.com/polarbear0827/LAN-Board-Games.git
cd LAN-Board-Games
npm install
```

### 3. 配置環境變數 (`.env`)
在根目錄建立 `.env` 檔案並填入以下內容（用於 AI 功能）：
```env
# AI 配置 (選填，若要開啟 AI 主持則必填)
GROQ_API_KEY=your_groq_api_key_here
NEXT_PUBLIC_AI_PROVIDER=groq
```

### 4. 啟動伺服器
```bash
npm run dev
```
打開瀏覽器訪問 `http://localhost:3000` 即可開始遊戲。

---

## 🕹️ 遊戲操作概覽 (Commands & Controls)

| 動作 | 說明 |
| :--- | :--- |
| **創立房間** | 輸入房間名稱與 PIN 碼，你將成為房主並可設定遊戲。 |
| **設定 AI** | 房主可在遊戲介面右上角點擊齒輪，設定 AI 供應商與 API Key。 |
| **結束遊戲** | 房主可隨時點擊「結束遊戲」返回大廳，具備防誤觸二次確認窗。 |
| **自動流程** | 吹牛質疑後自動進入 5 秒揭曉，隨後自動重置回合。 |

---
*Built with Magic & Antigravity Game Engine.*
