import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

interface AIChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  
  // Actions
  createNewConversation: () => string;
  addMessage: (conversationId: string, message: Omit<Message, "id" | "timestamp">) => void;
  deleteConversation: (id: string) => void;
  setCurrentConversation: (id: string | null) => void;
  updateConversationTitle: (id: string, title: string) => void;
  clearHistory: () => void;
}

export const useAIChatStore = create<AIChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,

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
    }),
    {
      name: "admt-ai-chat-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
