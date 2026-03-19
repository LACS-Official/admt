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

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      devices: [],
      selectedDevice: undefined,
      isScanning: false,
      isFlashing: false,
      lastUpdate: new Date(),
      controlFavorites: [],

      setDevices: (devices: DeviceInfo[]) => {
        const currentDevices = get().devices;
        const currentSelected = get().selectedDevice;
        
        // 为新扫描到的设备补充已有的属性信息
        const updatedDevices = devices.map(newDevice => {
          const existingDevice = currentDevices.find(d => d.serial === newDevice.serial);
          if (existingDevice && existingDevice.properties && !newDevice.properties) {
            return { ...newDevice, properties: existingDevice.properties };
          }
          return newDevice;
        });

        // 同样为选中的设备补充属性信息（如果选中的设备在列表中）
        let updatedSelected = currentSelected && 
          updatedDevices.find(d => d.serial === currentSelected.serial);
          
        if (updatedSelected && currentSelected?.properties && !updatedSelected.properties) {
          updatedSelected = { ...updatedSelected, properties: currentSelected.properties };
        }

        set({ 
          devices: updatedDevices, 
          lastUpdate: new Date(),
          selectedDevice: updatedSelected
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
              
              if (JSON.stringify(newState.state.selectedDevice) !== JSON.stringify(currentState.selectedDevice)) {
                set({ selectedDevice: newState.state.selectedDevice });
              }
              if (JSON.stringify(newState.state.devices) !== JSON.stringify(currentState.devices)) {
                set({ devices: newState.state.devices });
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
      storage: createJSONStorage(() => localStorage),
    }
  )
);
