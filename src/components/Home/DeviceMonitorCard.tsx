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

const useStyles = makeStyles({
  card: {
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflow: 'hidden',
    backgroundColor: 'var(--colorNeutralBackground1)',
    borderRadius: '12px',
    border: '1px solid var(--colorNeutralStroke2)',
    boxShadow: 'var(--shadow4)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  tabsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid var(--colorNeutralStroke2)',
    paddingBottom: '8px',
  },
  chartContainer: {
    flex: 1,
    minHeight: '380px',
    position: 'relative',
    backgroundColor: 'var(--colorNeutralBackground1)',
    borderRadius: '8px',
    padding: '10px',
  },
  controls: {
    display: 'flex',
    gap: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginRight: '16px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'background 0.2s',
    '&:hover': {
      backgroundColor: 'var(--colorNeutralBackground3)',
    }
  },
  customTooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--colorNeutralStroke1)',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: 'var(--shadow16)',
    '@media (prefers-color-scheme: dark)': {
      backgroundColor: 'rgba(28, 28, 28, 0.9)',
    }
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

const DeviceMonitorCard: React.FC = () => {
  const styles = useStyles();
  const { config } = useAppStore();
  const { selectedDevice } = useDeviceStore();
  
  const [isMonitoring, setIsMonitoring] = useState(config.monitorAutoStart);
  const [dataPoints, setDataPoints] = useState<MonitorDataPoint[]>([]);
  const [activeTab, setActiveTab] = useState<'cpu' | 'memory' | 'temperature' | 'power'>('cpu');
  const [cpuDisplayMode, setCpuDisplayMode] = useState<'utilization' | 'frequency'>('utilization');
  const [memDisplayMode, setMemDisplayMode] = useState<'percent' | 'space'>('percent');
  const [hiddenLines, setHiddenLines] = useState<string[]>([]);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const csvFileRef = useRef<string | null>(null);
  
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
    }

    const allHidden = currentKeys.every(k => hiddenLines.includes(k));
    if (allHidden) {
      setHiddenLines(prev => prev.filter(k => !currentKeys.includes(k)));
    } else {
      setHiddenLines(prev => Array.from(new Set([...prev, ...currentKeys])));
    }
  };

  // 监控循环
  useEffect(() => {
    let timer: any;
    if (isMonitoring && selectedDevice) {
      const fetchData = async () => {
        try {
          const res: any = await invoke('get_device_realtime_monitor_data', { serial: selectedDevice.serial });
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          
          const newDataPoint: MonitorDataPoint = {
            time: timeStr,
            timestamp: res.timestamp,
            totalCpuUsage: res.cpu.total_usage,
            ...res.cpu.core_usages.reduce((acc: any, val: number, i: number) => ({ ...acc, [`cpu${i}`]: val }), {}),
            ...Object.entries(res.cpu.frequencies).reduce((acc: any, [key, val]: [string, any]) => ({ ...acc, [`freq_${key}`]: val }), {}),
            memUsedPercent: ((res.memory.total - res.memory.available) / res.memory.total) * 100,
            memFreePercent: (res.memory.available / res.memory.total) * 100,
            memUsedGb: (res.memory.total - res.memory.available) / 1024 / 1024,
            memFreeGb: res.memory.available / 1024 / 1024,
            cpuTemp: res.temperature.cpu,
            battTemp: res.temperature.battery,
            battCap: res.battery.level,
            battPower: (Math.abs(res.battery.current) / 1000000) * (res.battery.voltage / 1000000), // W
          };

          setDataPoints(prev => {
            const next = [...prev, newDataPoint];
            return next.length > 50 ? next.slice(next.length - 50) : next;
          });

          // 自动导出 CSV
          if (config.monitorAutoCsvExport) {
            handleAutoCsvWrite(newDataPoint);
          }
        } catch (e) {
          console.error("Monitor failed:", e);
        }
        timer = setTimeout(fetchData, config.cpuMonitorInterval);
      };
      fetchData();
    }
    return () => clearTimeout(timer);
  }, [isMonitoring, selectedDevice, config.cpuMonitorInterval]);

  // 处理 CSV 自动写入
  const handleAutoCsvWrite = async (data: MonitorDataPoint) => {
    try {
      if (!csvFileRef.current) {
        const docDir = await documentDir();
        const admtDir = await join(docDir, 'admt');
        const fname = `monitor_${selectedDevice?.serial}_${Date.now()}.csv`;
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
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
              <div style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: entry.color }} />
              <Text size={200}>{entry.name}: </Text>
              <Text weight="bold" size={200} style={{ fontFamily: 'Consolas' }}>{entry.value.toFixed(1)}</Text>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Pulse24Regular color="var(--colorBrandForeground1)" />
          <Text weight="bold" size={500}>硬件实时监控</Text>
          {isMonitoring && <Badge appearance="filled" color="success" size="small" style={{ borderRadius: '4px' }}>LIVE</Badge>}
        </div>
        <div className={styles.controls}>
          <Button 
            icon={isMonitoring ? <Stop24Filled /> : <Play24Filled />}
            appearance={isMonitoring ? "subtle" : "primary"}
            onClick={() => setIsMonitoring(!isMonitoring)}
            size="medium"
          >
            {isMonitoring ? "停止" : "启动"}
          </Button>
          <Button icon={<ArrowDownload24Regular />} onClick={exportCsvManually} disabled={dataPoints.length === 0}>导出</Button>
          <Button icon={<Image24Regular />} onClick={exportImage} disabled={dataPoints.length === 0}>截图</Button>
          <Button icon={<Delete24Regular />} onClick={clearData} appearance="transparent">清空</Button>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <TabList 
          selectedValue={activeTab} 
          onTabSelect={(_, data) => {
            setActiveTab(data.value as any);
            setHiddenLines([]);
          }}
          appearance="subtle"
        >
          <Tab value="cpu">CPU性能</Tab>
          <Tab value="memory">运行内存</Tab>
          <Tab value="temperature">实时温度</Tab>
          <Tab value="power">电量与功率</Tab>
        </TabList>

        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === 'cpu' && (
            <div style={{ display: 'flex', backgroundColor: 'var(--colorNeutralBackground3)', padding: '2px', borderRadius: '8px' }}>
              <Button size="small" appearance={cpuDisplayMode === 'utilization' ? "secondary" : "transparent"} onClick={() => setCpuDisplayMode('utilization')}>利用率</Button>
              <Button size="small" appearance={cpuDisplayMode === 'frequency' ? "secondary" : "transparent"} onClick={() => setCpuDisplayMode('frequency')}>频率</Button>
            </div>
          )}
          {activeTab === 'memory' && (
            <div style={{ display: 'flex', backgroundColor: 'var(--colorNeutralBackground3)', padding: '2px', borderRadius: '8px' }}>
              <Button size="small" appearance={memDisplayMode === 'percent' ? "secondary" : "transparent"} onClick={() => setMemDisplayMode('percent')}>百分比</Button>
              <Button size="small" appearance={memDisplayMode === 'space' ? "secondary" : "transparent"} onClick={() => setMemDisplayMode('space')}>容量</Button>
            </div>
          )}
        </div>
      </div>

      {dataPoints.length > 0 ? (
        <div className={styles.chartContainer} ref={chartRef}>
          <div style={{ position: 'absolute', right: 16, top: 8, zIndex: 10 }}>
             <Button size="small" appearance="subtle" onClick={toggleCurrentTabLines}>
               切换全部
             </Button>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataPoints} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--colorNeutralStroke2)" opacity={0.3} />
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '16px', gap: '8px' }}>
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
                  <Line hide={hiddenLines.includes('totalCpuUsage')} type="monotone" dataKey="totalCpuUsage" name="总线" stroke="#3a7bd5" strokeWidth={3} dot={false} isAnimationActive={false} />
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
                  <Line hide={hiddenLines.includes('memUsedPercent')} type="monotone" dataKey="memUsedPercent" name="已用" stroke="#f2994a" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line hide={hiddenLines.includes('memFreePercent')} type="monotone" dataKey="memFreePercent" name="空闲" stroke="#107c10" strokeWidth={2} dot={false} isAnimationActive={false} />
                </>
              )}
              {activeTab === 'memory' && memDisplayMode === 'space' && (
                <>
                  <Line hide={hiddenLines.includes('memUsedGb')} type="monotone" dataKey="memUsedGb" name="已用(GB)" stroke="#f2994a" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line hide={hiddenLines.includes('memFreeGb')} type="monotone" dataKey="memFreeGb" name="空闲(GB)" stroke="#107c10" strokeWidth={2} dot={false} isAnimationActive={false} />
                </>
              )}
              {activeTab === 'temperature' && (
                <>
                  <Line hide={hiddenLines.includes('cpuTemp')} type="monotone" dataKey="cpuTemp" name="核心" stroke="#eb3349" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line hide={hiddenLines.includes('battTemp')} type="monotone" dataKey="battTemp" name="电池" stroke="#ffaa00" strokeWidth={2} dot={false} isAnimationActive={false} />
                </>
              )}
              {activeTab === 'power' && (
                <>
                  <Line hide={hiddenLines.includes('battCap')} type="monotone" dataKey="battCap" name="电量" stroke="#107c10" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line hide={hiddenLines.includes('battPower')} type="monotone" dataKey="battPower" name="功率" stroke="#5c2d91" strokeWidth={2} dot={false} isAnimationActive={false} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
          {isMonitoring ? <Spinner label="正在抓取设备状态..." /> : <Text>点击“启动监控”开始记录硬件指标</Text>}
        </div>
      )}
    </Card>
  );
};

export default DeviceMonitorCard;
