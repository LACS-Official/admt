export type KeyActionType = 'click' | 'burst' | 'joystick' | 'swipe';

export type InjectionMode = 'directWindow' | 'adbStream' | 'auto';

export interface KeyMappingItem {
  id: string;
  name: string;
  key: string;
  actionType: KeyActionType;
  x: number; // 0.0 - 1.0 (标准化百分比)
  y: number; // 0.0 - 1.0
  burstRate?: number; // 次/秒，如 5 ~ 30
  radius?: number; // 0.05 ~ 0.30
  keyUp?: string;
  keyDown?: string;
  keyLeft?: string;
  keyRight?: string;
  endX?: number;
  endY?: number;
  durationMs?: number;
}

export interface KeyMappingProfile {
  id: string;
  name: string;
  description?: string;
  orientation?: 'landscape' | 'portrait';
  items: KeyMappingItem[];
}

export interface KeyMappingConfig {
  deviceSerial: string;
  windowTitle?: string;
  injectionMode: InjectionMode;
  activeWindowOnly: boolean;
  profile: KeyMappingProfile;
}
