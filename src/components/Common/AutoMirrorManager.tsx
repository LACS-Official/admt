import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useDeviceStore } from '../../stores/deviceStore';
import { useScreenMirrorStore } from '../../stores/screenMirrorStore';
import ScreenMirrorService from '../../services/screenMirrorService';

/**
 * AutoMirrorManager - 全局自动投屏管理器
 * 监听设备连接状态，当符合条件且设置开启时自动触发投屏
 */
const AutoMirrorManager: React.FC = () => {
    const config = useAppStore(state => state.config);
    const devices = useDeviceStore(state => state.devices);
    const { 
        addActiveSession, 
        isDeviceStreaming, 
        handleProcessTerminated 
    } = useScreenMirrorStore();
    
    // 记录本周期内已经尝试过自动投屏的设备，避免失败后反复重试
    // 同时也避免连接不稳定时的重复触发
    const attemptedSerials = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!config.autoScreenMirror) {
            // 如果设置关闭，清空尝试记录，以便下次开启时能生效
            attemptedSerials.current.clear();
            return;
        }

        // 找出当前连接且处于系统模式的新设备
        devices.forEach(async (device) => {
            if (
                device.connected && 
                device.mode === 'sys' && 
                !attemptedSerials.current.has(device.serial)
            ) {
                // 检查是否已经在投屏中（可能手动开启了）
                const isStreaming = isDeviceStreaming(device.serial);
                
                if (!isStreaming) {
                    console.log(`[AutoMirror] Detecting new device for auto-mirror: ${device.serial}`);
                    attemptedSerials.current.add(device.serial);
                    
                    try {
                        const mirrorConfig = useScreenMirrorStore.getState().config;
                        const session = await ScreenMirrorService.startMirror(
                            device.serial, 
                            mirrorConfig, 
                            (sessionId) => {
                                handleProcessTerminated(sessionId);
                                ScreenMirrorService.stopMirror(device.serial).catch(console.error);
                            }
                        );
                        addActiveSession(session);
                        console.log(`[AutoMirror] Successfully auto-mirrored: ${device.serial}`);
                    } catch (error) {
                        console.error(`[AutoMirror] Failed to auto-mirror device ${device.serial}:`, error);
                        // 失败后不移除记录，防止下个扫描周期再次弹窗报错，除非设备重新连接
                    }
                } else {
                    // 如果已经在投屏，也将其标记为已尝试，避免冗余检查
                    attemptedSerials.current.add(device.serial);
                }
            }
        });

        // 清理已断开设备的尝试记录，以便下次连接能再次触发
        const connectedSerials = new Set(devices.filter(d => d.connected).map(d => d.serial));
        attemptedSerials.current.forEach(serial => {
            if (!connectedSerials.has(serial)) {
                attemptedSerials.current.delete(serial);
                console.log(`[AutoMirror] Device removed, clearing auto-mirror record: ${serial}`);
            }
        });

    }, [devices, config.autoScreenMirror, addActiveSession, isDeviceStreaming, handleProcessTerminated]);

    return null; // 此组件仅处理逻辑，不渲染 UI
};

export default AutoMirrorManager;
