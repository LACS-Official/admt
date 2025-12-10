/*
ROM下载面板组件
*/
import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Button,
  Input,
  Spinner,
  Body1,
  Caption1,
  Title2,
  Card,
  CardHeader,
  Badge,
  Toast,
  ToastTitle,
  ToastBody,
  useToastController,
} from '@fluentui/react-components';
import {
  Phone24Regular,
  Search24Regular,
  ArrowDownload24Regular,
  ErrorCircle24Filled,
  Edit24Regular,
} from '@fluentui/react-icons';
import { useDeviceStore } from '../../stores/deviceStore';
import { useRomDownloadStore } from '../../stores/romDownloadStore';
import { RomInfo } from '../../types/rom';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '16px',
    gap: '16px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  deviceSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  deviceCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'var(--colorNeutralBackground1)',
    borderRadius: '8px',
    border: '1px solid var(--colorNeutralStroke2)',
  },
  deviceInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  inputSection: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  inputContainer: {
    flex: 1,
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  deviceInput: {
    flex: 1,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  romGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '16px',
    padding: '8px 0',
  },
  romCard: {
    height: 'auto',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  romContent: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  romTitle: {
    fontWeight: '600',
    fontSize: '14px',
    lineHeight: '1.3',
    marginBottom: '4px',
  },
  romDescription: {
    fontSize: '12px',
    color: 'var(--colorNeutralForeground2)',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  romInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  versionBadge: {
    fontSize: '10px',
  },
  tagContainer: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  tag: {
    fontSize: '10px',
    padding: '2px 6px',
  },
  downloadSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid var(--colorNeutralStroke2)',
  },
  downloadButton: {
    fontSize: '12px',
    minWidth: '80px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    textAlign: 'center',
    gap: '12px',
  },
  downloadProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
  },
  errorMessage: {
    color: 'var(--colorPaletteRedForeground1)',
    fontSize: '12px',
    textAlign: 'center',
    padding: '16px',
    backgroundColor: 'var(--colorPaletteRedBackground1)',
    borderRadius: '4px',
    border: '1px solid var(--colorPaletteRedBorder1)',
  },
  toggleButton: {
    fontSize: '12px',
    minWidth: '100px',
  },
});

