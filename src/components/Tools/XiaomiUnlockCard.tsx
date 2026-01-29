/**
 * 小米解锁工具卡片组件 - 完全重构版本
 * 重构点：
 * 1. 提取类型定义到独立文件
 * 2. 提取工具配置和常量
 * 3. 提取设备检测和系统信息获取逻辑
 * 4. 提取对话框组件
 * 5. 提取工具执行服务
 * 6. 简化主组件逻辑，提高可维护性
 * 7. 保持所有原有功能完整性
 * 8. 保留所有接口兼容性
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  makeStyles,
  Card,
  Text,
  Button,
  Spinner,
} from "@fluentui/react-components";
import {
  Warning24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { useTranslation } from "react-i18next";

// 重构点：导入提取的模块
import { CommandOutput } from './XiaomiUnlock/types';
import { createXiaomiTools } from './XiaomiUnlock/constants';
import { 
  detectUnlockMethod, 
  getSystemInfo, 
  generateInstallAdvice,
  createCommandOutput 
} from './XiaomiUnlock/utils';
import { ConfirmDialog, ResultDialog } from './XiaomiUnlock/DialogComponents';
import { UnlockService } from './XiaomiUnlock/UnlockService';

// 重构点：保持样式定义不变，确保UI兼容性
const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderRadius: "8px",
  },
  content: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflow: "auto",
  },
  statusSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "8px",
  },
  warningSection: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
    backgroundColor: "var(--colorPaletteYellowBackground1)",
    borderRadius: "8px",
    border: "1px solid var(--colorPaletteYellowBorder1)",
  },
  warningIcon: {
    color: "var(--colorPaletteYellowForeground1)",
    fontSize: "16px",
  },
  toolsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  toolButton: {
    height: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "8px",
    textAlign: "left",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
    transition: "all 0.2s ease",
  },
  xiaomiIcon: {
    fontSize: "24px",
    color: "var(--colorBrandForeground1)",
  },
});

interface XiaomiUnlockCardProps {
  device: DeviceInfo;
}

/**
 * 小米解锁工具卡片组件
 * 重构点：简化状态管理，使用提取的工具函数和组件
 */
