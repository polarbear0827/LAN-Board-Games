export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  models: AIModel[];
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'google',
    name: 'Google AI (Studio)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: '反應極快，理解力強，適合邏輯推導' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '極致智慧，適合複雜故事解析' },
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '性價比最高，速度快且穩定' },
      { id: 'gpt-4o', name: 'GPT-4o', description: '目前最強大的模型，精準度最高' },
    ]
  },
  {
    id: 'groq',
    name: 'Groq (LPU)',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', description: '速度之王，近乎即時的推理回饋' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: '極速回應，輕量高效' },
    ]
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', description: '免費且強大的 Google 最新模型' },
      { id: 'meta-llama/llama-3.1-405b-instruct:free', name: 'Llama 3.1 405B (Free)', description: '最強開源模型免費版本' },
      { id: 'meta-llama/llama-3.2-11b-vision-instruct:free', name: 'Llama 3.2 11B (Free)', description: '輕量免費選擇，速度極快' },
    ]
  },
];
