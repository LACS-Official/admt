import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Button,
  Badge,
  Divider,
  Body1,
  Caption1,
  Title3,
  Subtitle1,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  Spinner,
  Image,
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  Info24Regular,
  DocumentText24Regular,
  History24Regular,
  Folder24Regular,
} from '@fluentui/react-icons';
import { OnlineSoftware } from '../../types/app';
import { onlineResourcesService } from '../../services/onlineResourcesService';

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '800px',
    width: '90vw',
    maxHeight: '90vh',
    overflow: 'hidden',
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: '70vh',
    overflow: 'hidden',
  },
  tabContent: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 0',
  },
  headerSection: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '8px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  softwareIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '6px',
  },
  headerInfo: {
    flex: 1,
  },
  softwareName: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  softwareDescription: {
    color: 'var(--colorNeutralForeground2)',
    marginBottom: '12px',
    lineHeight: '1.4',
  },
  badgeContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontWeight: '600',
    color: 'var(--colorNeutralForeground2)',
    fontSize: '12px',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: 'var(--colorNeutralForeground1)',
  },
  versionHistory: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  versionItem: {
    padding: '12px',
    border: '1px solid var(--colorNeutralStroke2)',
    borderRadius: '6px',
    backgroundColor: 'var(--colorNeutralBackground1)',
  },
  versionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  versionNumber: {
    fontWeight: '600',
    color: 'var(--colorBrandForeground1)',
  },
  versionDate: {
    fontSize: '12px',
    color: 'var(--colorNeutralForeground2)',
  },
  versionChanges: {
    fontSize: '14px',
    lineHeight: '1.4',
    color: 'var(--colorNeutralForeground1)',
  },
  fileDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fileCard: {
    padding: '16px',
    border: '1px solid var(--colorNeutralStroke2)',
    borderRadius: '8px',
    backgroundColor: 'var(--colorNeutralBackground1)',
  },
  fileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  fileName: {
    fontWeight: '600',
    fontSize: '16px',
  },
  fileSize: {
    fontSize: '14px',
    color: 'var(--colorNeutralForeground2)',
  },
  fileInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  },
  downloadSection: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    borderRadius: '8px',
  },
  downloadHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  downloadButton: {
    minWidth: '120px',
  },
  installInstructions: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    borderRadius: '8px',
  },
  instructionStep: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'var(--colorBrandBackground)',
    color: 'var(--colorNeutralForegroundOnBrand)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  linkContainer: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginTop: '12px',
  },
  linkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    border: '1px solid var(--colorNeutralStroke2)',
    borderRadius: '6px',
    backgroundColor: 'var(--colorNeutralBackground1)',
    textDecoration: 'none',
    color: 'var(--colorNeutralForeground1)',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--colorNeutralBackground1Hover)',
    },
  },
});

