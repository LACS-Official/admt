import React, { useState } from "react";
import {
  makeStyles,
  shorthands,
  Button,
  TabList,
  Tab,
  Text,
  Badge,
  Card,
  tokens,
} from "@fluentui/react-components";
import {
  Code24Regular,
  DocumentCopy24Regular,
  Checkmark24Regular,
  ArrowDownload24Regular,
  BookOpen24Regular,
  AppsList24Regular,
  Lightbulb24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    height: "100%",
    overflowY: "auto",
    paddingRight: "4px",
  },
  header: {
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.padding("16px 20px"),
    ...shorthands.borderRadius("12px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
  },
  sectionCard: {
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.borderRadius("12px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    ...shorthands.padding("20px"),
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
  },
  codeBlock: {
    backgroundColor: "var(--colorNeutralBackground3)",
    ...shorthands.borderRadius("8px"),
    ...shorthands.padding("14px"),
    fontFamily: "Consolas, Monaco, 'Courier New', monospace",
    fontSize: "12px",
    lineHeight: "1.5",
    color: "var(--colorNeutralForeground1)",
    overflowX: "auto",
    position: "relative",
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke3)"),
    whiteSpace: "pre",
  },
  copyBtn: {
    position: "absolute",
    top: "10px",
    right: "10px",
  },
  apiTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    "& th": {
      textAlign: "left",
      padding: "10px 12px",
      borderBottom: "1px solid var(--colorNeutralStroke2)",
      backgroundColor: "var(--colorNeutralBackground2)",
      color: "var(--colorNeutralForeground2)",
      fontWeight: "600",
    },
    "& td": {
      padding: "10px 12px",
      borderBottom: "1px solid var(--colorNeutralStroke3)",
      color: "var(--colorNeutralForeground1)",
    },
  },
});

