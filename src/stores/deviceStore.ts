import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DeviceInfo, DeviceStatus } from "../types/device";

interface DeviceState extends DeviceStatus {
  setDevices: (devices: DeviceInfo[]) => void;
  selectDevice: (device: DeviceInfo | undefined) => void;
  updateDevice: (serial: string, updates: Partial<DeviceInfo>) => void;
  setScanning: (isScanning: boolean) => void;
  setFlashing: (isFlashing: boolean) => void;
  clearDevices: () => void;
  subscribeToStorageChanges: () => () => void;
  controlFavorites: string[];
  toggleControlFavorite: (controlId: string) => void;
}

let isSyncingFromStorage = false;

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      devices: [],
      selectedDevice: undefined,
      isScanning: false,
      isFlashing: false,
      lastUpdate: new Date(),
      controlFavorites: [],

      setDevices: (newDevices: DeviceInfo[]) => {
        const currentDevices = get().devices || [];
        const currentSelectedDeviceId = get().selectedDevice?.serial;

        // 智能合并：保留现有设备的属性 (properties, boardSerialNumber等)
        const mergedDevices = newDevices.map(newDevice => {
          const existing = currentDevices.find(d => d.serial === newDevice.serial);
          if (existing) {
            // 保留旧设备的 transient 属性，覆盖新扫描的核心信息 (connected, mode)
            return {
              ...existing,
              ...newDevice,
              properties: newDevice.properties || existing.properties,
              boardSerialNumber: newDevice.boardSerialNumber || existing.boardSerialNumber,
              fastbootVariables: newDevice.fastbootVariables || existing.fastbootVariables,
            };
          }
          return newDevice;
        });

        // 稳定保持选中设备的引用（如果它仍在列表中）
        let nextSelectedDevice = get().selectedDevice;
        if (nextSelectedDevice) {
          const currentSelectedDeviceId = nextSelectedDevice.serial;
          const stillPresent = mergedDevices.find(d => d.serial === currentSelectedDeviceId);
          if (stillPresent) {
            // 核心属性比对：只有当选中设备的连接状态、模式等关键属性真正改变时，才更新引用。
            // 这能有效防止后台扫描频率更新导致的 UI 持续刷新问题。
            const prev = get().selectedDevice;
            const hasChanged = !prev || 
              prev.serial !== stillPresent.serial || 
              prev.connected !== stillPresent.connected || 
              prev.mode !== stillPresent.mode;
            
            if (hasChanged) {
              nextSelectedDevice = stillPresent;
            } else {
              nextSelectedDevice = prev;
            }
          } else {
            nextSelectedDevice = undefined;
          }
        }

        set({ 
          devices: mergedDevices, 
          lastUpdate: new Date(),
          selectedDevice: nextSelectedDevice
        });
      },

      selectDevice: (device: DeviceInfo | undefined) => 
        set({ selectedDevice: device }),

      updateDevice: (serial: string, updates: Partial<DeviceInfo>) =>
        set((state) => ({
          devices: state.devices.map((device) =>
            device.serial === serial ? { ...device, ...updates } : device
          ),
          selectedDevice: state.selectedDevice?.serial === serial 
            ? { ...state.selectedDevice, ...updates }
            : state.selectedDevice,
          lastUpdate: new Date(),
        })),

      setScanning: (isScanning: boolean) => set({ isScanning }),

      setFlashing: (isFlashing: boolean) => set({ isFlashing }),

      clearDevices: () => set({ 
        devices: [], 
        selectedDevice: undefined, 
        lastUpdate: new Date() 
      }),

      subscribeToStorageChanges: () => {
        const handleStorageChange = (event: StorageEvent) => {
          if (event.key === "hout-device-storage" && event.newValue) {
            try {
              const newState = JSON.parse(event.newValue);
              const currentState = get();
              const updates: Partial<DeviceState> = {};
              
              if (JSON.stringify(newState.state.selectedDevice) !== JSON.stringify(currentState.selectedDevice)) {
                updates.selectedDevice = newState.state.selectedDevice;
              }
              if (JSON.stringify(newState.state.devices) !== JSON.stringify(currentState.devices)) {
                updates.devices = newState.state.devices;
              }
              
              if (Object.keys(updates).length > 0) {
                isSyncingFromStorage = true;
                set(updates);
                setTimeout(() => {
                  isSyncingFromStorage = false;
                }, 50);
              }
            } catch (error) {
              console.error('Failed to parse device storage data:', error);
            }
          }
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
      },

      toggleControlFavorite: (controlId: string) => {
        set((state) => {
          const favorites = state.controlFavorites || [];
          const index = favorites.indexOf(controlId);
          if (index === -1) {
            return { controlFavorites: [...favorites, controlId] };
          } else {
            return { controlFavorites: favorites.filter(id => id !== controlId) };
          }
        });
      },
    }),
    {
      name: "hout-device-storage",
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
