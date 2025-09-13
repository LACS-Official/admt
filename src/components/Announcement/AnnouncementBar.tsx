/**
 * 公告展示条组件
 * 在标题栏中显示简洁的公告内容，点击可展开详细列表
 */

import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Button,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogBody,
  Card,
  Badge,
  Spinner,
  MessageBar,
} from '@fluentui/react-components';
import {
  Megaphone24Regular,
  Info24Regular,
  Shield24Regular,
  Wrench24Regular,
  Warning24Filled,
  ChevronRight16Regular,
} from '@fluentui/react-icons';
import { announcementService } from '../../services/announcementService';
import { Announcement } from '../../types/app';

const useStyles = makeStyles({
  announcementBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 12px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    borderRadius: '16px',
    border: '1px solid var(--colorNeutralStroke2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    maxWidth: '300px',
    minWidth: '120px',
    // 防止干扰窗口拖拽，但允许点击交互
    position: 'relative',
    zIndex: 10,
    ':hover': {
      backgroundColor: 'var(--colorNeutralBackground3)',
    },
  },
  announcementText: {
    fontSize: '12px',
    color: 'var(--colorNeutralForeground2)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
  },
  announcementIcon: {
    fontSize: '16px',
    color: 'var(--colorBrandForeground1)',
  },
  chevronIcon: {
    fontSize: '12px',
    color: 'var(--colorNeutralForeground3)',
  },
  dialogContent: {
    minWidth: '600px',
    maxWidth: '800px',
    minHeight: '400px',
    maxHeight: '600px',
  },
  announcementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  announcementCard: {
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: 'var(--colorNeutralBackground2)',
    },
    border: '1px solid var(--colorNeutralStroke2)',
    borderRadius: '8px',
  },
  announcementHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  announcementTitle: {
    fontWeight: '600',
    fontSize: '14px',
    flex: 1,
  },
  announcementContent: {
    fontSize: '13px',
    color: 'var(--colorNeutralForeground2)',
    marginBottom: '12px',
    lineHeight: '1.4',
  },
  announcementMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'space-between',
  },
  metaLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  metaRight: {
    fontSize: '12px',
    color: 'var(--colorNeutralForeground3)',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--colorNeutralForeground3)',
  },
  detailDialog: {
    minWidth: '500px',
    maxWidth: '700px',
  },
  detailContent: {
    lineHeight: '1.6',
    fontSize: '14px',
  },
  detailMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '16px',
    padding: '12px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    borderRadius: '8px',
  },
});

interface AnnouncementBarProps {
  className?: string;
}

