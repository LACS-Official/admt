import React from 'react';
import { 
  makeStyles, 
  Text, 
  Button,
  Card,
  CardHeader,
  CardPreview
} from '@fluentui/react-components';
import { 
  ArrowCounterclockwise24Regular,
  Save24Regular
} from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { DeviceInfo } from '../../types/device';

const useStyles = makeStyles({
  container: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    height: "100%",
    boxSizing: "border-box",
  },
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    textAlign: "center",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  icon: {
    fontSize: "64px",
    color: "var(--colorBrandForeground1)",
    marginBottom: "16px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
  },
  description: {
    fontSize: "14px",
    color: "var(--colorNeutralForeground2)",
    maxWidth: "500px",
    lineHeight: "1.5",
  },
  comingSoonBadge: {
    backgroundColor: "var(--colorBrandBackground2)",
    color: "var(--colorBrandForeground1)",
    padding: "4px 12px",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "600",
    marginTop: "8px",
  }
});

interface SystemBackupCardProps {
  device: DeviceInfo | null;
}

const SystemBackupCard: React.FC<SystemBackupCardProps> = ({ device }) => {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <ArrowCounterclockwise24Regular className={styles.icon} />
        <div className={styles.comingSoonBadge}>Coming Soon</div>
        <Text className={styles.title}>
            {t('flash.goto_backup').replace('👉 ', '').replace(' >', '')}
        </Text>
        <Text className={styles.description}>
          The Partition Backup & Restore feature is currently under development.
          <br />
          This tool will allow you to backup critical partitions (boot, recovery, persist, etc.) 
          before performing risky operations.
        </Text>
        <Button appearance="primary" disabled>
          Notify Me When Available
        </Button>
      </Card>
    </div>
  );
};

export default SystemBackupCard;
