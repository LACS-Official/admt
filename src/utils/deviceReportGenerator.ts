import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { openPath } from "@tauri-apps/plugin-opener";
import { DeviceInfo } from "../types/device";

export interface MemoryStorageReportData {
  storage_used?: number | null;
  storage_total?: number | null;
  storage_usage_percent?: number | null;
  memory_used?: number | null;
  memory_total?: number | null;
  memory_usage_percent?: number | null;
  battery_temperature?: number | null;
}

export async function generateDeviceHtmlReport(
  device: DeviceInfo,
  memoryStorageInfo: any,
  tempInfo: { temperature: number | null; temperaturePercent: number | null; status: string },
  storageInfo: { used: number; total: number; text: string; usedGB: string; totalGB: string },
  memInfo: { used: number; total: number; text: string; usedGB: string; totalGB: string },
  setStatusBarMessage: (msg: { type: "info" | "success" | "warning" | "error"; message: string; duration?: number }) => void
): Promise<void> {
  if (!device.connected || !device.serial) {
    setStatusBarMessage({
      type: "error",
      message: "未连接设备或设备未就绪",
      duration: 2000,
    });
    return;
  }

  try {
    const brand = device.properties?.brand || "Android";
    const model = device.properties?.model || "Device";
    const serial = device.serial;
    const dateStr = new Date().toLocaleString();
    const isFastboot = device.mode === "fastboot";

    let htmlContent = "";

    if (isFastboot) {
      const fastbootBasic = [
        { label: "产品代号", value: device.properties?.productName || "未知" },
        { label: "序列号", value: device.serial || "未知" },
        { label: "引导方式", value: device.properties?.hardware || "未知" },
        { label: "最大下载大小", value: device.properties?.totalMemory || "未知" },
        { label: "并行刷写", value: device.properties?.parallelDownloadFlash ? "是" : "否" },
        { label: "关机充电", value: device.properties?.offModeCharge ? "开启" : "关闭" },
      ];

      const fastbootSecurity = [
        {
          label: "解锁状态 (Bootloader)",
          value: device.properties?.bootloaderLocked ? "已解锁 (Unlocked)" : "已锁定 (Locked)",
          isSafe: !!device.properties?.bootloaderLocked
        },
        { label: "安全启动 (Secure Boot)", value: device.properties?.secure ? "启用" : "禁用" },
        { label: "防回滚 (Anti rollback)", value: device.properties?.antiRollback ? "启用" : "禁用" },
        { label: "校验模式", value: device.properties?.verityMode === "enforcing" ? "用户校验" : "Bootloader 校验" },
      ];

      const fastbootHardware = [
        { label: "硬件版本", value: device.properties?.socManufacturer || "未知" },
        { label: "当前电量", value: device.properties?.batteryLevel ? `${device.properties.batteryLevel}%` : "未知" },
        { label: "电池状态", value: device.properties?.batteryLevel && device.properties.batteryLevel > 20 ? "电量充足" : "电量不足" },
        { label: "CPU ID", value: device.properties?.cpuid || "未知" },
      ];

      htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brand} ${model} Fastboot 模式配置报告</title>
    <style>
        :root {
            --bg-color: #f8fafc;
            --card-bg: #ffffff;
            --text-primary: #0f172a;
            --text-secondary: #475569;
            --border-color: #e2e8f0;
            --primary-color: #d97706;
            --success-color: #16a34a;
            --warning-color: #d97706;
            --danger-color: #dc2626;
            --accent-bg: #f1f5f9;
        }
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-primary);
            margin: 0;
            padding: 40px 20px;
            line-height: 1.5;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        .header {
            border-bottom: 2px solid var(--text-primary);
            padding-bottom: 24px;
            margin-bottom: 32px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .header-title h1 { margin: 0 0 8px 0; font-size: 32px; font-weight: 800; }
        .header-title p { margin: 0; color: var(--text-secondary); font-size: 14px; }
        .header-meta { text-align: right; font-size: 14px; color: var(--text-secondary); }
        .header-meta span { font-family: monospace; background-color: var(--accent-bg); padding: 2px 6px; border-radius: 4px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .summary-card { background-color: var(--card-bg); border: 1px solid var(--border-color); padding: 16px; border-radius: 8px; }
        .summary-card-label { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px; }
        .summary-card-value { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
        .progress-bar-bg { background-color: var(--accent-bg); height: 6px; border-radius: 3px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 3px; }
        .detail-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 768px) {
            .detail-sections { grid-template-columns: 1fr; }
            .header { flex-direction: column; align-items: flex-start; gap: 16px; }
            .header-meta { text-align: left; }
        }
        .section-card { background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
        .section-header { background-color: var(--accent-bg); padding: 12px 16px; font-size: 13px; font-weight: 700; border-bottom: 1px solid var(--border-color); text-transform: uppercase; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table tr { border-bottom: 1px solid var(--border-color); }
        .info-table tr:last-child { border-bottom: none; }
        .info-table td { padding: 12px 16px; font-size: 13px; vertical-align: middle; }
        .info-table td.label { color: var(--text-secondary); width: 38%; font-weight: 500; }
        .info-table td.value { color: var(--text-primary); font-weight: 600; word-break: break-all; }
        .badge { display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: 700; border-radius: 4px; }
        .badge-success { background-color: #dcfce7; color: var(--success-color); }
        .badge-danger { background-color: #fee2e2; color: var(--danger-color); }
        .badge-neutral { background-color: var(--accent-bg); color: var(--text-secondary); }
        .footer { margin-top: 48px; border-top: 1px solid var(--border-color); padding-top: 16px; text-align: center; font-size: 12px; color: var(--text-secondary); }
        .print-btn { background-color: var(--text-primary); color: #ffffff; border: none; padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 4px; cursor: pointer; }
        @media print { body { background-color: #ffffff; padding: 0; } .print-btn { display: none; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-title">
                <h1>${brand} ${model} [FASTBOOT]</h1>
                <p>Android 刷机模式 (Fastboot) 设备配置及安全状态报告</p>
            </div>
            <div class="header-meta">
                <div>序列号: <span>${serial}</span></div>
                <div style="margin-top: 4px;">导出时间: ${dateStr}</div>
                <div style="margin-top: 8px;"><button class="print-btn" onclick="window.print()">打印 / 导出 PDF</button></div>
            </div>
        </div>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-card-label">设备电量状态</div>
                <div class="summary-card-value">${device.properties?.batteryLevel ? device.properties.batteryLevel + '%' : '未知'}</div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${device.properties?.batteryLevel || 0}%; background-color: var(--primary-color)"></div>
                </div>
            </div>
            <div class="summary-card" style="grid-column: span 3;">
                <div class="summary-card-label">安全状态摘要</div>
                <div style="font-size: 14px; font-weight: 600; margin-top: 8px;">
                    锁状态: ${device.properties?.bootloaderLocked ? '<span class="badge badge-success">已解锁 (Unlocked)</span>' : '<span class="badge badge-danger">已锁定 (Locked)</span>'}
                    &nbsp;&nbsp;
                    安全启动: ${device.properties?.secure ? '<span class="badge badge-success">已启用 (Secure)</span>' : '<span class="badge badge-neutral">已禁用</span>'}
                    &nbsp;&nbsp;
                    防回滚保护: ${device.properties?.antiRollback ? '<span class="badge badge-success">已激活</span>' : '<span class="badge badge-neutral">未激活</span>'}
                </div>
            </div>
        </div>
        <div class="detail-sections">
            <div class="section-card">
                <div class="section-header">Fastboot 基本配置</div>
                <table class="info-table">
                    ${fastbootBasic.map(item => `<tr><td class="label">${item.label}</td><td class="value">${item.value}</td></tr>`).join('')}
                </table>
            </div>
            <div class="section-card">
                <div class="section-header">安全与锁定状态</div>
                <table class="info-table">
                    ${fastbootSecurity.map(item => `<tr><td class="label">${item.label}</td><td class="value">${item.label.includes("解锁状态") ? `<span class="badge ${item.isSafe ? 'badge-success' : 'badge-danger'}">${item.value}</span>` : item.value}</td></tr>`).join('')}
                </table>
            </div>
            <div class="section-card" style="grid-column: span 2;">
                <div class="section-header">硬件核心指标</div>
                <table class="info-table">
                    ${fastbootHardware.map(item => `<tr><td class="label" style="width: 20%;">${item.label}</td><td class="value">${item.value}</td></tr>`).join('')}
                </table>
            </div>
        </div>
        <div class="footer">设备配置报告由 ADMT 生成 • 本地 Fastboot 报告</div>
    </div>
</body>
</html>`;
    } else {
      const basicItems = [
        { label: "设备名称", value: device.properties?.marketName || device.properties?.model || "未知" },
        { label: "品牌", value: device.properties?.brand || "未知" },
        { label: "型号", value: device.properties?.model || "未知" },
        { label: "序列号", value: device.serial || "未知" },
        { label: "Android 版本", value: `Android ${device.properties?.androidVersion || "未知"}` },
        { label: "SDK 版本", value: device.properties?.sdkVersion || "未知" },
        { label: "设备代号", value: device.properties?.deviceName || "未知" },
        { label: "编译版本", value: device.properties?.buildId || "未知" },
        { label: "主板序列号", value: device.boardSerialNumber || "未知" },
      ];

      const hardwareItems = [
        { label: "CPU 架构", value: device.properties?.cpuAbi || "arm64-v8a" },
        { label: "CPU 代号", value: device.properties?.hardware || "未知" },
        { label: "芯片厂商", value: device.properties?.socManufacturer || "未知" },
        { label: "芯片型号", value: device.properties?.socModel || "未知" },
        { label: "屏幕分辨率", value: device.properties?.screenResolution || "未知" },
        { label: "屏幕密度 (LCD)", value: device.properties?.lcdDensity ? `${device.properties.lcdDensity} dpi` : "未知" },
        { label: "硬件芯片", value: device.properties?.hardwareChipname || "未知" },
        { label: "主板平台", value: device.properties?.boardPlatform || "未知" },
        { label: "产品主板", value: device.properties?.productBoard || "未知" },
      ];

      const systemItems = [
        { label: "Android 版本", value: device.properties?.androidVersion || "未知" },
        { label: "SDK 版本", value: device.properties?.sdkVersion || "未知" },
        { label: "安全补丁等级", value: device.properties?.securityPatchLevel || "未知" },
        { label: "编译版本号", value: device.properties?.buildId || "未知" },
        { label: "构建日期", value: device.properties?.buildDate || "未知" },
        { label: "构建用户", value: device.properties?.buildUser || "未知" },
        { label: "构建主机", value: device.properties?.buildHost || "未知" },
        { label: "显示版本号", value: device.properties?.buildDisplayId || "未知" },
        { label: "系统版本", value: device.properties?.systemVersion || "未知" },
      ];

      const securityItems = [
        {
          label: "Bootloader 锁",
          value: String(device.properties?.bootloaderLocked) === "false" ? "已解锁 (Unlocked)" :
            String(device.properties?.bootloaderLocked) === "true" ? "已上锁 (Locked)" : "未知",
          isSafe: String(device.properties?.bootloaderLocked) === "false"
        },
        { label: "验证引导状态", value: device.properties?.verifiedBootState || "未知" },
        { label: "安全检查模式", value: device.properties?.verityMode || "未知" },
        { label: "调试模式", value: String(device.properties?.debuggable) === "true" ? "开启" : "关闭" },
        { label: "安全模式", value: String(device.properties?.secure) === "true" ? "开启" : "关闭" },
        { label: "ADB 安全验证", value: String(device.properties?.adbSecure) === "true" ? "开启" : "关闭" },
      ];

      const networkItems = [
        { label: "IMEI/MEID", value: device.properties?.imei || "未知" },
        { label: "默认网络类型", value: device.properties?.defaultNetwork || "未知" },
        { label: "区域/语言", value: device.properties?.locale || "未知" },
        { label: "当前时区", value: device.properties?.timezone || "未知" },
        { label: "出厂 API 版本", value: device.properties?.firstApiLevel || "未知" },
        { label: "VNDK 版本", value: device.properties?.vndkVersion || "未知" },
        { label: "支持的 CPU 列表", value: device.properties?.cpuAbiList || "未知" },
      ];

      const batteryLevel = device.properties?.batteryLevel || 0;

      htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brand} ${model} 设备配置报告</title>
    <style>
        :root {
            --bg-color: #f8fafc;
            --card-bg: #ffffff;
            --text-primary: #0f172a;
            --text-secondary: #475569;
            --border-color: #e2e8f0;
            --primary-color: #2563eb;
            --success-color: #16a34a;
            --warning-color: #d97706;
            --danger-color: #dc2626;
            --accent-bg: #f1f5f9;
        }
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-primary);
            margin: 0;
            padding: 40px 20px;
            line-height: 1.5;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        .header {
            border-bottom: 2px solid var(--text-primary);
            padding-bottom: 24px;
            margin-bottom: 32px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .header-title h1 { margin: 0 0 8px 0; font-size: 32px; font-weight: 800; }
        .header-title p { margin: 0; color: var(--text-secondary); font-size: 14px; }
        .header-meta { text-align: right; font-size: 14px; color: var(--text-secondary); }
        .header-meta span { font-family: monospace; background-color: var(--accent-bg); padding: 2px 6px; border-radius: 4px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .summary-card { background-color: var(--card-bg); border: 1px solid var(--border-color); padding: 16px; border-radius: 8px; }
        .summary-card-label { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px; }
        .summary-card-value { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
        .progress-bar-bg { background-color: var(--accent-bg); height: 6px; border-radius: 3px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 3px; }
        .detail-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 768px) {
            .detail-sections { grid-template-columns: 1fr; }
            .header { flex-direction: column; align-items: flex-start; gap: 16px; }
            .header-meta { text-align: left; }
        }
        .section-card { background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
        .section-header { background-color: var(--accent-bg); padding: 12px 16px; font-size: 13px; font-weight: 700; border-bottom: 1px solid var(--border-color); text-transform: uppercase; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table tr { border-bottom: 1px solid var(--border-color); }
        .info-table tr:last-child { border-bottom: none; }
        .info-table td { padding: 12px 16px; font-size: 13px; vertical-align: middle; }
        .info-table td.label { color: var(--text-secondary); width: 38%; font-weight: 500; }
        .info-table td.value { color: var(--text-primary); font-weight: 600; word-break: break-all; }
        .badge { display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: 700; border-radius: 4px; }
        .badge-success { background-color: #dcfce7; color: var(--success-color); }
        .badge-danger { background-color: #fee2e2; color: var(--danger-color); }
        .badge-neutral { background-color: var(--accent-bg); color: var(--text-secondary); }
        .footer { margin-top: 48px; border-top: 1px solid var(--border-color); padding-top: 16px; text-align: center; font-size: 12px; color: var(--text-secondary); }
        .print-btn { background-color: var(--text-primary); color: #ffffff; border: none; padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 4px; cursor: pointer; }
        @media print { body { background-color: #ffffff; padding: 0; } .print-btn { display: none; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-title">
                <h1>${brand} ${model}</h1>
                <p>Android 设备系统配置及硬件运行报告</p>
            </div>
            <div class="header-meta">
                <div>序列号: <span>${serial}</span></div>
                <div style="margin-top: 4px;">导出时间: ${dateStr}</div>
                <div style="margin-top: 8px;"><button class="print-btn" onclick="window.print()">打印 / 导出 PDF</button></div>
            </div>
        </div>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-card-label">当前电量</div>
                <div class="summary-card-value">${batteryLevel}%</div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${batteryLevel}%; background-color: ${batteryLevel <= 20 ? 'var(--danger-color)' : batteryLevel <= 50 ? 'var(--warning-color)' : 'var(--success-color)'}"></div>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-card-label">设备温度</div>
                <div class="summary-card-value">${tempInfo.temperature !== null ? tempInfo.temperature.toFixed(1) + ' °C' : '未知'}</div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${tempInfo.temperaturePercent !== null ? tempInfo.temperaturePercent : 0}%; background-color: ${tempInfo.temperature && tempInfo.temperature >= 45 ? 'var(--danger-color)' : tempInfo.temperature && tempInfo.temperature >= 35 ? 'var(--warning-color)' : 'var(--success-color)'}"></div>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-card-label">内存使用 (RAM)</div>
                <div class="summary-card-value">${memInfo.used}%</div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${memInfo.used}%; background-color: ${memInfo.used > 90 ? 'var(--danger-color)' : memInfo.used > 80 ? 'var(--warning-color)' : 'var(--primary-color)'}"></div>
                </div>
                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">${memInfo.usedGB} / ${memInfo.totalGB}</div>
            </div>
            <div class="summary-card">
                <div class="summary-card-label">内部存储 (Storage)</div>
                <div class="summary-card-value">${storageInfo.used}%</div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${storageInfo.used}%; background-color: ${storageInfo.used > 80 ? 'var(--danger-color)' : storageInfo.used > 60 ? 'var(--warning-color)' : 'var(--primary-color)'}"></div>
                </div>
                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">${storageInfo.usedGB} / ${storageInfo.totalGB}</div>
            </div>
        </div>
        <div class="detail-sections">
            <div class="section-card">
                <div class="section-header">设备基本配置</div>
                <table class="info-table">
                    ${basicItems.map(item => `<tr><td class="label">${item.label}</td><td class="value">${item.value}</td></tr>`).join('')}
                </table>
            </div>
            <div class="section-card">
                <div class="section-header">处理器及硬件性能</div>
                <table class="info-table">
                    ${hardwareItems.map(item => `<tr><td class="label">${item.label}</td><td class="value">${item.value}</td></tr>`).join('')}
                </table>
            </div>
            <div class="section-card">
                <div class="section-header">操作系统与固件信息</div>
                <table class="info-table">
                    ${systemItems.map(item => `<tr><td class="label">${item.label}</td><td class="value">${item.value}</td></tr>`).join('')}
                </table>
            </div>
            <div class="section-card">
                <div class="section-header">安全与防护状态</div>
                <table class="info-table">
                    ${securityItems.map(item => `<tr><td class="label">${item.label}</td><td class="value">${item.label === "Bootloader 锁" ? `<span class="badge ${item.isSafe ? 'badge-success' : 'badge-danger'}">${item.value}</span>` : item.value}</td></tr>`).join('')}
                </table>
            </div>
            <div class="section-card" style="grid-column: span 2;">
                <div class="section-header">网络通信与区域设置</div>
                <table class="info-table">
                    ${networkItems.map(item => `<tr><td class="label" style="width: 20%;">${item.label}</td><td class="value">${item.value}</td></tr>`).join('')}
                </table>
            </div>
        </div>
        <div class="footer">设备配置报告由玩机管家生成</div>
    </div>
</body>
</html>`;
    }

    const defaultName = `ADMT_Report_${brand.replace(/\s+/g, '_')}_${model.replace(/\s+/g, '_')}.html`;
    const filePath = await save({
      filters: [{ name: "HTML 网页", extensions: ["html"] }],
      defaultPath: defaultName,
    });

    if (filePath) {
      await writeTextFile(filePath, htmlContent);
      await openPath(filePath);
      setStatusBarMessage({
        type: "success",
        message: "设备配置 HTML 报告已成功生成并在浏览器中打开",
        duration: 3000,
      });
    }
  } catch (error: any) {
    console.error("Failed to generate report:", error);
    setStatusBarMessage({
      type: "error",
      message: `生成报告失败: ${error.message || String(error)}`,
      duration: 3000,
    });
  }
}
