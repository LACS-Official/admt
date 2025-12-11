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
  ArrowClockwise24Regular,
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
  deviceInputRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    marginBottom: '16px',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: '12px',
    },
  },
  deviceSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: '0',
  },
  searchSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: '0',
  },
  deviceCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'var(--colorNeutralBackground1)',
    borderRadius: '8px',
    border: '1px solid var(--colorNeutralStroke2)',
    position: 'relative',
    overflow: 'hidden',
  },
  deviceCardToggle: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    zIndex: 10,
  },
  deviceInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
    
  },
  refreshButton: {
    flexShrink: 0,
  },
  cardTransition: {
    transition: 'all 0.3s ease-in-out',
    opacity: 1,
    transform: 'translateX(0)',
  },
  cardTransitionExit: {
    opacity: 0,
    transform: 'translateX(-20px)',
  },
  cardTransitionEnter: {
    opacity: 0,
    transform: 'translateX(20px)',
  },
  inputSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: '0',
  },
  inputContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  deviceInput: {
    flex: 1,
  },
  manualInputCard: {
    padding: '12px',
    backgroundColor: 'var(--colorNeutralBackground1)',
    borderRadius: '8px',
    border: '1px solid var(--colorNeutralStroke2)',
  },
  manualDeviceForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  formField: {
    flex: 1,
  },
  formLabel: {
    fontSize: '12px',
    color: 'var(--colorNeutralForeground2)',
    marginBottom: '4px',
  },
  searchCard: {
    padding: '12px',
    backgroundColor: 'var(--colorNeutralBackground1)',
    borderRadius: '8px',
    border: '1px solid var(--colorNeutralStroke2)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  searchTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  searchInput: {
    marginBottom: '8px',
  },
  filterSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filterTitle: {
    fontSize: '12px',
    color: 'var(--colorNeutralForeground2)',
    marginBottom: '4px',
  },
  filterOptions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  filterOption: {
    fontSize: '11px',
  },
  searchButton: {
    marginTop: '8px',
  },
  highlightedText: {
    backgroundColor: 'var(--colorBrandBackground2)',
    padding: '0 2px',
    borderRadius: '2px',
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
    margin: '0 1px',
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
    downloading: _downloading,
    downloadProgress: _downloadProgress,
    currentDownload: _currentDownload,
    token,
    manualDeviceInfo,
    isManualDeviceMode,
    setDeviceCode,
    setManualInput,
    setError,
    setManualDeviceInfo,
    setIsManualDeviceMode,
    fetchRomList,
    downloadRom,
    reset: _reset
  } = useRomDownloadStore();
  
  // 本地状态
  const [inputDeviceCode, setInputDeviceCode] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [excludeFeatures, setExcludeFeatures] = useState<string[]>([]);
  const [filteredRomList, setFilteredRomList] = useState<RomInfo[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // 初始化设备代号
  useEffect(() => {
    if (selectedDevice && selectedDevice.properties?.deviceName && !isManualInput) {
      const detectedDeviceCode = selectedDevice.properties.deviceName;
      setDeviceCode(detectedDeviceCode);
      setInputDeviceCode(detectedDeviceCode);
    }
  }, [selectedDevice, isManualInput, setDeviceCode]);
  
  // 切换设备信息获取模式
  const toggleDeviceMode = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsManualDeviceMode(!isManualDeviceMode);
      setIsTransitioning(false);
    }, 300);
  };

  // 获取设备代号的ROM列表
  const refreshDeviceInfo = async () => {
    if (!selectedDevice || !selectedDevice.properties?.deviceName) {
      console.log('无法获取设备代号');
      return;
    }
    
    try {
      const deviceCode = selectedDevice.properties.deviceName;
      console.log(`正在获取设备 ${deviceCode} 的ROM列表`);
      console.log(`使用token: ${token}`);
      
      setDeviceCode(deviceCode);
      await fetchRomList(deviceCode, token);
      
      console.log(`成功获取设备 ${deviceCode} 的ROM列表`);
    } catch (error) {
      console.error('获取ROM列表失败:', error);
    }
  };
  
  // 处理手动输入设备信息变化
  const handleManualDeviceInfoChange = (field: string, value: string) => {
    setManualDeviceInfo({
      ...manualDeviceInfo,
      [field]: value
    });
  };
  
  // 处理排除特性切换
  const _handleExcludeFeatureToggle = (feature: string) => {
    setExcludeFeatures(prev => {
      if (prev.includes(feature)) {
        return prev.filter(f => f !== feature);
      } else {
        return [...prev, feature];
      }
    });
  };
  
  // 执行搜索和筛选
  const handleSearchAndFilter = () => {
    if (!searchQuery.trim() && excludeFeatures.length === 0) {
      setFilteredRomList([]);
      setIsSearchActive(false);
      return;
    }
    
    let filtered = [...romList];
    
    // 按版本号搜索
    if (searchQuery.trim()) {
      filtered = filtered.filter(rom => 
        rom.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rom.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rom.codename?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 排除特定功能
    if (excludeFeatures.length > 0) {
      filtered = filtered.filter(rom => {
        return !excludeFeatures.some(feature => {
          const featureLower = feature.toLowerCase();
          return (
            rom.description?.toLowerCase().includes(featureLower) ||
            rom.version.toLowerCase().includes(featureLower) ||
            rom.rom_type.toLowerCase().includes(featureLower)
          );
        });
      });
    }
    
    setFilteredRomList(filtered);
    setIsSearchActive(true);
  };
  
  // 重置搜索
  const handleResetSearch = () => {
    setSearchQuery('');
    setExcludeFeatures([]);
    setFilteredRomList([]);
    setIsSearchActive(false);
  };
  
  // 高亮搜索关键词
  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className={styles.highlightedText}>{part}</span>
      ) : part
    );
  };
  
  // 搜索ROM列表
  const handleSearch = async () => {
    let codeToSearch = '';
    
    if (isManualDeviceMode) {
      // 使用手动输入的设备代号
      codeToSearch = manualDeviceInfo.deviceName.trim();
      
      // 验证设备代号
      if (!codeToSearch) {
        setError('请输入设备代号');
        return;
      }
      
      if (codeToSearch.length < 3) {
        setError('设备代号至少需要3个字符');
        return;
      }
      
      // 验证设备代号格式（只允许字母、数字和下划线）
      if (!/^[a-zA-Z0-9_]+$/.test(codeToSearch)) {
        setError('设备代号只能包含字母、数字和下划线');
        return;
      }
    } else {
      // 使用原有的逻辑
      codeToSearch = isManualInput ? inputDeviceCode.trim() : deviceCode;
      
      if (!codeToSearch) {
        setError('请输入设备代号');
        return;
      }
    }
    
    // 清除之前的错误
    setError(null);
    setDeviceCode(codeToSearch);
    
    try {
      await fetchRomList(codeToSearch, token.trim());
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '获取ROM列表失败';
      setError(errorMsg);
    }
  };
  
  // 切换到手动输入模式
  const _toggleManualInput = () => {
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
  const _handleDownloadRom = async (rom: RomInfo) => {
    // 验证token
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
    
    // 验证token格式（简单验证）
    if (token.length < 8) {
      dispatchToast(
        <Toast>
          <ToastTitle>下载失败</ToastTitle>
          <ToastBody>认证令牌格式不正确</ToastBody>
        </Toast>,
        { intent: 'error', position: 'bottom-end' }
      );
      return;
    }
    
    try {
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
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '下载过程中发生未知错误';
      dispatchToast(
        <Toast>
          <ToastTitle>下载失败</ToastTitle>
          <ToastBody>{errorMsg}</ToastBody>
        </Toast>,
        { intent: 'error', position: 'bottom-end' }
      );
    }
  };
  
  // 渲染搜索卡片
  const renderSearchCard = () => {
    return (
      <div className={styles.searchCard}>
        <div className={styles.searchTitle}>版本搜索与筛选</div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className={styles.searchInput} style={{ flex: 1 }}>
            <Input
              placeholder="输入ROM版本号或关键词搜索"
              value={searchQuery}
              onChange={(_, data) => setSearchQuery(data.value)}
              size="medium"
            />
          </div>
          
          <Button
            className={styles.searchButton}
            icon={<Search24Regular />}
            onClick={handleSearchAndFilter}
            disabled={loading}
            size="medium"
            appearance="primary"
          >
            搜索
          </Button>
          
          {isSearchActive && (
            <Button
              className={styles.searchButton}
              onClick={handleResetSearch}
              size="small"
              appearance="subtle"
            >
              重置
            </Button>
          )}
        </div>
        
        {isSearchActive && (
          <div style={{ fontSize: '12px', color: 'var(--colorNeutralForeground2)' }}>
            找到 {filteredRomList.length} 个结果
          </div>
        )}
      </div>
    );
  };
  
  // 渲染手动输入设备信息卡片
  const renderManualDeviceCard = () => {
    return (
      <div className={styles.deviceCard}>
        <Button
          className={styles.deviceCardToggle}
          icon={<Edit24Regular />}
          onClick={toggleDeviceMode}
          appearance="subtle"
          size="small"
          title="切换到自动获取"
        />
        
        <Phone24Regular />
        <div className={styles.deviceInfo}>
          <div className={styles.manualDeviceForm}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div className={styles.formField} style={{ flex: 1 }}>
                <div className={styles.searchTitle}>手动输入设备信息</div>
                <div className={styles.formLabel}>设备代号</div>
                <Input
                  placeholder="请输入设备代号"
                  value={manualDeviceInfo.deviceName}
                  onChange={(_, data) => handleManualDeviceInfoChange('deviceName', data.value)}
                  size="small"
                />
                {manualDeviceInfo.deviceName && manualDeviceInfo.deviceName.trim().length < 3 && (
                  <div style={{ fontSize: '12px', color: 'var(--colorPaletteRedForeground1)', marginTop: '4px' }}>
                    设备代号至少需要3个字符
                  </div>
                )}
              </div>
              <Button
                icon={<Search24Regular />}
                onClick={handleSearch}
                disabled={!manualDeviceInfo.deviceName.trim() || manualDeviceInfo.deviceName.trim().length < 3 || loading}
                size="small"
                appearance="primary"
              >
                获取ROM列表
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // 渲染设备信息卡片
  const renderDeviceCard = () => {
    if (!selectedDevice || !selectedDevice.properties) {
      return (
        <div className={styles.deviceCard}>
          <Button
            className={styles.deviceCardToggle}
            icon={<Edit24Regular />}
            onClick={toggleDeviceMode}
            appearance="subtle"
            size="small"
            title="切换到手动输入"
          />
          <Phone24Regular />
          <div className={styles.deviceInfo}>
            <div className={styles.searchTitle}>未检测到设备</div>
            <Caption1>请连接设备或手动输入设备代号</Caption1>
            <Caption1>若需手动输入，请点击切换按钮</Caption1>
          </div>
        </div>
      );
    }
    
    const { properties } = selectedDevice;
    
    return (
      <div className={styles.deviceCard}>
        <Button
          className={styles.deviceCardToggle}
          icon={<Edit24Regular />}
          onClick={toggleDeviceMode}
          appearance="subtle"
          size="small"
          title="切换到手动输入"
        />
        <div className={styles.deviceInfo}>
          <div className={styles.searchTitle}>自动获取当前设备</div>
          <Body1>{properties.marketName || properties.productName || '未知设备'}</Body1>
          <Caption1>设备代号: {properties.deviceName || '未知'}</Caption1>
        </div>
        <Button
          className={styles.refreshButton}
          icon={<ArrowClockwise24Regular />}
          onClick={refreshDeviceInfo}
          appearance="subtle"
          size="small"
          title="获取设备信息"
        />
      </div>
    );
  };
  
  // 渲染ROM卡片
  const renderRomCard = (rom: RomInfo) => {
    const displayVersion = isSearchActive ? highlightText(rom.version) : rom.version;
    const displayDescription = isSearchActive ? highlightText(rom.description || `${rom.codename} -`) : (rom.description || `${rom.codename}`);
    
    return (
      <Card key={rom.id} className={styles.romCard}>
        <CardHeader
          header={
            <div className={styles.romTitle}>
              {displayVersion}
            </div>
          }
          description={
            <div className={styles.romDescription}>
              {displayDescription}
            </div>
          }
        />
        <div className={styles.romContent}>
          
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
        
        </div>
      </Card>
    );
  };
  
  return (
    <div className={styles.container}>
      {/* 设备信息与搜索水平行 */}
      <div className={styles.deviceInputRow}>
        {/* 左侧：设备信息部分 */}
        <div className={styles.deviceSection}>
          <div className={`${styles.cardTransition} ${isTransitioning ? styles.cardTransitionExit : ''}`}>
            {!isManualDeviceMode ? renderDeviceCard() : renderManualDeviceCard()}
          </div>
        </div>
        
        {/* 右侧：搜索部分 */}
        <div className={styles.searchSection}>
          {renderSearchCard()}
        </div>
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
        ) : isSearchActive ? (
          filteredRomList.length === 0 ? (
            <div className={styles.emptyContainer}>
              <Search24Regular style={{ fontSize: '48px', color: 'var(--colorNeutralForeground3)' }} />
              <Body1>未找到匹配的ROM版本</Body1>
              <Caption1>请尝试调整搜索条件或重置筛选</Caption1>
            </div>
          ) : (
            <div className={styles.romGrid}>
              {filteredRomList.map(renderRomCard)}
            </div>
          )
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