interface ResourceDetailModalProps {
  software: OnlineSoftware;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (software: OnlineSoftware) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  software,
  isOpen,
  onClose,
}) => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  const [] = useState(false);
  const [detailData, setDetailData] = useState<OnlineSoftware | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取软件详细信息
  const fetchSoftwareDetail = async () => {
    if (!software.id) return;

    setLoading(true);
    try {
      const detail = await onlineResourcesService.getSoftwareDetail(software.id);
      if (detail) {
        setDetailData(detail);
      }
    } catch (error) {
      console.error('获取软件详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 当弹窗打开时获取详细信息
  useEffect(() => {
    if (isOpen && software.id) {
      fetchSoftwareDetail();
    }
  }, [isOpen, software.id]);

  // 处理下载

  // 格式化文件大小
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '未知大小';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // 处理标签切换
  const handleTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as string);
  };

  // 渲染概览标签页
  const renderOverviewTab = () => {
    const currentData = detailData || software;

    return (
      <div className={styles.tabContent}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <Spinner label="正在加载详细信息..." />
          </div>
        )}

        {/* 基本信息 */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Caption1 className={styles.infoLabel}>当前版本</Caption1>
            <Text className={styles.infoValue}>v{currentData.currentVersion}</Text>
          </div>

          {currentData.category && (
            <div className={styles.infoItem}>
              <Caption1 className={styles.infoLabel}>软件分类</Caption1>
              <Text className={styles.infoValue}>{currentData.category}</Text>
            </div>
          )}

          {currentData.metadata?.developer && (
            <div className={styles.infoItem}>
              <Caption1 className={styles.infoLabel}>开发者</Caption1>
              <Text className={styles.infoValue}>{currentData.metadata.developer}</Text>
            </div>
          )}

          {currentData.filetype && (
            <div className={styles.infoItem}>
              <Caption1 className={styles.infoLabel}>文件类型</Caption1>
              <Text className={styles.infoValue}>{currentData.filetype.toUpperCase()}</Text>
            </div>
          )}

          <div className={styles.infoItem}>
            <Caption1 className={styles.infoLabel}>更新时间</Caption1>
            <Text className={styles.infoValue}>{formatDate(currentData.updatedAt)}</Text>
          </div>
        </div>

        {/* 软件描述 */}
        {currentData.description && (
          <>
            <Divider style={{ margin: '20px 0' }} />
            <div>
              <Subtitle1 style={{ marginBottom: '12px' }}>软件描述</Subtitle1>
              <Body1>{currentData.description}</Body1>
            </div>
          </>
        )}

        {/* 系统要求 */}
        {currentData.systemRequirements && (
          <>
            <Divider style={{ margin: '20px 0' }} />
            <div>
              <Subtitle1 style={{ marginBottom: '12px' }}>系统要求</Subtitle1>
              <div className={styles.infoGrid}>
                {currentData.systemRequirements.os && (
                  <div className={styles.infoItem}>
                    <Caption1 className={styles.infoLabel}>操作系统</Caption1>
                    <Text className={styles.infoValue}>{currentData.systemRequirements.os.join(', ')}</Text>
                  </div>
                )}
                {currentData.systemRequirements.memory && (
                  <div className={styles.infoItem}>
                    <Caption1 className={styles.infoLabel}>内存要求</Caption1>
                    <Text className={styles.infoValue}>{currentData.systemRequirements.memory}</Text>
                  </div>
                )}
                {currentData.systemRequirements.storage && (
                  <div className={styles.infoItem}>
                    <Caption1 className={styles.infoLabel}>存储空间</Caption1>
                    <Text className={styles.infoValue}>{currentData.systemRequirements.storage}</Text>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };



  // 渲染版本历史标签页
  const renderVersionHistoryTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.versionHistory}>
        {/* 当前版本 */}
        <div className={styles.versionItem}>
          <div className={styles.versionHeader}>
            <span className={styles.versionNumber}>v{software.currentVersion}</span>
            <span className={styles.versionDate}>{formatDate(software.updatedAt)}</span>
          </div>
          <div className={styles.versionChanges}>
            当前版本 - {software.description}
          </div>
        </div>
        
        {/* 这里可以添加更多版本历史，如果API支持的话 */}
        <Caption1 style={{ textAlign: 'center', color: 'var(--colorNeutralForeground2)', marginTop: '20px' }}>
          更多版本历史信息将在后续版本中提供
        </Caption1>
      </div>
    </div>
  );

  // 渲染文件详情标签页
  const renderFileDetailsTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.fileDetails}>
        <div className={styles.fileCard}>
          <div className={styles.fileHeader}>
            <span className={styles.fileName}>
              {software.name}.{software.filetype || 'unknown'}
            </span>
            <span className={styles.fileSize}>
              {formatFileSize(software.fileSize)}
            </span>
          </div>
          
          <div className={styles.fileInfo}>
            <div className={styles.infoItem}>
              <Caption1 className={styles.infoLabel}>文件类型</Caption1>
              <Text className={styles.infoValue}>{software.filetype?.toUpperCase() || '未知'}</Text>
            </div>
            
            <div className={styles.infoItem}>
              <Caption1 className={styles.infoLabel}>文件大小</Caption1>
              <Text className={styles.infoValue}>{formatFileSize(software.fileSize)}</Text>
            </div>
            
            {software.metadata?.platform && (
              <div className={styles.infoItem}>
                <Caption1 className={styles.infoLabel}>兼容平台</Caption1>
                <Text className={styles.infoValue}>{software.metadata.platform.join(', ')}</Text>
              </div>
            )}
            
            <div className={styles.infoItem}>
              <Caption1 className={styles.infoLabel}>版本号</Caption1>
              <Text className={styles.infoValue}>v{software.currentVersion}</Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染安装说明标签页
  const renderInstallInstructionsTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.installInstructions}>
        <Title3 style={{ marginBottom: '16px' }}>安装说明</Title3>
        
        <div className={styles.instructionStep}>
          <div className={styles.stepNumber}>1</div>
          <div className={styles.stepContent}>
            <Body1 style={{ fontWeight: '600', marginBottom: '4px' }}>下载软件</Body1>
            <Caption1>点击下载按钮，将软件文件保存到本地</Caption1>
          </div>
        </div>
        
        <div className={styles.instructionStep}>
          <div className={styles.stepNumber}>2</div>
          <div className={styles.stepContent}>
            <Body1 style={{ fontWeight: '600', marginBottom: '4px' }}>检查文件</Body1>
            <Caption1>确认下载的文件完整且未损坏</Caption1>
          </div>
        </div>
        
        <div className={styles.instructionStep}>
          <div className={styles.stepNumber}>3</div>
          <div className={styles.stepContent}>
            <Body1 style={{ fontWeight: '600', marginBottom: '4px' }}>安装软件</Body1>
            <Caption1>
              {software.filetype === 'apk' 
                ? '在Android设备上启用"未知来源"安装，然后点击APK文件进行安装'
                : '双击文件或按照软件提供的安装说明进行安装'
              }
            </Caption1>
          </div>
        </div>
        
        <div className={styles.instructionStep}>
          <div className={styles.stepNumber}>4</div>
          <div className={styles.stepContent}>
            <Body1 style={{ fontWeight: '600', marginBottom: '4px' }}>完成安装</Body1>
            <Caption1>按照安装向导完成软件安装，然后即可开始使用</Caption1>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <DialogTitle action={
            <Button
              appearance="subtle"
              aria-label="关闭"
              icon={<Dismiss24Regular />}
              onClick={onClose}
            />
          }>
            软件详情
          </DialogTitle>
          
          <DialogContent className={styles.dialogContent}>
            {/* 头部信息 */}
            <div className={styles.headerSection}>
              <div className={styles.iconContainer}>
                {software.iconUrl ? (
                  <Image
                    src={software.iconUrl}
                    alt={software.name}
                    className={styles.softwareIcon}
                  />
                ) : (
                  <Folder24Regular style={{ fontSize: '32px', color: 'var(--colorNeutralForeground2)' }} />
                )}
              </div>
              
              <div className={styles.headerInfo}>
                <div className={styles.softwareName}>{software.name}</div>
                <div className={styles.softwareDescription}>{software.description}</div>
                
                <div className={styles.badgeContainer}>
                  <Badge appearance="filled" color="brand">
                    v{software.currentVersion}
                  </Badge>
                  {software.category && (
                    <Badge appearance="outline">
                      {software.category}
                    </Badge>
                  )}
                  {software.filetype && (
                    <Badge appearance="tint">
                      {software.filetype.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 标签页 */}
            <TabList selectedValue={selectedTab} onTabSelect={handleTabSelect}>
              <Tab value="overview" icon={<Info24Regular />}>
                概览
              </Tab>
              <Tab value="versions" icon={<History24Regular />}>
                版本历史
              </Tab>
              <Tab value="files" icon={<DocumentText24Regular />}>
                文件详情
              </Tab>
              <Tab value="install" icon={<Folder24Regular />}>
                安装说明
              </Tab>
            </TabList>

            {/* 标签页内容 */}
            {selectedTab === 'overview' && renderOverviewTab()}
            {selectedTab === 'versions' && renderVersionHistoryTab()}
            {selectedTab === 'files' && renderFileDetailsTab()}
            {selectedTab === 'install' && renderInstallInstructionsTab()}
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