const XiaomiUnlockCard: React.FC<XiaomiUnlockCardProps> = ({ device }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const deviceService = useDeviceService();
  const { setStatusBarMessage } = useAppStore();
  
  // 重构点：简化状态管理，移除未使用的状态
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [commandOutputs, setCommandOutputs] = useState<CommandOutput[]>([]);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [resultDialogTitle, setResultDialogTitle] = useState("检测结果");
  const [resultDialogMessage, setResultDialogMessage] = useState("");

  // 重构点：使用提取的工具函数创建命令输出
  const addCommandOutput = useCallback((command: string, output: string, success: boolean) => {
    const newOutput = createCommandOutput(command, output, success);
    setCommandOutputs(prev => [newOutput, ...prev]);
  }, []);

  // 重构点：使用 useMemo 优化工具列表生成
  const xiaomiTools = useMemo(() => createXiaomiTools(device), [device]);

  // 重构点：使用 useMemo 优化选中工具的获取
  const selectedTool = useMemo(() => 
    xiaomiTools.find(t => t.id === selectedAction) || null, 
    [xiaomiTools, selectedAction]
  );

  /**
   * 处理工具点击事件
   * 重构点：简化工具点击逻辑，使用提取的工具列表和统一的执行流程
   */
  const handleToolClick = useCallback((toolId: string) => {
    if (!device) {
      setStatusBarMessage({
        type: "warning",
        message: t('unlock.select_device_first'),
      });
      return;
    }

    const tool = xiaomiTools.find(t => t.id === toolId);
    if (!tool || !tool.available) {
      return;
    }

    setSelectedAction(toolId);

    // 重构点：简化执行逻辑判断
    if (tool.dangerous && !['bypass_unlock', 'xiaomi_unlock_tool'].includes(toolId)) {
      setConfirmDialogOpen(true);
    } else if (['bypass_unlock', 'xiaomi_unlock_tool'].includes(toolId)) {
      executeUnlockTool(toolId);
    } else {
      executeAction(toolId);
    }
  }, [device, xiaomiTools]);

  /**
   * 执行解锁工具
   * 重构点：使用提取的 UnlockService 服务类，大幅简化代码
   */
  const executeUnlockTool = useCallback(async (toolId: string) => {
    if (!device) {
      setStatusBarMessage({
        type: "warning",
        message: t('unlock.select_device_first'),
      });
      return;
    }

    setIsExecuting(true);

    try {
      await UnlockService.executeUnlockTool(toolId, device, setStatusBarMessage);
    } catch (error) {
      // 错误处理已在服务类中完成
      console.error(t('unlock.execute_failed_log'), error);
    } finally {
      setIsExecuting(false);
      setSelectedAction("");
    }
  }, [device, setStatusBarMessage]);

  /**
   * 执行其他操作
   * 重构点：使用提取的工具函数，简化复杂逻辑
   */
  const executeAction = useCallback(async (actionId: string) => {
    setIsExecuting(true);
    setConfirmDialogOpen(false);

    try {
      let skipSuccessNotify = false;

      switch (actionId) {
        case "xiaomi_unlock_tool":
        case "bypass_unlock":
          // 重构点：统一调用解锁工具执行方法
          await executeUnlockTool(actionId);
          break;
        
        case "detect_unlock_method": {
          // 重构点：使用提取的检测解锁方式函数
          const detectionResult = await detectUnlockMethod(device, deviceService);
          
          const lines: string[] = [];
          if (!detectionResult.isXiaomiDevice) {
            lines.push(`• ${t('unlock.not_xiaomi')}`);
          }
          lines.push(`• ${t('unlock.android_version')}${detectionResult.androidVersion}`);
          lines.push(`• ${t('unlock.system_version')}${detectionResult.systemVersion}`);
          lines.push(`• ${t('unlock.suggestion')}${detectionResult.guidance}`);

          setResultDialogTitle(t('unlock.detection_result'));
          setResultDialogMessage(lines.join("\n"));
          setResultDialogOpen(true);
          skipSuccessNotify = true;
          break;
        }
        
        case "install_unlock_settings": {
          // 重构点：使用提取的系统信息获取和建议生成函数
          setStatusBarMessage({
            type: "info",
            message: t('unlock.detecting_system'),
          });

          const systemInfo = await getSystemInfo(deviceService, device.serial, addCommandOutput);
          const adviceLines = generateInstallAdvice(systemInfo);

          // 根据检测结果设置对话框标题
          let dialogTitle = t('unlock.install_advice');
          if (!isNaN(systemInfo.androidMajor) && systemInfo.androidMajor >= 15) {
            dialogTitle = t('unlock.bypass_failed');
          } else if (!/816/i.test(systemInfo.miuiName)) {
            dialogTitle = t('unlock.no_install_needed');
          }

          setResultDialogTitle(dialogTitle);
          setResultDialogMessage(adviceLines.join("\n"));
          setResultDialogOpen(true);
          skipSuccessNotify = true;
          break;
        }
        
        default:
          throw new Error(t('unlock.unknown_action'));
      }

      if (!skipSuccessNotify) {
        setStatusBarMessage({
          type: "success",
          message: `${xiaomiTools.find(t => t.id === actionId)?.label} ${t('unlock.success')}`,
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: error instanceof Error ? error.message : t('unlock.unknown_error'),
      });
    } finally {
      setIsExecuting(false);
      setSelectedAction("");
    }
  }, [device, deviceService, addCommandOutput, xiaomiTools, executeUnlockTool, setStatusBarMessage]);

  /**
   * 对话框事件处理
   * 重构点：提取对话框事件处理逻辑
   */
  const handleConfirmDialogClose = useCallback(() => {
    setConfirmDialogOpen(false);
    setSelectedAction("");
  }, []);

  const handleConfirmExecute = useCallback(() => {
    executeAction(selectedAction);
  }, [selectedAction, executeAction]);

  const handleResultDialogClose = useCallback(() => {
    setResultDialogOpen(false);
  }, []);

  return (
    <>
      <Card className={styles.card}>
        
        <div className={styles.content}>
          {/* 危险操作警告 */}
          <div className={styles.warningSection}>
            <Warning24Regular className={styles.warningIcon} />
            <Text size={200}>
              {t('unlock.risk_warning')}
            </Text>
          </div>
          {/* 工具列表 */}
          <div className={styles.toolsGrid}>
            {xiaomiTools.map((tool) => (
              <Button
                key={tool.id}
                appearance={tool.dangerous ? "primary" : "secondary"}
                className={styles.toolButton}
                onClick={() => handleToolClick(tool.id)}
                disabled={!tool.available || isExecuting}
              >
                {isExecuting && selectedAction === tool.id ? (
                  <Spinner size="small" />
                ) : (
                  tool.icon
                )}
                <div style={{ textAlign: "left" }}>
                  <Text weight="semibold">{tool.label}</Text>
                  <br />
                  <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                    {tool.description}
                  </Text>
                </div>
              </Button>
            ))}
          </div>


        </div>
      </Card>

      {/* 重构点：使用提取的对话框组件 */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        selectedTool={selectedTool}
        onConfirm={handleConfirmExecute}
        onCancel={handleConfirmDialogClose}
      />

      <ResultDialog
        open={resultDialogOpen}
        onOpenChange={setResultDialogOpen}
        title={resultDialogTitle}
        message={resultDialogMessage}
        onClose={handleResultDialogClose}
      />
    </>
  );
};

export default XiaomiUnlockCard;