const RomDownloadPanel: React.FC = () => {
  const styles = useStyles();
  const { dispatchToast } = useToastController('rom-download-toast');
  
  // 设备状态
  const { selectedDevice } = useDeviceStore();
  
  // ROM下载状态
  const {
    deviceCode,
    isManualInput,
    romList,
    loading,
    error,
    downloading,
    downloadProgress,
    currentDownload,
    setDeviceCode,
    setManualInput,
    setError,
    fetchRomList,
    downloadRom,
  } = useRomDownloadStore();
  
  // 本地状态
  const [inputDeviceCode, setInputDeviceCode] = useState('');
  const [token, setToken] = useState('');
  
  // 初始化设备代号
  useEffect(() => {
    if (selectedDevice && selectedDevice.properties?.deviceName && !isManualInput) {
      const detectedDeviceCode = selectedDevice.properties.deviceName;
      setDeviceCode(detectedDeviceCode);
      setInputDeviceCode(detectedDeviceCode);
    }
  }, [selectedDevice, isManualInput, setDeviceCode]);
  
  // 搜索ROM列表
  const handleSearch = async () => {
    const codeToSearch = isManualInput ? inputDeviceCode.trim() : deviceCode;
    if (!codeToSearch) {
      setError('请输入设备代号');
      return;
    }
    
    setDeviceCode(codeToSearch);
    await fetchRomList(codeToSearch, token.trim());
  };
  
  // 切换到手动输入模式
  const toggleManualInput = () => {
    const newManualState = !isManualInput;
    setManualInput(newManualState);
    
    if (newManualState) {
      // 切换到手动输入模式，清空设备代号
      setInputDeviceCode(deviceCode);
    } else {
      // 切换到自动检测模式，恢复检测到的设备代号
      if (selectedDevice && selectedDevice.properties?.deviceName) {
        setDeviceCode(selectedDevice.properties.deviceName);
        setInputDeviceCode(selectedDevice.properties.deviceName);
      }
    }
  };
  
  // 下载ROM
  const handleDownloadRom = async (rom: RomInfo) => {
    if (!token.trim()) {
      dispatchToast(
        <Toast>
          <ToastTitle>下载失败</ToastTitle>
          <ToastBody>请先输入认证令牌</ToastBody>
        </Toast>,
        { intent: 'error', position: 'bottom-end' }
      );
      return;
    }
    
    const success = await downloadRom(rom, token.trim());
    
    if (success) {
      dispatchToast(
        <Toast>
          <ToastTitle>下载成功</ToastTitle>
          <ToastBody>ROM已下载至 downloads/roms 目录</ToastBody>
        </Toast>,
        { intent: 'success', position: 'bottom-end' }
      );
    } else {
      dispatchToast(
        <Toast>
          <ToastTitle>下载失败</ToastTitle>
          <ToastBody>请检查网络连接和令牌是否有效</ToastBody>
        </Toast>,
        { intent: 'error', position: 'bottom-end' }
      );
    }
  };
  
  // 渲染设备信息卡片
  const renderDeviceCard = () => {
    if (!selectedDevice || !selectedDevice.properties) {
      return (
        <div className={styles.deviceCard}>
          <Phone24Regular />
          <div className={styles.deviceInfo}>
            <Body1>未检测到设备</Body1>
            <Caption1>请连接设备或手动输入设备代号</Caption1>
          </div>
        </div>
      );
    }
    
    const { properties } = selectedDevice;
    
    return (
      <div className={styles.deviceCard}>
        <Phone24Regular />
        <div className={styles.deviceInfo}>
          <Body1>{properties.marketName || properties.productName || '未知设备'}</Body1>
          <Caption1>设备代号: {properties.deviceName || '未知'}</Caption1>
          <Caption1>Android版本: {properties.androidVersion || '未知'}</Caption1>
          <Caption1>MIUI版本: {properties.miuiVersion || '未知'}</Caption1>
        </div>
      </div>
    );
  };
  
  // 渲染ROM卡片
  const renderRomCard = (rom: RomInfo) => {
    return (
      <Card key={rom.id} className={styles.romCard}>
        <CardHeader
          header={
            <div className={styles.romTitle}>
              {rom.version}
            </div>
          }
          description={
            <div className={styles.romDescription}>
              {rom.description || `${rom.codename} - ${rom.rom_type}`}
            </div>
          }
        />
        <div className={styles.romContent}>
          <div className={styles.romInfo}>
            <Badge appearance="outline" className={styles.versionBadge}>
              {rom.rom_type}
            </Badge>
            <Caption1>大小: {rom.size}</Caption1>
            <Caption1>日期: {rom.date}</Caption1>
          </div>
          
          {(rom.android_version || rom.miui_version) && (
            <div className={styles.tagContainer}>
              {rom.android_version && (
                <Badge appearance="tint" color="brand" className={styles.tag}>
                  Android {rom.android_version}
                </Badge>
              )}
              {rom.miui_version && (
                <Badge appearance="tint" color="success" className={styles.tag}>
                  MIUI {rom.miui_version}
                </Badge>
              )}
            </div>
          )}
          
          <div className={styles.downloadSection}>
            <div className={styles.downloadProgress}>
              {downloading && currentDownload === `${rom.version} (${rom.rom_type})` ? (
                <>
                  <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--colorNeutralBackground3)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${downloadProgress}%`, height: '100%', backgroundColor: 'var(--colorBrandBackground)', transition: 'width 0.3s ease' }} />
                  </div>
                  <Caption1>{downloadProgress}%</Caption1>
                </>
              ) : null}
            </div>
            
            <Button
              className={styles.downloadButton}
              icon={<ArrowDownload24Regular />}
              onClick={() => handleDownloadRom(rom)}
              disabled={downloading}
              size="small"
            >
              {downloading && currentDownload === `${rom.version} (${rom.rom_type})` ? '下载中...' : '下载'}
            </Button>
          </div>
        </div>
      </Card>
    );
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title2>ROM下载</Title2>
      </div>
      
      {/* 设备信息部分 */}
      <div className={styles.deviceSection}>
        {renderDeviceCard()}
        
        <Button
          className={styles.toggleButton}
          icon={<Edit24Regular />}
          onClick={toggleManualInput}
          appearance="subtle"
          size="small"
        >
          {isManualInput ? '使用自动检测' : '手动输入设备代号'}
        </Button>
      </div>
      
      {/* 输入部分 */}
      <div className={styles.inputSection}>
        <div className={styles.inputContainer}>
          <Input
            className={styles.deviceInput}
            placeholder="请输入设备代号"
            value={isManualInput ? inputDeviceCode : deviceCode}
            onChange={(_, data) => {
              if (isManualInput) {
                setInputDeviceCode(data.value);
              } else {
                setDeviceCode(data.value);
              }
            }}
            disabled={!isManualInput && !!deviceCode}
          />
        </div>
        
        <Input
          placeholder="请输入认证令牌"
          value={token}
          onChange={(_, data) => setToken(data.value)}
          type="password"
          style={{ width: '200px' }}
        />
        
        <Button
          icon={<Search24Regular />}
          onClick={handleSearch}
          disabled={loading}
        >
          搜索
        </Button>
      </div>
      
      {/* 内容部分 */}
      <div className={styles.content}>
        {error && (
          <div className={styles.errorMessage}>
            <ErrorCircle24Filled style={{ marginRight: '8px' }} />
            {error}
          </div>
        )}
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spinner label="正在获取ROM列表..." />
          </div>
        ) : romList.length === 0 ? (
          <div className={styles.emptyContainer}>
            <ArrowDownload24Regular style={{ fontSize: '48px', color: 'var(--colorNeutralForeground3)' }} />
            <Body1>暂无可用的ROM版本</Body1>
            <Caption1>请检查设备代号是否正确或稍后再试</Caption1>
          </div>
        ) : (
          <div className={styles.romGrid}>
            {romList.map(renderRomCard)}
          </div>
        )}
      </div>
    </div>
  );
};

export default RomDownloadPanel;