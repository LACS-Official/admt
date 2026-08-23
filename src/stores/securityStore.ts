import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProtectedActions {
  rootFlash: boolean;
  fastbootFlash: boolean;
  wipeDevice: boolean;
  resetApp: boolean;
}

interface SecurityState {
  isPasswordEnabled: boolean;
  passwordHash: string; // 简易哈希存储
  protectedActions: ProtectedActions;
  failedAttempts: number;
  lockUntil: number | null;

  // Actions
  setPassword: (password: string) => boolean;
  removePassword: (currentPassword: string) => boolean;
  verifyPassword: (password: string) => boolean;
  toggleProtectedAction: (actionKey: keyof ProtectedActions, enabled: boolean) => void;
  isActionProtected: (actionKey: keyof ProtectedActions) => boolean;
}

// 简易安全哈希（加盐）
function hashPassword(password: string): string {
  let hash = 0;
  const salt = "admt_security_salt_2026";
  const str = password + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(16);
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      isPasswordEnabled: false,
      passwordHash: "",
      protectedActions: {
        rootFlash: true,
        fastbootFlash: true,
        wipeDevice: true,
        resetApp: true,
      },
      failedAttempts: 0,
      lockUntil: null,

      setPassword: (password: string) => {
        if (!password || password.trim().length < 4) {
          return false;
        }
        set({
          isPasswordEnabled: true,
          passwordHash: hashPassword(password.trim()),
          failedAttempts: 0,
          lockUntil: null,
        });
        return true;
      },

      removePassword: (currentPassword: string) => {
        const { passwordHash } = get();
        if (hashPassword(currentPassword.trim()) === passwordHash) {
          set({
            isPasswordEnabled: false,
            passwordHash: "",
            failedAttempts: 0,
            lockUntil: null,
          });
          return true;
        }
        return false;
      },

      verifyPassword: (password: string) => {
        const { isPasswordEnabled, passwordHash, lockUntil, failedAttempts } = get();
        if (!isPasswordEnabled) return true;

        const now = Date.now();
        if (lockUntil && now < lockUntil) {
          return false;
        }

        const isValid = hashPassword(password.trim()) === passwordHash;
        if (isValid) {
          set({ failedAttempts: 0, lockUntil: null });
          return true;
        } else {
          const newFailed = failedAttempts + 1;
          // 连续错误 5 次锁定 1 分钟
          const newLock = newFailed >= 5 ? now + 60000 : null;
          set({ failedAttempts: newFailed, lockUntil: newLock });
          return false;
        }
      },

      toggleProtectedAction: (actionKey: keyof ProtectedActions, enabled: boolean) => {
        set((state) => ({
          protectedActions: {
            ...state.protectedActions,
            [actionKey]: enabled,
          },
        }));
      },

      isActionProtected: (actionKey: keyof ProtectedActions) => {
        const state = get();
        return state.isPasswordEnabled && !!state.protectedActions[actionKey];
      },
    }),
    {
      name: "admt_security_storage",
    }
  )
);
