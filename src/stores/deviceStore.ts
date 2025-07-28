import { create } from "zustand";
import { DeviceInfo, DeviceStatus } from "../types/device";

interface DeviceState extends DeviceStatus {
  setDevices: (devices: DeviceInfo[]) => void;
  selectDevice: (device: DeviceInfo | undefined) => void;
  updateDevice: (serial: string, updates: Partial<DeviceInfo>) => void;
  setScanning: (isScanning: boolean) => void;
  clearDevices: () => void;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  selectedDevice: undefined,
  isScanning: false,
  lastUpdate: new Date(),

  setDevices: (devices: DeviceInfo[]) => 
    set({ 
      devices, 
      lastUpdate: new Date(),
      // 如果当前选中的设备不在新列表中，清除选择
      selectedDevice: get().selectedDevice && 
        devices.find(d => d.serial === get().selectedDevice?.serial) 
          ? get().selectedDevice 
          : undefined
    }),

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

  clearDevices: () => set({ 
    devices: [], 
    selectedDevice: undefined, 
    lastUpdate: new Date() 
  }),
}));