const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ className }) => {
  const styles = useStyles();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // 加载公告数据
  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await announcementService.getAnnouncements({
        limit: 10,
        isPublished: true,
        sortBy: 'publishedAt',
        sortOrder: 'desc'
      });

      if (response.success) {
        setAnnouncements(response.data.announcements);
      } else {
        throw new Error(response.error || '获取公告失败');
      }
    } catch (err) {
      console.error('加载公告失败:', err);
      setError(err instanceof Error ? err.message : '加载公告失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getAnnouncementIcon = (type: string, priority: string) => {
    if (priority === 'urgent') {
      return <Warning24Filled style={{ color: '#d83b01' }} />;
    }
    
    switch (type) {
      case 'update':
        return <Info24Regular style={{ color: '#0078d4' }} />;
      case 'security':
        return <Shield24Regular style={{ color: '#d83b01' }} />;
      case 'maintenance':
        return <Wrench24Regular style={{ color: '#ca5010' }} />;
      default:
        return <Megaphone24Regular style={{ color: '#107c10' }} />;
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'danger';
      case 'high':
        return 'severe';
      case 'normal':
        return 'informative';
      case 'low':
        return 'subtle';
      default:
        return 'informative';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAnnouncementClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsListDialogOpen(false);
    setIsDetailDialogOpen(true);
  };

  const getLatestAnnouncementText = () => {
    if (announcements.length === 0) return '暂无公告';
    
    const latest = announcements[0];
    const formatted = announcementService.formatAnnouncement(latest);
    return formatted.title.length > 20 
      ? `${formatted.title.substring(0, 20)}...` 
      : formatted.title;
  };

  // 如果正在加载或出错，不显示公告条
  if (isLoading || error || announcements.length === 0) {
    return null;
  }

  return (
    <>
      {/* 公告展示条 */}
      <Dialog open={isListDialogOpen} onOpenChange={(_, data) => setIsListDialogOpen(data.open)}>
        <DialogTrigger disableButtonEnhancement>
          <div className={`${styles.announcementBar} ${className || ''}`} data-tauri-drag-region="false">
            <Megaphone24Regular className={styles.announcementIcon} />
            <Text className={styles.announcementText}>
              {getLatestAnnouncementText()}
            </Text>
            <ChevronRight16Regular className={styles.chevronIcon} />
          </div>
        </DialogTrigger>

        <DialogSurface className={styles.dialogContent}>
          <DialogBody>
            <DialogTitle>系统公告</DialogTitle>
            <DialogContent>
              {isLoading ? (
                <div className={styles.loadingContainer}>
                  <Spinner size="medium" />
                  <Text style={{ marginLeft: '12px' }}>加载中...</Text>
                </div>
              ) : error ? (
                <MessageBar intent="error">
                  {error}
                </MessageBar>
              ) : announcements.length === 0 ? (
                <div className={styles.emptyState}>
                  <Megaphone24Regular style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <Text>暂无公告</Text>
                </div>
              ) : (
                <div className={styles.announcementList}>
                  {announcements.map((announcement) => {
                    const formatted = announcementService.formatAnnouncement(announcement);
                    
                    return (
                      <Card 
                        key={announcement.id} 
                        className={styles.announcementCard}
                        onClick={() => handleAnnouncementClick(announcement)}
                      >
                        <div className={styles.announcementHeader}>
                          {getAnnouncementIcon(announcement.type, announcement.priority)}
                          <Text className={styles.announcementTitle}>
                            {formatted.title}
                          </Text>
                        </div>
                        
                        <Text className={styles.announcementContent}>
                          {formatted.content.length > 150
                            ? `${formatted.content.substring(0, 150)}...`
                            : formatted.content
                          }
                        </Text>
                        
                        <div className={styles.announcementMeta}>
                          <div className={styles.metaLeft}>
                            <Badge
                              appearance="filled"
                              color={getPriorityBadgeColor(announcement.priority)}
                              size="small"
                            >
                              {announcementService.getPriorityText(announcement.priority)}
                            </Badge>
                            <Text size={200}>
                              {announcementService.getTypeText(announcement.type)}
                            </Text>
                          </div>
                          <Text className={styles.metaRight}>
                            {formatDate(announcement.publishedAt)}
                          </Text>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button 
                appearance="secondary" 
                onClick={() => setIsListDialogOpen(false)}
              >
                关闭
              </Button>
              <Button 
                appearance="primary" 
                onClick={loadAnnouncements}
                disabled={isLoading}
              >
                刷新
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 公告详情弹窗 */}
      {selectedAnnouncement && (
        <Dialog 
          open={isDetailDialogOpen} 
          onOpenChange={(_, data) => setIsDetailDialogOpen(data.open)}
        >
          <DialogSurface className={styles.detailDialog}>
            <DialogBody>
              <DialogTitle>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getAnnouncementIcon(selectedAnnouncement.type, selectedAnnouncement.priority)}
                  {announcementService.formatAnnouncement(selectedAnnouncement).title}
                </div>
              </DialogTitle>
              <DialogContent>
                <div className={styles.detailContent}>
                  {announcementService.formatAnnouncement(selectedAnnouncement).content}
                </div>
                
                <div className={styles.detailMeta}>
                  <Badge
                    appearance="filled"
                    color={getPriorityBadgeColor(selectedAnnouncement.priority)}
                    size="medium"
                  >
                    {announcementService.getPriorityText(selectedAnnouncement.priority)}
                  </Badge>
                  <Text>
                    类型: {announcementService.getTypeText(selectedAnnouncement.type)}
                  </Text>
                  <Text>
                    发布时间: {formatDate(selectedAnnouncement.publishedAt)}
                  </Text>
                  {selectedAnnouncement.expiresAt && (
                    <Text>
                      过期时间: {formatDate(selectedAnnouncement.expiresAt)}
                    </Text>
                  )}
                </div>
              </DialogContent>
              <DialogActions>
                <Button 
                  appearance="secondary" 
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  关闭
                </Button>
                <Button 
                  appearance="primary" 
                  onClick={() => {
                    setIsDetailDialogOpen(false);
                    setIsListDialogOpen(true);
                  }}
                >
                  返回列表
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </>
  );
};

export default AnnouncementBar;