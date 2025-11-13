
/*
在线资源-在线资源卡片页面
*/
import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Button,
  SearchBox,
  Spinner,
  Body1,
  Caption1,
  Title2,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import {
  CloudArrowDown24Regular,
  Search24Regular,
  ErrorCircle24Filled,
  ArrowDownload24Regular,
} from '@fluentui/react-icons';
import { OnlineSoftware, OnlineResourcesState } from '../../types/app';
import { onlineResourcesService, SearchParams } from '../../services/onlineResourcesService';

import { DownloadManagerPanel } from './DownloadManagerPanel';
import { ResourceDetailModal } from './ResourceDetailModalSimple';
import SoftwareCard from './SoftwareCard';

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
    showResourceDetailModal: false,
  });
  const [softwareList, setSoftwareList] = useState<OnlineSoftware[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ADMT'); // 默认选择ADMT分类，显示为"全部"

  // 加载软件列表
  const loadSoftwareList = async (params: SearchParams = {}, category?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // 使用传入的分类或当前活动分类
      const currentCategory = category || activeCategory;
      
      // 根据活动分类设置标签参数
      let tags = 'admt'; // 默认包含admt标签
      
      // 如果不是默认的ADMT分类，添加分类标签
      if (currentCategory !== 'ADMT') {
        tags = `admt,${currentCategory}`;
      }
      
      const response = await onlineResourcesService.getSoftwareList({
        ...params,
        tags: tags,
      });
      
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



  // 查看下载管理
  const handleViewDownloads = () => {
    setState({
      currentView: 'downloads',
      selectedSoftwareId: undefined,
      selectedSoftware: undefined,
      showResourceDetailModal: false,
    });
  };

  // 显示资源详情弹窗
  const handleShowResourceModal = (software: OnlineSoftware) => {
    setState(prev => ({
      ...prev,
      showResourceDetailModal: true,
      selectedResourceForModal: software,
    }));
  };

  // 关闭资源详情弹窗
  const handleCloseResourceModal = () => {
    setState(prev => ({
      ...prev,
      showResourceDetailModal: false,
      selectedResourceForModal: undefined,
    }));
  };

  // 从弹窗下载软件
  const handleDownloadFromModal = async (software: OnlineSoftware): Promise<string> => {
    try {
      const taskId = await onlineResourcesService.downloadSoftware(software);
      // 可以选择关闭弹窗或保持打开状态
      // handleCloseResourceModal();
      return taskId;
    } catch (error) {
      console.error('下载失败:', error);
      throw error;
    }
  };



  // 渲染软件卡片
  const renderSoftwareCard = (software: OnlineSoftware) => {
    return (
      <SoftwareCard
        key={software.id}
        software={software}
        onClick={() => handleShowResourceModal(software)}
      />
    );
  };

  // 当分类变化时自动触发搜索
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    // 分类变化后立即触发搜索，直接传入新的分类值，无需等待状态更新
    if (searchKeyword.trim()) {
      loadSoftwareList({ search: searchKeyword.trim() }, category);
    } else {
      loadSoftwareList({}, category);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadSoftwareList();
  }, []);

  // 根据当前视图渲染不同内容
  if (state.currentView === 'downloads') {
    return (
      <DownloadManagerPanel
        onBack={() => setState(prev => ({ ...prev, currentView: 'list' }))}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchContainer}>
        <SearchBox
          className={styles.searchBox}
          placeholder="搜索软件名称或描述..."
          value={searchKeyword}
          onChange={(_, data) => setSearchKeyword(data.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Body1>分类:</Body1>
        <Dropdown
          placeholder="选择分类"
          selectedOptions={[activeCategory]}
          onOptionSelect={(_, data) => {
            handleCategoryChange(data.optionValue || 'ADMT');
          }}
          style={{ minWidth: '120px' }}
        >
          <Option value="ADMT">全部</Option>
          <Option value="脚本">脚本</Option>
          <Option value="驱动">驱动</Option>
          <Option value="设置文件">设置文件</Option>
          <Option value="RootApp">RootApp</Option>
          <Option value="小米解锁">小米解锁</Option>
          <Option value="其它">其它</Option>
        </Dropdown>
        <Button
          icon={<Search24Regular />}
          onClick={handleSearch}
          disabled={loading}
          title="搜索关键词"
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

      {/* 资源详情弹窗 */}
      {state.selectedResourceForModal && (
        <ResourceDetailModal
          software={state.selectedResourceForModal}
          isOpen={!!state.showResourceDetailModal}
          onClose={handleCloseResourceModal}
          onDownload={handleDownloadFromModal}
        />
      )}
    </div>
  );
};

export default OnlineResourcesPanel;
