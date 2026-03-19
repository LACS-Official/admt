import React, { useState, useEffect } from 'react';
import { 
  makeStyles, 
  Text, 
  Button,
  Card,
  CardHeader,
  Dropdown,
  Option,
  Field,
  ProgressBar,
  InfoLabel,
  tokens,
  Spinner
} from '@fluentui/react-components';
import { 
  Save24Regular,
  FolderRegular,
  Warning24Filled,
  ShieldCheckmark24Regular
} from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { DeviceInfo } from '../../types/device';
import { useAppStore } from '../../stores/appStore';
import { save } from '@tauri-apps/plugin-dialog';
import { deviceService } from '../../services/deviceService';

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
    gap: "20px",
    backgroundColor: tokens.colorNeutralBackground1,
    padding: "24px",
  },
  header: {
    marginBottom: "12px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: "500px",
  },
  warningCard: {
    backgroundColor: tokens.colorStatusWarningBackground1,
    padding: "12px",
    borderRadius: tokens.borderRadiusMedium,
    display: "flex",
    gap: "12px",
    alignItems: "center",
    border: `1px solid ${tokens.colorStatusWarningBorder1}`,
  },
  actionArea: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  progressInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  }
});

interface SystemBackupCardProps {
  device: DeviceInfo | null;
}

const SystemBackupCard: React.FC<SystemBackupCardProps> = ({ device }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const setStatusBarMessage = useAppStore(state => state.setStatusBarMessage);
  
  const [partitions, setPartitions] = useState<string[]>([]);
  const [selectedPartition, setSelectedPartition] = useState<string>('');
  const [savePath, setSavePath] = useState<string>('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [loadingPartitions, setLoadingPartitions] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (device?.serial && device.mode === 'sys') {
      fetchPartitions();
    } else {
      setPartitions([]);
    }
  }, [device?.serial]);

  const fetchPartitions = async () => {
    if (!device?.serial) return;
    setLoadingPartitions(true);
    try {
      const list = await deviceService.getDevicePartitions(device.serial);
      setPartitions(list.sort());
    } catch (error) {
      console.error("Failed to fetch partitions:", error);
    } finally {
      setLoadingPartitions(false);
    }
  };

  const handleSelectSavePath = async () => {
    if (!selectedPartition) return;
    
    try {
      const result = await save({
        filters: [{
          name: 'Image',
          extensions: ['img'],
        }],
        defaultPath: `${selectedPartition}.img`
      });
      
      if (result) {
        setSavePath(result);
      }
    } catch (error) {
      console.error("Failed to select save path:", error);
    }
  };

  const handleBackup = async () => {
    if (!device?.serial || !selectedPartition || !savePath) return;

    setIsBackingUp(true);
    setProgress(0.1); // Start progress
    
    try {
      setStatusBarMessage({ message: t('device_control.loading_partitions'), type: 'info' });
      const result = await deviceService.backupPartition(device.serial, selectedPartition, savePath);
      
      if (result.success) {
        setProgress(1);
        setStatusBarMessage({ message: t('device_control.backup_success', { partition: selectedPartition }), type: 'success' });
      } else {
        setStatusBarMessage({ message: t('device_control.backup_failed', { partition: selectedPartition, error: result.error }), type: 'error' });
      }
    } catch (error: any) {
      setStatusBarMessage({ message: t('device_control.backup_failed', { partition: selectedPartition, error: error.message }), type: 'error' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const isFormValid = device?.serial && selectedPartition && savePath && !isBackingUp;

  if (!device || device.mode !== 'sys') {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
             <Warning24Filled primaryFill={tokens.colorPaletteGoldForeground2} />
             <Text size={500}>{t('device_control.device_unavailable')}</Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Text size={600} weight="semibold">{t('device_control.partition_backup')}</Text>
          <br />
          <Text size={200}>{t('device_control.backup_desc')}</Text>
        </div>

        <div className={styles.warningCard}>
           <ShieldCheckmark24Regular />
           <Text size={200}>{t('device_control.root_required')}</Text>
        </div>

        <div className={styles.form}>
          <Field label={t('device_control.select_partition')}>
            <Dropdown
              placeholder={t('device_control.select_partition')}
              value={selectedPartition}
              onOptionSelect={(_, data) => setSelectedPartition(data.optionValue || '')}
              disabled={isBackingUp || loadingPartitions}
            >
              {loadingPartitions ? (
                <Option disabled text={t('device_control.loading_partitions')}><Spinner size="tiny" label={t('device_control.loading_partitions')} /></Option>
              ) : (
                partitions.map(p => <Option key={p} value={p}>{p}</Option>)
              )}
            </Dropdown>
          </Field>

          <Field label={t('device_control.output_file')}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Dropdown
                style={{ flex: 1 }}
                value={savePath}
                placeholder={t('device_control.output_file')}
                disabled
              >
                <Option>{savePath}</Option>
              </Dropdown>
              <Button 
                icon={<FolderRegular />} 
                onClick={handleSelectSavePath}
                disabled={isBackingUp || !selectedPartition}
              />
            </div>
          </Field>
        </div>

        <div className={styles.actionArea}>
          {isBackingUp && (
            <div>
              <div className={styles.progressInfo}>
                <Text size={200}>
                  {progress < 1 ? t('device_control.loading_partitions') : t('common.done')}
                </Text>
                <Text size={200} weight="semibold">{Math.round(progress * 100)}%</Text>
              </div>
              <ProgressBar value={progress} color={progress === 1 ? "success" : "brand"} />
            </div>
          )}
          
          <Button 
            appearance="primary" 
            size="large"
            icon={<Save24Regular />}
            onClick={handleBackup}
            disabled={!isFormValid}
          >
            {isBackingUp ? t('common.done') : t('device_control.start_backup')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SystemBackupCard;
