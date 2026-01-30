import React, { useEffect } from 'react';
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "../../stores/themeStore";
import { useAppStore } from "../../stores/appStore";
import { AppView } from "../../types/app";
import { tokens } from "@fluentui/react-components";

interface AppTourProps {
    runTour?: boolean;
    onTourEnd?: () => void;
}

const AppTour: React.FC<AppTourProps> = ({ runTour, onTourEnd }) => {
    const { t } = useTranslation();
    const { isDarkMode } = useThemeStore();

    useEffect(() => {
        const startDriver = () => {
            const driverObj = driver({
                showProgress: true,
                animate: true,
                allowClose: true,
                doneBtnText: t('common.done', '完成'),
                nextBtnText: t('common.next', '下一步'),
                prevBtnText: t('common.prev', '上一步'),
                steps: [
                    {
                        element: '#tour-device-info',
                        popover: {
                            title: t('tour.device_info_title', '设备信息'),
                            description: t('tour.device_info_desc', '这里显示当前连接设备的详细信息，点击区域可以快速切换不同设备。'),
                            side: "right",
                            align: 'start'
                        }
                    },
                    {
                        element: '#tour-tab-home',
                        popover: {
                            title: t('tour.tab_home_title', '主页概览'),
                            description: t('tour.tab_home_desc', '应用的主界面，展示最重要的设备状态和快捷入口。'),
                            side: "right",
                            align: 'start'
                        },
                        onHighlightStarted: () => {
                            useAppStore.getState().setCurrentView('home');
                        }
                    },
                    {
                        element: '#tour-tab-adb-zone',
                        popover: {
                            title: t('tour.tab_adb_title', 'ADB工具'),
                            description: t('tour.tab_adb_desc', '提供强大的ADB命令工具集，包括应用管理、文件管理、投屏控制等。'),
                            side: "right",
                            align: 'start'
                        },
                        onHighlightStarted: () => {
                            useAppStore.getState().setCurrentView('adb-zone');
                        }
                    },
                    {
                        element: '#tour-tab-flash-zone',
                        popover: {
                            title: t('tour.tab_flash_title', '刷机专区'),
                            description: t('tour.tab_flash_desc', '集成了Fastboot刷机、镜像刷入、分区管理等高级功能。'),
                            side: "right",
                            align: 'start'
                        },
                        onHighlightStarted: () => {
                            useAppStore.getState().setCurrentView('flash-zone');
                        }
                    },
                    {
                        element: '#tour-tab-online-resources',
                        popover: {
                            title: t('tour.tab_online_title', '在线资源'),
                            description: t('tour.tab_online_desc', '浏览和下载最新的官方ROM、工具软件和驱动程序。'),
                            side: "right",
                            align: 'start'
                        },
                        onHighlightStarted: () => {
                            useAppStore.getState().setCurrentView('online-resources');
                        }
                    },
                    {
                        element: '#tour-tab-settings',
                        popover: {
                            title: t('tour.tab_settings_title', '应用设置'),
                            description: t('tour.tab_settings_desc', '自定义应用的主题、语言、通知和其他偏好设置。'),
                            side: "right",
                            align: 'start'
                        },
                        onHighlightStarted: () => {
                            useAppStore.getState().setCurrentView('settings');
                        }
                    },
                    {
                        element: '#tour-main-content',
                        popover: {
                            title: t('tour.main_content_title', '准备就绪'),
                            description: t('tour.main_content_desc', '您已了解所有核心板块。现在，开始探索吧！'),
                            side: "left",
                            align: 'start'
                        },
                        onHighlightStarted: () => {
                            useAppStore.getState().setCurrentView('home');
                        }
                    }
                ],
                onDestroyed: () => {
                    localStorage.setItem('admt_tour_seen', 'true');
                    if (onTourEnd) onTourEnd();
                },
                popoverClass: 'driverjs-theme-custom',
            });
            
            driverObj.drive();
        };

        // Auto start only if not seen before and not explicitly triggered (initial load)
        if (runTour === undefined) {
             const hasSeenTour = localStorage.getItem('admt_tour_seen');
             if (!hasSeenTour) {
                 setTimeout(() => {
                     startDriver();
                 }, 1500);
             }
        } 
        // Explicit trigger
        else if (runTour) {
             startDriver();
        }

    }, [t, isDarkMode, runTour]); // Added runTour dependency

    return (
        <style>
            {`
                .driver_popover_title {
                    font-family: inherit;
                    font-weight: 600;
                }
                .driver_popover_description {
                    font-family: inherit;
                    line-height: 1.5;
                }
            `}
        </style>
    );
};

export default AppTour;
