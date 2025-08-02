import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Button,
  Card,
  SearchBox,
  Spinner,
  Badge,
  Body1,
  Caption1,
  Title2,
  Title3,
} from '@fluentui/react-components';
import {
  CloudArrowDown24Regular,
  Search24Regular,
  ChevronRight24Regular,
  Info24Regular,
  Tag24Regular,
  Globe24Regular,
  ErrorCircle24Filled,
} from '@fluentui/react-icons';
import { OnlineSoftware, OnlineResourcesState } from '../../types/app';
import { onlineResourcesService, SearchParams } from '../../services/onlineResourcesService';
import SoftwareDetailPanel from './SoftwareDetailPanel';

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
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  searchContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  searchBox: {
    flex: 1,
    maxWidth: '400px',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  softwareGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
    padding: '8px 0',
  },
  softwareCard: {
    height: 'auto',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  cardContent: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  softwareTitle: {
    fontWeight: '600',
    fontSize: '14px',
    lineHeight: '1.3',
    marginBottom: '4px',
  },
  softwareDescription: {
    fontSize: '12px',
    color: 'var(--colorNeutralForeground2)',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  softwareInfo: {
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
});

const OnlineResourcesPanel: React.FC = () => {
  const styles = useStyles();
  const [state, setState] = useState<OnlineResourcesState>({
    currentView: 'list',
    selectedSoftwareId: undefined,
    selectedSoftware: undefined,
  });
  const [softwareList, setSoftwareList] = useState<OnlineSoftware[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 加载软件列表
  const loadSoftwareList = async (params: SearchParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await onlineResourcesService.getSoftwareList(params);
      
      if (response.success) {
        setSoftwareList(response.data);
      } else {
        setError(response.error || '获取软件列表失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取软件列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索软件
  const handleSearch = async () => {
    if (searchKeyword.trim()) {
      await loadSoftwareList({ search: searchKeyword.trim() });
    } else {
      await loadSoftwareList();
    }
  };

  // 查看软件详情
  const handleViewDetail = (software: OnlineSoftware) => {
    setState({
      currentView: 'detail',
      selectedSoftwareId: software.id,
      selectedSoftware: software,
    });
  };

  // 返回列表页面
  const handleBackToList = () => {
    setState({
      currentView: 'list',
      selectedSoftwareId: undefined,
      selectedSoftware: undefined,
    });
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('zh-CN');
    } catch {
      return dateString;
    }
  };

  // 渲染软件卡片
  const renderSoftwareCard = (software: OnlineSoftware) => {

    return (
      <Card key={software.id} className={styles.softwareCard}>
        <div className={styles.cardContent}>
          <Text className={styles.softwareTitle}>{software.name}</Text>
          
          <Text className={styles.softwareDescription}>
            {software.description}
          </Text>

          <div className={styles.softwareInfo}>
            <Badge className={styles.versionBadge} appearance="outline">
              v{software.currentVersion}
            </Badge>
            
            {software.category && (
              <Badge className={styles.versionBadge} appearance="tint">
                {software.category}
              </Badge>
            )}
          </div>

          {software.tags && software.tags.length > 0 && (
            <div className={styles.tagContainer}>
              {software.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} className={styles.tag} size="small" appearance="ghost">
                  {tag}
                </Badge>
              ))}
              {software.tags.length > 3 && (
                <Badge className={styles.tag} size="small" appearance="ghost">
                  +{software.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className={styles.downloadSection}>
            <div>
              {software.filetype && (
                <Caption1>{software.filetype.toUpperCase()}</Caption1>
              )}
            </div>
            
            <Button
              icon={<ChevronRight24Regular />}
              onClick={() => handleViewDetail(software)}
              size="small"
              className={styles.downloadButton}
              appearance="primary"
            >
              查看详情
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // 初始化加载
  useEffect(() => {
    loadSoftwareList();
  }, []);

  // 根据当前视图渲染不同内容
  if (state.currentView === 'detail' && state.selectedSoftwareId) {
    return (
      <SoftwareDetailPanel
        softwareId={state.selectedSoftwareId}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <CloudArrowDown24Regular />
        <Title2>在线资源</Title2>
      </div>

      <div className={styles.searchContainer}>
        <SearchBox
          className={styles.searchBox}
          placeholder="搜索软件名称或描述..."
          value={searchKeyword}
          onChange={(_, data) => setSearchKeyword(data.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          icon={<Search24Regular />}
          onClick={handleSearch}
          disabled={loading}
        >
          搜索
        </Button>
      </div>

      <div className={styles.content}>
        {error && (
          <div className={styles.errorMessage}>
            <ErrorCircle24Filled style={{ marginRight: '8px' }} />
            {error}
          </div>
        )}

        {loading ? (
          <div className={styles.loadingContainer}>
            <Spinner label="正在加载软件列表..." />
          </div>
        ) : softwareList.length === 0 ? (
          <div className={styles.emptyContainer}>
            <CloudArrowDown24Regular style={{ fontSize: '48px', color: 'var(--colorNeutralForeground3)' }} />
            <Body1>暂无可用的软件资源</Body1>
            <Caption1>请尝试搜索其他关键词或稍后再试</Caption1>
          </div>
        ) : (
          <div className={styles.softwareGrid}>
            {softwareList.map(renderSoftwareCard)}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineResourcesPanel;
