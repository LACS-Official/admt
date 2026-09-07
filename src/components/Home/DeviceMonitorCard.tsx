import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Button,
  Text,
  Tab,
  TabList,
  Spinner,
  mergeClasses,
  tokens,
  Badge,
} from '@fluentui/react-components';
import {
  Pulse24Regular,
  Play24Filled,
  Stop24Filled,
  ArrowDownload24Regular,
  Delete24Regular,
  Image24Regular,
} from '@fluentui/react-icons';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile, writeFile, BaseDirectory, mkdir } from '@tauri-apps/plugin-fs';
import { documentDir, join } from '@tauri-apps/api/path';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import html2canvas from 'html2canvas';

import { useAppStore } from '../../stores/appStore';
import { useDeviceStore } from '../../stores/deviceStore';
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  card: {
    padding: "20px 24px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflow: "hidden",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "14px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  titleSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "3px 10px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: 500,
    backgroundColor: "var(--colorNeutralBackground3)",
    color: "var(--colorNeutralForeground2)",
  },
  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    display: "inline-block",
    transition: "all 0.3s ease",
  },
  rangePillGroup: {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "9999px",
    padding: "2px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  rangePillBtn: {
    minHeight: "26px",
    padding: "2px 10px",
    fontSize: "12px",
    borderRadius: "9999px",
    border: "none",
    backgroundColor: "transparent",
    color: "var(--colorNeutralForeground2)",
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.15s ease",
    ":hover": {
      color: "var(--colorNeutralForeground1)",
    },
  },
  rangePillBtnActive: {
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorBrandForeground1)",
    fontWeight: 600,
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  actionBtns: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  tabsContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  monitorTabList: {
    flexShrink: 0,
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "9999px",
    padding: "3px 4px",
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    minHeight: "34px",
    border: "1px solid var(--colorNeutralStroke2)",
    "& .fui-Tab": {
      fontSize: "12px",
      padding: "5px 12px",
      minHeight: "28px",
      borderRadius: "9999px",
      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      border: "none",
      fontWeight: 500,
      color: "var(--colorNeutralForeground2)",
      margin: "0 2px",

      "&:hover": {
        backgroundColor: "var(--colorNeutralBackground1Hover)",
        color: "var(--colorNeutralForeground1)",
      },

      "&[aria-selected='true']": {
        backgroundColor: "var(--colorNeutralBackground1)",
        color: "var(--colorBrandForeground1)",
        boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
        fontWeight: 600,
      },
    },
  },
  subModePillGroup: {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "9999px",
    padding: "2px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  chartContainer: {
    height: "380px",
    minHeight: "340px",
    position: "relative",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    overflow: "hidden",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalSNudge,
    marginRight: tokens.spacingHorizontalL,
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderRadius: "6px",
    transition: "background 0.2s",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
    },
  },
  customTooltip: {
    backgroundColor: "var(--colorNeutralBackground1)",
    backdropFilter: "blur(16px)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "10px",
    padding: "10px 14px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  processSection: {
    marginTop: "6px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  processHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  processList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "10px",
  },
  processItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "10px 14px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "10px",
    border: "1px solid var(--colorNeutralStroke2)",
    transition: "all 0.15s ease",
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
    },
  },
});

const COLORS = [
  '#0078d4', '#107c10', '#d13438', '#ffaa00', '#00b7c3', '#5c2d91', '#004e8c', '#004b50',
  '#b4009e', '#008272', '#00bcff', '#498205', '#e3008c', '#8e1600', '#00418c', '#002050',
];

interface MonitorDataPoint {
  time: string;
  timestamp: number;
  [key: string]: any;
}

interface DeviceMonitorCardProps {
  device?: any;
}

