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
    mode?: 'concise' | 'detailed';
    onTourEnd?: () => void;
}

const AppTour: React.FC<AppTourProps> = ({ runTour, mode = 'detailed', onTourEnd }) => {
    const { t } = useTranslation();
    const { isDarkMode } = useThemeStore();

    useEffect(() => {
        const startDriver = () => {
            const allSteps: DriveStep[] = [
                {
                    element: '#tour-device-info',
                    popover: {
                        title: t('tour.device_info_title', '设备信息'),
                        description: t('tour.device_info_desc', '这里显示当前连接设备的详细信息（机型、电量等），点击此处可快速切换不同设备。'),
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
                    element: '#tour-home-overview',
                    popover: {
                        title: t('tour.home_overview_title', '设备详情概览'),
                        description: t('tour.home_overview_desc', '在此您可以直观查看机型代号、安卓版本、CPU架构以及精准的内存和存储占用情况。'),
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#tour-home-reboot',
                    popover: {
                        title: t('tour.home_reboot_title', '电源管理中心'),
                        description: t('tour.home_reboot_desc', '集成一键重启至系统、Recovery 或 Fastboot 模式，助您快速进入特定的开发或调试环境。'),
                        side: "top",
                        align: 'start'
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
                    element: '#tour-adb-tabs',
                    popover: {
                        title: t('tour.adb_tabs_title', 'ADB 工具面板'),
                        description: t('tour.adb_tabs_desc', '包含设备控制、屏幕投屏、应用安装、应用管理和文件管理五大版块，满足您全方位的 ADB 调试需求。'),
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#tour-tab-flash-zone',
                    popover: {
                        title: t('tour.tab_flash_title', '刷机专区'),
                        description: t('tour.tab_flash_desc', '集集成Fastboot刷机、镜像刷入、分区管理等高级功能。'),
                        side: "right",
                        align: 'start'
                    },
                    onHighlightStarted: () => {
                        useAppStore.getState().setCurrentView('flash-zone');
                    }
                },
                {
                    element: '#tour-flash-tabs',
                    popover: {
                        title: t('tour.flash_tabs_title', '高级刷机工具'),
                        description: t('tour.flash_tabs_desc', '提供小米解锁、分区镜像刷入及 Fastboot 线刷功能，所有底层操作均经过安全优化。'),
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#tour-tab-root',
                    popover: {
                        title: t('tour.tab_root_title', 'Root 专区'),
                        description: t('tour.tab_root_desc', '为已获取 Root 权限的设备提供高级功能，如镜像修补和模块管理。'),
                        side: "right",
                        align: 'start'
                    },
                    onHighlightStarted: () => {
                        useAppStore.getState().setCurrentView('root');
                    }
                },
                {
                    element: '#tour-root-tabs',
                    popover: {
                        title: t('tour.root_tabs_title', 'Root 功能面板'),
                        description: t('tour.root_tabs_desc', '包含 Magisk 镜像修补、系统模块管理以及底层高级参数调整。'),
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#tour-extended-tabs',
                    popover: {
                        title: t('tour.extended_tabs_title', '扩展工具集'),
                        description: t('tour.extended_tabs_desc', '在这里您可以探索更多由社区或官方提供的增强插件和实用辅助程序。'),
                        side: "bottom",
                        align: 'start'
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
                    element: '#tour-online-tabs',
                    popover: {
                        title: t('tour.online_tabs_title', '软件 & ROM 商店'),
                        description: t('tour.online_tabs_desc', '在线获取最新的玩机工具、官方固件包，并在此统一管理所有下载进度。'),
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#tour-ai-button',
                    popover: {
                        title: t('tour.ai_button_title', 'AI 智能助手'),
                        description: t('tour.ai_button_desc', '集成最先进的 AI 模型，助您一键执行复杂命令、分析日志或解答技术疑问。'),
                        side: "bottom",
                        align: 'end'
                    }
                },
                {
                    element: '#tour-header-settings',
                    popover: {
                        title: t('tour.header_settings_title', '快捷设置'),
                        description: t('tour.header_settings_desc', '在任何界面都可通过此图标快速进入设置中心，调整应用配置。'),
                        side: "bottom",
                        align: 'end'
                    }
                },
                {
                    element: '#tour-search-button',
                    popover: {
                        title: t('tour.search_button_title', '全局搜索'),
                        description: t('tour.search_button_desc', '通过快捷键 (Ctrl+K) 快速查找功能设置、下载镜像或搜索技术文档。'),
                        side: "bottom",
                        align: 'end'
                    }
                },
                {
                    element: '#tour-theme-button',
                    popover: {
                        title: t('tour.theme_button_title', '主题切换'),
                        description: t('tour.theme_button_desc', '一键切换深色/浅色模式，为您提供更舒适的视觉体验。'),
                        side: "bottom",
                        align: 'end'
                    }
                },
                {
                    element: '#tour-pin-button',
                    popover: {
                        title: t('tour.pin_button_title', '窗口置顶'),
                        description: t('tour.pin_button_desc', '将应用窗口固定在最前端，方便在操作其他软件时参考参数。'),
                        side: "bottom",
                        align: 'end'
                    }
                },
                {
                    element: '#tour-announcement-bar',
                    popover: {
                        title: t('tour.announcement_title', '系统公告'),
                        description: t('tour.announcement_desc', '获取最新的版本动态、功能说明及官方重要通知。'),
                        side: "bottom",
                        align: 'center'
                    }
                },
                {
                    element: '#tour-command-line',
                    popover: {
                        title: t('tour.command_line_title', '快捷命令行'),
                        description: t('tour.command_line_desc', '快速呼出终端窗口，支持直接执行 ADB 命令和快捷脚本。'),
                        side: "right",
                        align: 'end'
                    }
                },
                {
                    element: '#tour-logs',
                    popover: {
                        title: t('tour.logs_title', '实时日志'),
                        description: t('tour.logs_desc', '查看应用程序和连接设备的运行日志，方便排查问题。'),
                        side: "right",
                        align: 'end'
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
                    element: '#tour-settings-tabs',
                    popover: {
                        title: t('tour.settings_tabs_title', '全局配置'),
                        description: t('tour.settings_tabs_desc', '在此您可以配置应用显示风格、设备检测逻辑，以及设置 AI 助手的 API 参数。'),
                        side: "bottom",
                        align: 'start'
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
            ];

            // 过滤步骤
            const steps = mode === 'concise' 
                ? allSteps.filter(step => 
                    ['#tour-device-info', '#tour-tab-home', '#tour-tab-adb-zone', '#tour-tab-flash-zone', '#tour-tab-root', '#tour-tab-extended-features', '#tour-tab-online-resources', '#tour-tab-settings', '#tour-main-content'].includes(step.element as string)
                  )
                : allSteps;

            const driverObj = driver({
                showProgress: true,
                animate: true,
                allowClose: true,
                doneBtnText: t('common.done', '完成'),
                nextBtnText: t('common.next', '下一步'),
                prevBtnText: t('common.prev', '上一步'),
                steps: steps,
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

    }, [t, isDarkMode, runTour, mode]); // Added mode dependency

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
