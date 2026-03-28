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
            if (attemptedSerials.current.size > 0) {
                console.log('[AutoMirror] Feature disabled, clearing attempted records.');
                attemptedSerials.current.clear();
            }
            return;
        }

        // 分析所有连接的设备
        devices.forEach(device => {
            if (device.connected && device.mode !== 'sys') {
                console.log(`[AutoMirror] Device ${device.serial} connected but in mode: ${device.mode}. Skipping.`);
            }
        });

        // 找出符合条件的设备
        const eligibleDevices = devices.filter(d => d.connected && d.mode === 'sys');
        
        if (eligibleDevices.length > 0) {
            eligibleDevices.forEach(async (device) => {
                const serial = device.serial;
                
                // 检查是否已经尝试过或正在投屏中
                if (attemptedSerials.current.has(serial)) {
                    // console.debug(`[AutoMirror] Device ${serial} already attempted in this cycle.`);
                    return;
                }

                const isStreaming = isDeviceStreaming(serial);
                if (isStreaming) {
                    console.log(`[AutoMirror] Device ${serial} is already streaming. Marking as attempted.`);
                    attemptedSerials.current.add(serial);
                    return;
                }

                // 开始尝试自动投屏
                console.log(`[AutoMirror] Triggering auto-mirror for: ${serial}`);
                attemptedSerials.current.add(serial);

                try {
                    const mirrorConfig = useScreenMirrorStore.getState().config;
                    const session = await ScreenMirrorService.startMirror(
                        serial, 
                        mirrorConfig, 
                        (sessionId) => {
                            console.log(`[AutoMirror] Session terminated: ${sessionId} (${serial})`);
                            handleProcessTerminated(sessionId);
                            ScreenMirrorService.stopMirror(serial).catch(err => 
                                console.warn(`[AutoMirror] Error stopping mirror after termination:`, err)
                            );
                        }
                    );
                    addActiveSession(session);
                    console.log(`[AutoMirror] Successfully started auto-mirror for: ${serial}`);
                } catch (error) {
                    console.error(`[AutoMirror] Failed to start auto-mirror for ${serial}:`, error);
                    // 标记为尝试过，防止失败后在同一连接周期内反复重试导致弹窗或性能问题
                }
            });
        }

        // 清理逻辑：仅移除那些真正彻底消失或断开的设备记录
        const currentSerials = new Set(devices.map(d => d.serial));
        const connectedSerials = new Set(devices.filter(d => d.connected).map(d => d.serial));
        
        attemptedSerials.current.forEach(serial => {
            // 如果设备连列表都没了，或者明确断开了，则移除尝试记录，以便下次连接能重试
            if (!currentSerials.has(serial) || !connectedSerials.has(serial)) {
                attemptedSerials.current.delete(serial);
                console.log(`[AutoMirror] Device disconnected, cleared auto-mirror record: ${serial}`);
            }
        });

    }, [devices, config.autoScreenMirror, addActiveSession, isDeviceStreaming, handleProcessTerminated]);

    return null; // 此组件仅处理逻辑，不渲染 UI
};

export default AutoMirrorManager;
