import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAppStore } from "./appStore";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface AIPreset {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google" | "local" | "zhipu" | "deepseek" | "groq" | "qwen" | "siliconflow" | "nvidia";
  model: string;
  apiKey: string;
  endpoint: string;
  temperature: number;
}

interface AIChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isAgentMode: boolean;
  aiPresets: AIPreset[];
  activePresetId: string | null;
  
  // Actions
  createNewConversation: () => string;
  addMessage: (conversationId: string, message: Omit<Message, "id" | "timestamp">) => void;
  deleteConversation: (id: string) => void;
  setCurrentConversation: (id: string | null) => void;
  updateConversationTitle: (id: string, title: string) => void;
  clearHistory: () => void;
  subscribeToStorageChanges: () => () => void;
  setAgentMode: (mode: boolean) => void;

  // Preset Actions
  savePreset: (preset: Omit<AIPreset, "id"> & { id?: string }) => string;
  deletePreset: (id: string) => void;
  applyPreset: (id: string) => void;
  importPresets: (presets: AIPreset[]) => void;
}

let isSyncingFromStorage = false;

export const useAIChatStore = create<AIChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      isAgentMode: false,
      aiPresets: [],
      activePresetId: null,

      setAgentMode: (mode: boolean) => set({ isAgentMode: mode }),

      createNewConversation: () => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newConv: Conversation = {
          id,
          title: "新对话",
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          conversations: [newConv, ...state.conversations],
          currentConversationId: id,
        }));
        
        return id;
      },

      addMessage: (conversationId, message) => {
        const newMessage: Message = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        };

        set((state) => {
          const conversations = state.conversations.map((conv) => {
            if (conv.id === conversationId) {
              const updatedMessages = [...conv.messages, newMessage];
              // If it's the first message from the user, try to generate a title
              let title = conv.title;
              if (conv.title === "新对话" && message.role === "user") {
                title = message.content.slice(0, 20) + (message.content.length > 20 ? "..." : "");
              }
              
              return {
                ...conv,
                messages: updatedMessages,
                title,
                updatedAt: new Date().toISOString(),
              };
            }
            return conv;
          });

          return { conversations };
        });
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        }));
      },

      setCurrentConversation: (id) => set({ currentConversationId: id }),

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) => 
             c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      clearHistory: () => set({ conversations: [], currentConversationId: null }),

      savePreset: (presetData) => {
        const id = presetData.id || `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newPreset: AIPreset = {
          ...presetData,
          id,
        };
        set((state) => {
          const exists = state.aiPresets.some(p => p.id === id);
          const aiPresets = exists
            ? state.aiPresets.map(p => p.id === id ? newPreset : p)
            : [...state.aiPresets, newPreset];
          
          // 如果当前保存的方案正好是正在使用的方案，则直接应用它（更新 appStore）
          if (state.activePresetId === id) {
            setTimeout(() => get().applyPreset(id), 0);
          }

          return { aiPresets };
        });
        return id;
      },

      deletePreset: (id) => {
        set((state) => ({
          aiPresets: state.aiPresets.filter(p => p.id !== id),
          activePresetId: state.activePresetId === id ? null : state.activePresetId
        }));
      },

      applyPreset: (id) => {
        if (!id) {
          set({ activePresetId: null });
          return;
        }
        const state = get();
        const preset = state.aiPresets.find(p => p.id === id);
        if (preset) {
          set({ activePresetId: id });
          
          // 同步到 useAppStore
          const appStore = useAppStore.getState();
          appStore.updateConfig({
            ai: {
              ...appStore.config.ai,
              provider: preset.provider,
              model: preset.model,
              apiKey: preset.apiKey,
              endpoint: preset.endpoint,
              temperature: preset.temperature,
            }
          });
          appStore.saveToDisk().catch(err => console.error("保存方案配置至磁盘失败:", err));
        }
      },

      importPresets: (presets) => {
        set((state) => {
          const merged = [...state.aiPresets];
          presets.forEach(p => {
            const idx = merged.findIndex(item => item.id === p.id);
            if (idx > -1) {
              merged[idx] = p;
            } else {
              merged.push(p);
            }
          });
          return { aiPresets: merged };
        });
      },

      subscribeToStorageChanges: () => {
        const handleStorageChange = (event: StorageEvent) => {
          if (event.key === "admt-ai-chat-storage" && event.newValue) {
            try {
              const newState = JSON.parse(event.newValue);
              const currentState = get();
              const updates: Partial<AIChatState> = {};
              
              if (JSON.stringify(newState.state.conversations) !== JSON.stringify(currentState.conversations)) {
                updates.conversations = newState.state.conversations;
              }
              if (newState.state.currentConversationId !== currentState.currentConversationId) {
                updates.currentConversationId = newState.state.currentConversationId;
              }
              if (newState.state.isAgentMode !== currentState.isAgentMode) {
                updates.isAgentMode = newState.state.isAgentMode;
              }
              if (JSON.stringify(newState.state.aiPresets) !== JSON.stringify(currentState.aiPresets)) {
                updates.aiPresets = newState.state.aiPresets;
              }
              if (newState.state.activePresetId !== currentState.activePresetId) {
                updates.activePresetId = newState.state.activePresetId;
              }

              if (Object.keys(updates).length > 0) {
                isSyncingFromStorage = true;
                set(updates);
                setTimeout(() => {
                  isSyncingFromStorage = false;
                }, 50);
                // eslint-disable-next-line no-console
                console.log('AI对话记录和配置方案已从其他页面同步');
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('解析AI存储数据失败:', error);
            }
          }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
      }
    }),
    {
      name: "admt-ai-chat-storage",
      storage: createJSONStorage(() => ({
        getItem: (name) => localStorage.getItem(name),
        setItem: (name, value) => {
          if (isSyncingFromStorage) {
            return;
          }
          localStorage.setItem(name, value);
        },
        removeItem: (name) => localStorage.removeItem(name),
      })),
    }
  )
);
