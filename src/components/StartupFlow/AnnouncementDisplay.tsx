/**
 * 公告显示组件
 * 在应用启动时显示重要公告和通知
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Text,
  Card,
  CardHeader,
  CardPreview,
  Badge,
  Divider,
  Spinner,
  MessageBar,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Megaphone24Regular,
  Warning24Regular,
  Info24Regular,
  Shield24Regular,
  Wrench24Regular,
  Dismiss24Regular,
  ChevronRight24Regular,
} from '@fluentui/react-icons';
import { announcementService } from '../../services/announcementService';
import { Announcement } from '../../types/app';

const useStyles = makeStyles({
  container: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  dialog: {
    maxWidth: '600px',
    width: '90%',
  },
  dialogBody: {
    maxHeight: '500px',
    overflow: 'auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalXL,
  },
  announcementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  announcementCard: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2,
      transform: 'translateY(-1px)',
      boxShadow: tokens.shadow4,
    },
  },
  announcementHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  announcementIcon: {
    fontSize: '20px',
  },
  announcementTitle: {
    fontWeight: tokens.fontWeightSemibold,
    flex: 1,
  },
  announcementMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalXS,
  },
  announcementContent: {
    marginTop: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.5',
  },
  priorityBadge: {
    fontSize: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXL,
    color: tokens.colorNeutralForeground2,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalS,
  },
});

interface AnnouncementDisplayProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const AnnouncementDisplay: React.FC<AnnouncementDisplayProps> = ({
  open,
  onClose,
  onContinue,
}) => {
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    if (open) {
      loadAnnouncements();
    }
  }, [open]);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('📢 加载启动公告...');
      
      // 获取重要公告和最新公告
      const [importantAnnouncements, latestAnnouncements] = await Promise.all([
        announcementService.getImportantAnnouncements(),
        announcementService.getLatestAnnouncements(3),
      ]);

      // 合并并去重公告
      const allAnnouncements = [...importantAnnouncements];
      latestAnnouncements.forEach(announcement => {
        if (!allAnnouncements.find(a => a.id === announcement.id)) {
          allAnnouncements.push(announcement);
        }
      });

      // 按优先级和发布时间排序
      allAnnouncements.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // 高优先级在前
        }
        
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(); // 新发布的在前
      });

      setAnnouncements(allAnnouncements);
      console.log(`✅ 加载了 ${allAnnouncements.length} 条公告`);

    } catch (error) {
      console.error('❌ 加载公告失败:', error);
      setError(error instanceof Error ? error.message : '加载公告失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getAnnouncementIcon = (type: string, priority: string) => {
    if (priority === 'urgent') {
      return <Warning24Regular className={styles.announcementIcon} style={{ color: '#d83b01' }} />;
    }
    
    switch (type) {
      case 'update':
        return <Info24Regular className={styles.announcementIcon} style={{ color: '#0078d4' }} />;
      case 'security':
        return <Shield24Regular className={styles.announcementIcon} style={{ color: '#d83b01' }} />;
      case 'maintenance':
        return <Wrench24Regular className={styles.announcementIcon} style={{ color: '#ca5010' }} />;
      default:
        return <Megaphone24Regular className={styles.announcementIcon} style={{ color: '#107c10' }} />;
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
    });
  };

  const handleAnnouncementClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
  };

  const handleContinue = () => {
    setSelectedAnnouncement(null);
    onContinue();
  };

  const renderAnnouncementList = () => {
    if (isLoading) {
      return (
        <div className={styles.loadingContainer}>
          <Spinner size="large" />
          <Text>正在加载公告...</Text>
        </div>
      );
    }

    if (error) {
      return (
        <MessageBar intent="warning">
          加载公告失败: {error}
        </MessageBar>
      );
    }

    if (announcements.length === 0) {
      return (
        <div className={styles.emptyState}>
          <Megaphone24Regular style={{ fontSize: '48px', color: tokens.colorNeutralForeground3 }} />
          <Text size={400}>暂无重要公告</Text>
        </div>
      );
    }

    return (
      <div className={styles.announcementList}>
        {announcements.map((announcement) => {
          const formattedAnnouncement = announcementService.formatAnnouncement(announcement);
          
          return (
            <Card
              key={announcement.id}
              className={styles.announcementCard}
              onClick={() => handleAnnouncementClick(announcement)}
            >
              <CardHeader
                header={
                  <div className={styles.announcementHeader}>
                    {getAnnouncementIcon(announcement.type, announcement.priority)}
                    <Text className={styles.announcementTitle}>
                      {formattedAnnouncement.title}
                    </Text>
                    <ChevronRight24Regular />
                  </div>
                }
                description={
                  <div className={styles.announcementMeta}>
                    <Badge
                      appearance="filled"
                      color={getPriorityBadgeColor(announcement.priority)}
                      className={styles.priorityBadge}
                    >
                      {announcementService.getPriorityText(announcement.priority)}
                    </Badge>
                    <Text size={200}>
                      {announcementService.getTypeText(announcement.type)}
                    </Text>
                    <Text size={200}>
                      {formatDate(announcement.publishedAt)}
                    </Text>
                  </div>
                }
              />
              <CardPreview>
                <Text className={styles.announcementContent}>
                  {formattedAnnouncement.content.length > 100
                    ? `${formattedAnnouncement.content.substring(0, 100)}...`
                    : formattedAnnouncement.content
                  }
                </Text>
              </CardPreview>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* 公告列表对话框 */}
      <Dialog open={open && !selectedAnnouncement} onOpenChange={(_, data) => !data.open && onClose()}>
        <DialogSurface className={styles.dialog}>
          <DialogTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <Megaphone24Regular />
              系统公告
            </div>
          </DialogTitle>
          <DialogBody className={styles.dialogBody}>
            {renderAnnouncementList()}
          </DialogBody>
          <DialogActions className={styles.actions}>
            <Button appearance="primary" onClick={handleContinue}>
              继续启动
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* 公告详情对话框 */}
      {selectedAnnouncement && (
        <Dialog open={true} onOpenChange={() => setSelectedAnnouncement(null)}>
          <DialogSurface className={styles.dialog}>
            <DialogTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                {getAnnouncementIcon(selectedAnnouncement.type, selectedAnnouncement.priority)}
                {announcementService.formatAnnouncement(selectedAnnouncement).title}
              </div>
            </DialogTitle>
            <DialogBody>
              <div style={{ marginBottom: tokens.spacingVerticalM }}>
                <div className={styles.announcementMeta}>
                  <Badge
                    appearance="filled"
                    color={getPriorityBadgeColor(selectedAnnouncement.priority)}
                  >
                    {announcementService.getPriorityText(selectedAnnouncement.priority)}
                  </Badge>
                  <Text size={200}>
                    {announcementService.getTypeText(selectedAnnouncement.type)}
                  </Text>
                  <Text size={200}>
                    {formatDate(selectedAnnouncement.publishedAt)}
                  </Text>
                </div>
              </div>
              <Divider />
              <div style={{ marginTop: tokens.spacingVerticalM }}>
                <Text style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {announcementService.formatAnnouncement(selectedAnnouncement).content}
                </Text>
              </div>
            </DialogBody>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setSelectedAnnouncement(null)}>
                返回
              </Button>
              <Button appearance="primary" onClick={handleContinue}>
                继续启动
              </Button>
            </DialogActions>
          </DialogSurface>
        </Dialog>
      )}
    </>
  );
};

export default AnnouncementDisplay;