const PluginDevDocsTab: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { setStatusBarMessage } = useAppStore();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const manifestExample = `{
  "$schema": "https://admt.lacs.top/schema/plugin.v1.json",
  "id": "com.developer.sample-helper",
  "name": "示例玩机扩展插件",
  "nameEn": "Sample Android Helper",
  "version": "1.0.0",
  "description": "演示 ADMT 插件标准生命周期与 ADB 特权调用",
  "author": {
    "name": "开发者名称",
    "url": "https://github.com/yourname"
  },
  "category": "tools",
  "permissions": [
    "adb:execute",
    "device:info",
    "ui:toast"
  ],
  "main": "index.js",
  "settingsSchema": [
    {
      "id": "autoClean",
      "name": "执行后自动清理临时文件",
      "type": "boolean",
      "default": true
    }
  ]
}`;

  const jsScriptExample = `// index.js - ADMT 插件标准入口
export default {
  // 插件加载初始化钩子
  onLoad(context) {
    context.logger.info("插件已成功加载！");
  },

  // 设备接入事件监听
  onDeviceConnect(device, context) {
    context.ui.toast(\`检测到设备连接: \${device.model} (\${device.serial})\`);
  },

  // 用户点击“启动功能”或主操作时执行
  async onExecute(context) {
    const device = await context.device.getSelected();
    if (!device) {
      context.ui.toast("请先连接或选择一台 Android 设备", { type: "warning" });
      return;
    }

    // 执行安全 ADB 命令
    const batteryStatus = await context.adb.exec("dumpsys battery");
    context.logger.info("电池信息输出:", batteryStatus);

    context.ui.showModal({
      title: "执行成功",
      content: \`设备 \${device.serial} 电池数据已抓取完毕！\`
    });
  },

  // 插件卸载或禁用前钩子
  onUnload(context) {
    context.logger.info("插件已清理释放。");
  }
};`;

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setStatusBarMessage({
      type: "success",
      message: "代码已复制到剪贴板",
    });
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const downloadBoilerplate = () => {
    const boilerplate = {
      "manifest.json": manifestExample,
      "index.js": jsScriptExample,
      "README.md": "# ADMT Plugin Boilerplate\n\n欢迎开发 ADMT 玩机管家插件！",
    };

    const blob = new Blob([JSON.stringify(boilerplate, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admt-plugin-boilerplate.json";
    a.click();
    URL.revokeObjectURL(url);

    setStatusBarMessage({
      type: "success",
      message: "开发工程脚手架已生成并下载",
    });
  };

  return (
    <div className={styles.container}>
      {/* 顶部标题与脚手架下载 */}
      <div className={styles.header}>
        <div>
          <Text weight="bold" size={400}>
            {t("plugin_system.docs.dev_title", "ADMT 插件开发全景指南")}
          </Text>
          <div style={{ fontSize: "12px", color: "var(--colorNeutralForeground3)", marginTop: "2px" }}>
            基于 TypeScript / JavaScript 打造轻量、安全、模块化的 Android 深度扩展
          </div>
        </div>

        <Button appearance="primary" icon={<ArrowDownload24Regular />} onClick={downloadBoilerplate}>
          {t("plugin_system.docs.download_template", "下载开发工程模板")}
        </Button>
      </div>

      {/* 1. 清单文件规范 */}
      <div className={styles.sectionCard}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Badge appearance="tint" color="brand">
            01
          </Badge>
          <Text weight="bold" size={300}>
            插件清单文件结构 (manifest.json)
          </Text>
        </div>
        <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
          每个 ADMT 插件根目录下必须包含一个 <code>manifest.json</code> 用于声明元数据、分类、申请特权与可配置项：
        </Text>
        <div className={styles.codeBlock}>
          <Button
            size="small"
            appearance="subtle"
            className={styles.copyBtn}
            icon={copiedSection === "manifest" ? <Checkmark24Regular /> : <DocumentCopy24Regular />}
            onClick={() => copyCode(manifestExample, "manifest")}
          >
            {copiedSection === "manifest" ? "已复制" : "复制代码"}
          </Button>
          {manifestExample}
        </div>
      </div>

      {/* 2. 生命周期与代码规范 */}
      <div className={styles.sectionCard}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Badge appearance="tint" color="brand">
            02
          </Badge>
          <Text weight="bold" size={300}>
            插件生命周期与执行代码 (index.js)
          </Text>
        </div>
        <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
          插件主体暴露标准的生命周期方法，所有对底层系统的调用均通过沙箱 <code>context</code> 注入：
        </Text>
        <div className={styles.codeBlock}>
          <Button
            size="small"
            appearance="subtle"
            className={styles.copyBtn}
            icon={copiedSection === "script" ? <Checkmark24Regular /> : <DocumentCopy24Regular />}
            onClick={() => copyCode(jsScriptExample, "script")}
          >
            {copiedSection === "script" ? "已复制" : "复制代码"}
          </Button>
          {jsScriptExample}
        </div>
      </div>

      {/* 3. 核心 API 参考 */}
      <div className={styles.sectionCard}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Badge appearance="tint" color="brand">
            03
          </Badge>
          <Text weight="bold" size={300}>
            ADMT 运行时 API 接口参考
          </Text>
        </div>
        <table className={styles.apiTable}>
          <thead>
            <tr>
              <th>接口方法</th>
              <th>所属权限</th>
              <th>参数与说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>context.adb.exec(command: string)</code></td>
              <td><code>adb:execute</code></td>
              <td>在选中设备上执行一条 ADB Shell 指令并返回 stdout 结果</td>
            </tr>
            <tr>
              <td><code>context.fastboot.flash(partition, file)</code></td>
              <td><code>fastboot:execute</code></td>
              <td>向指定的 fastboot 分区（如 boot/recovery）刷入镜像文件</td>
            </tr>
            <tr>
              <td><code>context.device.getInfo()</code></td>
              <td><code>device:info</code></td>
              <td>获取当前连接设备的序列号、型号、品牌、Android 版本及电量</td>
            </tr>
            <tr>
              <td><code>context.ui.toast(message, options)</code></td>
              <td><code>ui:toast</code></td>
              <td>在 ADMT 底部状态栏或顶部弹出轻提示（info / success / error）</td>
            </tr>
            <tr>
              <td><code>context.ui.showModal(dialogOptions)</code></td>
              <td><code>ui:modal</code></td>
              <td>在界面中央拉起自定义交互模态弹窗与操作确认</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PluginDevDocsTab;