const DeviceMonitorCard: React.FC<DeviceMonitorCardProps> = ({ device: propDevice }) => {
  const styles = useStyles();
  const { config } = useAppStore();
  const { selectedDevice: storeDevice } = useDeviceStore();
  const selectedDevice = propDevice || storeDevice;
  const { t } = useTranslation();

  const isSysMode = selectedDevice?.mode === 'sys';
  const [isMonitoring, setIsMonitoring] = useState((config.monitorAutoStart || !!selectedDevice) && isSysMode);
  const [dataPoints, setDataPoints] = useState<MonitorDataPoint[]>([]);

  // 监听设备切换，只要有设备处于系统模式且当前未监控，则自动启动
  useEffect(() => {
    if (selectedDevice && selectedDevice.mode === 'sys' && !isMonitoring) {
      setIsMonitoring(true);
    } else if (selectedDevice && selectedDevice.mode !== 'sys' && isMonitoring) {
      setIsMonitoring(false);
    }
  }, [selectedDevice?.serial, selectedDevice?.mode]);
  const [activeTab, setActiveTab] = useState<'cpu' | 'memory' | 'temperature' | 'power' | 'network' | 'gpu'>('cpu');
  const [cpuDisplayMode, setCpuDisplayMode] = useState<'utilization' | 'frequency'>('utilization');
  const [memDisplayMode, setMemDisplayMode] = useState<'percent' | 'space'>('percent');
  const [topProcesses, setTopProcesses] = useState<any[]>([]);
  const [hiddenLines, setHiddenLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const csvFileRef = useRef<string | null>(null);
  const lastFetchTime = useRef<number>(0);

  // 维护 CPU 核心名称列表以动态生成 Line
  const cpuCoreNames = useMemo(() => {
    if (dataPoints.length === 0) return [];
    return Object.keys(dataPoints[0]).filter(key => key.startsWith('cpu') && !key.includes('freq'));
  }, [dataPoints]);

  // 处理图例点击
  const handleLegendClick = (entry: any) => {
    const { dataKey } = entry;
    setHiddenLines(prev =>
      prev.includes(dataKey) ? prev.filter(k => k !== dataKey) : [...prev, dataKey]
    );
  };

  // 全显/全隐该页线段
  const toggleCurrentTabLines = () => {
    let currentKeys: string[] = [];
    if (activeTab === 'cpu') {
      if (cpuDisplayMode === 'utilization') {
        currentKeys = ['totalCpuUsage', ...cpuCoreNames];
      } else {
        currentKeys = cpuCoreNames.map(name => `freq_${name}`);
      }
    } else if (activeTab === 'memory') {
      currentKeys = memDisplayMode === 'percent' ? ['memUsedPercent', 'memFreePercent'] : ['memUsedGb', 'memFreeGb'];
    } else if (activeTab === 'temperature') {
      currentKeys = ['cpuTemp', 'battTemp'];
    } else if (activeTab === 'power') {
      currentKeys = ['battCap', 'battPower'];
    } else if (activeTab === 'network') {
      currentKeys = ['rxSpeed', 'txSpeed'];
    } else if (activeTab === 'gpu') {
      currentKeys = ['gpuLoad', 'gpuFreq'];
    }

    const allHidden = currentKeys.every(k => hiddenLines.includes(k));
    if (allHidden) {
      setHiddenLines(prev => prev.filter(k => !currentKeys.includes(k)));
    } else {
      setHiddenLines(prev => Array.from(new Set([...prev, ...currentKeys])));
    }
  };

  const [displayRange, setDisplayRange] = useState(60); // Seconds to display
  const maxHistory = 3600; // Keep up to 1 hour (3600 seconds)

  const isFetching = useRef(false);

  const isMonitoringRef = useRef(isMonitoring);
  useEffect(() => {
    isMonitoringRef.current = isMonitoring;
  }, [isMonitoring]);

  // 监控循环
  useEffect(() => {
    let timer: any;
    if (isMonitoring && selectedDevice && selectedDevice.mode === 'sys') {
      console.log(`[Monitor] Starting monitoring for device: ${selectedDevice.serial}`);

      const fetchData = async () => {
        if (!isMonitoringRef.current || isFetching.current || selectedDevice?.mode !== 'sys') return;
        isFetching.current = true;

        const startTime = Date.now();
        try {
          let res: any;
          if (selectedDevice?.serial === "DEMO-ADB-001") {
            // 生成模拟数据
            res = {
              timestamp: startTime,
              cpu: {
                total_usage: 15 + Math.random() * 20,
                core_usages: Array.from({ length: 8 }, () => 10 + Math.random() * 30),
                frequencies: { cpu0: 1800 + Math.random() * 400, cpu4: 2400 + Math.random() * 600 }
              },
              memory: {
                total: 16 * 1024 * 1024,
                available: (8 + Math.random() * 2) * 1024 * 1024
              },
              temperature: {
                cpu: 35 + Math.random() * 10,
                battery: 30 + Math.random() * 5
              },
              battery: {
                level: 85,
                current: -250000 + Math.random() * 50000,
                voltage: 4000000 + Math.random() * 100000,
                health: "Good",
                power: 1.5 + Math.random()
              },
              network: {
                rx_speed: Math.random() * 1024 * 1024,
                tx_speed: Math.random() * 512 * 1024
              },
              gpu: {
                load: 5 + Math.random() * 20,
                freq: 585
              },
              processes: [
                { name: "com.android.systemui", cpu: 5.2, mem: 150.5 },
                { name: "com.lacs.admt", cpu: 2.1, mem: 85.2 },
                { name: "com.google.android.gms", cpu: 1.5, mem: 120.1 }
              ]
            };
          } else {
            res = await invoke('get_device_realtime_monitor_data', { serial: selectedDevice.serial });
          }

          if (!isMonitoringRef.current) return;

          if (!res || !res.cpu) {
            throw new Error("Invalid data received from backend");
          }

          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

          const newDataPoint: MonitorDataPoint = {
            time: timeStr,
            timestamp: res.timestamp,
            totalCpuUsage: res.cpu.total_usage,
            ...res.cpu.core_usages.reduce((acc: any, val: number, j: number) => ({ ...acc, [`cpu${j}`]: val }), {}),
            ...Object.entries(res.cpu.frequencies).reduce((acc: any, [key, val]: [string, any]) => ({ ...acc, [`freq_${key}`]: val }), {}),
            memUsedPercent: res.memory.total > 0 ? ((res.memory.total - res.memory.available) / res.memory.total) * 100 : 0,
            memFreePercent: res.memory.total > 0 ? (res.memory.available / res.memory.total) * 100 : 0,
            memUsedGb: (res.memory.total - res.memory.available) / 1024 / 1024,
            memFreeGb: res.memory.available / 1024 / 1024,
            cpuTemp: res.temperature.cpu,
            battTemp: res.temperature.battery,
            battCap: res.battery.level,
            battPower: res.battery.power,
            rxSpeed: res.network.rx_speed / 1024, // KB/s
            txSpeed: res.network.tx_speed / 1024, // KB/s
            gpuLoad: res.gpu.load,
            gpuFreq: res.gpu.freq,
          };

          setTopProcesses(res.processes || []);

          setDataPoints(prev => {
            const next = [...prev, newDataPoint];
            return next.length > maxHistory ? next.slice(next.length - maxHistory) : next;
          });
          setError(null);

          // 自动导出 CSV
          if (config.monitorAutoCsvExport) {
            handleAutoCsvWrite(newDataPoint);
          }

          const duration = Date.now() - startTime;
          if (duration > 1500) {
            console.warn(`[Monitor] Fetch data took too long: ${duration}ms`);
          }
        } catch (e: any) {
          console.error("[Monitor] Fetch failed:", e);
          if (isMonitoringRef.current) {
            setError(e.message || String(e));
          }
        } finally {
          isFetching.current = false;
          lastFetchTime.current = Date.now();
          if (isMonitoringRef.current) {
            timer = setTimeout(fetchData, config.cpuMonitorInterval);
          }
        }
      };
      fetchData();
    }
    return () => {
      clearTimeout(timer);
      isFetching.current = false;
    };
  }, [isMonitoring, selectedDevice, config.cpuMonitorInterval, config.monitorAutoCsvExport, maxHistory]);

  // 处理 CSV 自动写入
  const handleAutoCsvWrite = async (data: MonitorDataPoint) => {
    try {
      if (!csvFileRef.current) {
        const docDir = await documentDir();
        const admtDir = await join(docDir, 'admt');

        // 格式化设备名称 (移除不合法文件名字符)
        const rawName = selectedDevice?.market_name || selectedDevice?.model || selectedDevice?.serial || 'unknown';
        const deviceName = rawName.replace(/[\\/:*?"<>|]/g, '_');

        // 时间戳 YYYYMMDDHHMMSS
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

        const fname = `admt_DeviceInfo_${deviceName}_${timestamp}.csv`;
        csvFileRef.current = await join(admtDir, fname);
        const header = "Time,CPU Usage(%),Mem Usage(%),CPU Temp(C),Battery Temp(C),Battery(%),Power(W)\n";

        // 确保目录存在
        try {
          await mkdir(admtDir, { recursive: true });
          await writeTextFile(csvFileRef.current, header);
        } catch (err) {
          console.error("准备 CSV 存储目录或写入头部失败:", err);
          throw err;
        }
      }
      const line = `${data.time},${data.totalCpuUsage.toFixed(1)},${data.memUsedPercent.toFixed(1)},${data.cpuTemp.toFixed(1)},${data.battTemp.toFixed(1)},${data.battCap},${data.battPower.toFixed(2)}\n`;
      await writeTextFile(csvFileRef.current, line, { append: true });
    } catch (e) {
      console.error("CSV Auto Write Failed:", e);
    }
  };

  // 当切换设备或检测到新连接时，根据配置自动开启循环
  useEffect(() => {
    if (selectedDevice && selectedDevice.mode === 'sys' && config.monitorAutoStart) {
      setIsMonitoring(true);
      // 清空旧数据以开启新 Session
      setDataPoints([]);
      csvFileRef.current = null;
    }
  }, [selectedDevice?.serial, selectedDevice?.mode, config.monitorAutoStart]);

  const clearData = () => {
    setDataPoints([]);
    csvFileRef.current = null;
  };

  const exportCsvManually = async () => {
    if (dataPoints.length === 0) return;
    const path = await save({
      defaultPath: `monitor_data_${Date.now()}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });
    if (path) {
      const header = "Time,CPU Usage(%),Mem Usage(%),CPU Temp(C),Battery Temp(C),Battery(%),Power(W)\n";
      const rows = dataPoints.map(d => `${d.time},${d.totalCpuUsage.toFixed(2)},${d.memUsedPercent.toFixed(2)},${d.cpuTemp.toFixed(2)},${d.battTemp.toFixed(2)},${d.battCap},${d.battPower.toFixed(2)}`).join('\n');
      await writeTextFile(path, header + rows);
    }
  };

  const exportImage = async () => {
    if (!chartRef.current) return;
    const canvas = await (html2canvas as any)(chartRef.current, { backgroundColor: '#111' });
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#0078d4';
      ctx.font = '16px Segoe UI';
      ctx.rotate(-25 * Math.PI / 180);
      const watermark = "admt-玩机管家 官网admt.lacs.cc @领创工作室";
      // 旋转后坐标系变化，需要扩大渲染范围确保覆盖整个画布
      for (let i = -canvas.width * 0.5; i < canvas.width * 1.5; i += 300) {
        for (let j = -canvas.height * 0.5; j < canvas.height * 1.5; j += 100) {
          ctx.fillText(watermark, i, j);
        }
      }
      ctx.restore();
    }
    const path = await save({
      defaultPath: `monitor_chart_${Date.now()}.png`,
      filters: [{ name: 'Images', extensions: ['png'] }]
    });
    if (path) {
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      await writeFile(path, binaryData);
    }
  };

  const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <Text weight="semibold" style={{ marginBottom: '8px', display: 'block', fontSize: '12px' }}>{label}</Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {payload.map((entry: any, index: number) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', minWidth: '130px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color }} />
                  <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>{entry.name}</Text>
                </div>
                <Text weight="semibold" size={200} style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' }}>
                  {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                </Text>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // 渲染显示的数据点 (增加采样逻辑防止长周期图表卡顿)
  const displayedDataPoints = useMemo(() => {
    const raw = dataPoints.slice(-displayRange);
    if (displayRange <= 300) return raw;

    // 如果点数太多，进行等距采样 (最大保留约 300 个点)
    const step = Math.ceil(displayRange / 300);
    return raw.filter((_, index) => index % step === 0);
  }, [dataPoints, displayRange]);

  if (!selectedDevice || selectedDevice.mode !== 'sys') {
    return null;
  }

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Pulse24Regular style={{ color: "var(--colorBrandForeground1)" }} />
            <Text weight="semibold" size={400}>{t('monitor.title')}</Text>
          </div>
          <div className={styles.statusBadge}>
            <span
              className={styles.statusDot}
              style={{
                backgroundColor: isMonitoring ? "#10b981" : "var(--colorNeutralForeground4)",
                boxShadow: isMonitoring ? "0 0 6px rgba(16, 185, 129, 0.4)" : "none",
              }}
            />
            <span>{isMonitoring ? "实时监控中" : "已暂停"}</span>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.rangePillGroup}>
            {[
              { val: 60, label: t('monitor.range_1m') },
              { val: 600, label: t('monitor.range_10m') },
              { val: 1800, label: t('monitor.range_30m') },
              { val: 3600, label: t('monitor.range_1h') },
            ].map((r) => (
              <button
                key={r.val}
                type="button"
                className={mergeClasses(
                  styles.rangePillBtn,
                  displayRange === r.val && styles.rangePillBtnActive
                )}
                onClick={() => setDisplayRange(r.val)}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className={styles.actionBtns}>
            <Button
              size="small"
              appearance="subtle"
              icon={isMonitoring ? <Stop24Filled style={{ color: "#ef4444" }} /> : <Play24Filled style={{ color: "#10b981" }} />}
              onClick={() => setIsMonitoring(!isMonitoring)}
              title={isMonitoring ? "暂停监控" : "开始监控"}
            />
            <Button
              size="small"
              appearance="subtle"
              icon={<ArrowDownload24Regular />}
              onClick={exportCsvManually}
              disabled={dataPoints.length === 0}
              title={t('monitor.export')}
            />
            <Button
              size="small"
              appearance="subtle"
              icon={<Image24Regular />}
              onClick={exportImage}
              disabled={dataPoints.length === 0}
              title={t('monitor.screenshot')}
            />
            <Button
              size="small"
              appearance="subtle"
              icon={<Delete24Regular />}
              onClick={clearData}
              title={t('monitor.clear')}
            />
          </div>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <TabList
          selectedValue={activeTab}
          onTabSelect={(_, data) => {
            setActiveTab(data.value as any);
            setHiddenLines([]);
          }}
          className={styles.monitorTabList}
        >
          <Tab value="cpu">{t('monitor.cpu_perf')}</Tab>
          <Tab value="memory">{t('monitor.memory')}</Tab>
          <Tab value="temperature">{t('monitor.temperature')}</Tab>
          <Tab value="power">{t('monitor.power')}</Tab>
          <Tab value="network">{t('monitor.network')}</Tab>
          <Tab value="gpu">{t('monitor.gpu')}</Tab>
        </TabList>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeTab === 'cpu' && (
            <div className={styles.subModePillGroup}>
              <button
                type="button"
                className={mergeClasses(styles.rangePillBtn, cpuDisplayMode === 'utilization' && styles.rangePillBtnActive)}
                onClick={() => setCpuDisplayMode('utilization')}
              >
                {t('monitor.utilization')}
              </button>
              <button
                type="button"
                className={mergeClasses(styles.rangePillBtn, cpuDisplayMode === 'frequency' && styles.rangePillBtnActive)}
                onClick={() => setCpuDisplayMode('frequency')}
              >
                {t('monitor.frequency')}
              </button>
            </div>
          )}
          {activeTab === 'memory' && (
            <div className={styles.subModePillGroup}>
              <button
                type="button"
                className={mergeClasses(styles.rangePillBtn, memDisplayMode === 'percent' && styles.rangePillBtnActive)}
                onClick={() => setMemDisplayMode('percent')}
              >
                {t('monitor.percentage')}
              </button>
              <button
                type="button"
                className={mergeClasses(styles.rangePillBtn, memDisplayMode === 'space' && styles.rangePillBtnActive)}
                onClick={() => setMemDisplayMode('space')}
              >
                {t('monitor.capacity')}
              </button>
            </div>
          )}
          <Button size="small" appearance="subtle" onClick={toggleCurrentTabLines}>
            {t('monitor.switching_all')}
          </Button>
        </div>
      </div>

      {dataPoints.length > 0 ? (
        <div className={styles.chartContainer} ref={chartRef}>
          {error && (
            <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', zIndex: 100, backgroundColor: 'rgba(209, 52, 56, 0.1)', color: 'var(--colorStatusDangerForeground1)', padding: '2px 12px', borderRadius: '4px', fontSize: '11px', border: '1px solid var(--colorStatusDangerBorder1)' }}>
              {t('monitor.exception', { error })}
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <LineChart data={displayedDataPoints} margin={{ top: 12, right: 24, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--colorNeutralStroke2)" opacity={0.35} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: 'var(--colorNeutralForeground4)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--colorNeutralForeground4)' }}
                axisLine={false}
                tickLine={false}
                domain={activeTab.includes('temp') || activeTab === 'power' ? ['auto', 'auto'] : [0, 'auto']}
              />
              <Tooltip content={<CustomTooltipContent />} />
              <Legend
                verticalAlign="top"
                align="center"
                height={40}
                onClick={handleLegendClick}
                content={(props) => {
                  const { payload } = props;
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '12px', gap: '8px' }}>
                      {payload?.map((entry: any, index: number) => {
                        const isHidden = hiddenLines.includes(entry.dataKey);
                        return (
                          <div
                            key={`item-${index}`}
                            className={styles.legendItem}
                            onClick={() => handleLegendClick(entry)}
                            style={{
                              opacity: isHidden ? 0.4 : 1,
                              backgroundColor: isHidden ? 'transparent' : `${entry.color}11`,
                              border: `1px solid ${isHidden ? 'transparent' : `${entry.color}33`}`
                            }}
                          >
                            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: entry.color }} />
                            <Text size={200} weight={isHidden ? "regular" : "medium"}
                              style={{ color: isHidden ? 'var(--colorNeutralForegroundDisabled)' : 'var(--colorNeutralForeground1)' }}>
                              {entry.value}
                            </Text>
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />

              {activeTab === 'cpu' && cpuDisplayMode === 'utilization' && (
                <>
                  <Line aria-label={t('monitor.total_cpu')} hide={hiddenLines.includes('totalCpuUsage')} type="monotone" dataKey="totalCpuUsage" name={t('monitor.total_line')} stroke="#0071e3" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  {cpuCoreNames.map((name, i) => (
                    <Line key={name} hide={hiddenLines.includes(name)} type="monotone" dataKey={name} name={name} stroke={COLORS[i % COLORS.length]} strokeWidth={1} dot={false} isAnimationActive={false} />
                  ))}
                </>
              )}
              {activeTab === 'cpu' && cpuDisplayMode === 'frequency' && (
                cpuCoreNames.map((name, i) => (
                  <Line key={`f_${name}`} hide={hiddenLines.includes(`freq_${name}`)} type="monotone" dataKey={`freq_${name}`} name={`${name}`} stroke={COLORS[i % COLORS.length]} dot={false} isAnimationActive={false} />
                ))
              )}
              {activeTab === 'memory' && memDisplayMode === 'percent' && (
                <>
                  <Line hide={hiddenLines.includes('memUsedPercent')} type="monotone" dataKey="memUsedPercent" name={t('monitor.used')} stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line hide={hiddenLines.includes('memFreePercent')} type="monotone" dataKey="memFreePercent" name={t('monitor.free')} stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                </>
              )}
              {activeTab === 'memory' && memDisplayMode === 'space' && (
                <>
                  <Line hide={hiddenLines.includes('memUsedGb')} type="monotone" dataKey="memUsedGb" name={t('monitor.used_gb')} stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line hide={hiddenLines.includes('memFreeGb')} type="monotone" dataKey="memFreeGb" name={t('monitor.free_gb')} stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                </>
              )}
              {activeTab === 'temperature' && (
                <>
                  <Line hide={hiddenLines.includes('cpuTemp')} type="monotone" dataKey="cpuTemp" name={t('monitor.core')} stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line hide={hiddenLines.includes('battTemp')} type="monotone" dataKey="battTemp" name={t('monitor.battery')} stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
                </>
              )}
              {activeTab === 'power' && (
                <>
                  <Line hide={hiddenLines.includes('battCap')} type="monotone" dataKey="battCap" name={t('monitor.level')} stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line hide={hiddenLines.includes('battPower')} type="monotone" dataKey="battPower" name={t('monitor.power_w')} stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
                </>
              )}
              {activeTab === 'network' && (
                <>
                  <Line hide={hiddenLines.includes('rxSpeed')} type="monotone" dataKey="rxSpeed" name={t('monitor.download_kb')} stroke="#0284c7" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line hide={hiddenLines.includes('txSpeed')} type="monotone" dataKey="txSpeed" name={t('monitor.upload_kb')} stroke="#ea580c" strokeWidth={2} dot={false} isAnimationActive={false} />
                </>
              )}
              {activeTab === 'gpu' && (
                <>
                  <Line hide={hiddenLines.includes('gpuLoad')} type="monotone" dataKey="gpuLoad" name={t('monitor.gpu_load')} stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line hide={hiddenLines.includes('gpuFreq')} type="monotone" dataKey="gpuFreq" name={t('monitor.gpu_freq')} stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: "240px", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}>
          {isMonitoring ? (
            <>
              <Spinner label={t('monitor.fetching_data')} />
              {error && <Text size={200} style={{ color: 'var(--colorStatusDangerForeground1)', marginTop: '8px' }}>错误: {error}</Text>}
            </>
          ) : <Text>{t('monitor.click_to_start')}</Text>}
        </div>
      )}

      {isMonitoring && topProcesses.length > 0 && (
        <div className={styles.processSection}>
          <div className={styles.processHeader}>
            <Text weight="semibold" size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
              系统前台与高负载进程 (Top Processes)
            </Text>
            <Text size={100} style={{ color: "var(--colorNeutralForeground4)" }}>
              采样更新
            </Text>
          </div>
          <div className={styles.processList}>
            {topProcesses.map((p, i) => (
              <div key={i} className={styles.processItem}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Text weight="semibold" truncate size={200} style={{ display: "block" }} title={p.name}>
                    {p.name.split('.').pop()}
                  </Text>
                  <Text size={100} truncate style={{ color: "var(--colorNeutralForeground4)", display: "block" }}>
                    {p.name}
                  </Text>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <Badge appearance="tint" color="brand" size="small">
                    CPU {p.cpu}%
                  </Badge>
                  <Badge appearance="tint" color="informative" size="small">
                    RAM {p.mem}MB
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default DeviceMonitorCard;
