
import React from 'react';
import {
  makeStyles,
  Text,
  Switch,
  Card,
  CardHeader,
  Field,
} from "@fluentui/react-components";
import { Sparkle24Regular, Flash24Regular, WeatherMoon24Regular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { DeviceInfo } from "../../types/device";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "16px",
  },
  section: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  }
});

interface AdvancedSettingsPanelProps {
  device: DeviceInfo;
}

const AdvancedSettingsPanel: React.FC<AdvancedSettingsPanelProps> = ({ device }) => {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <Text size={400} weight="semibold">{t('root.sys_optimization')}</Text>
      
      <div className={styles.section}>
        <Card>
          <CardHeader
            header={<Text weight="semibold">{t('root.perf_mode')}</Text>}
            description={t('root.perf_mode_desc')}
          />
          <Field>
            <Switch label={t('device_overview.disabled')} />
          </Field>
        </Card>

        <Card>
          <CardHeader
            header={<Text weight="semibold">{t('root.dark_mode_forced')}</Text>}
            description={t('root.dark_mode_forced_desc')}
          />
          <Field>
            <Switch label={t('device_overview.disabled')} />
          </Field>
        </Card>

        <Card>
          <CardHeader
            header={<Text weight="semibold">{t('root.smooth_anim')}</Text>}
            description={t('root.smooth_anim_desc')}
          />
          <Field>
            <Switch label={t('device_overview.disabled')} />
          </Field>
        </Card>
      </div>

      <Text size={400} weight="semibold" style={{ marginTop: "16px" }}>{t('root.advanced_ops')}</Text>
      <div className={styles.section}>
        <Card>
          <CardHeader
            header={<Text weight="semibold">{t('root.selinux_status')}</Text>}
            description="切换 SELinux 运行模式 (Enforcing/Permissive)"
          />
          <Field>
            <Switch label={t('root.selinux_enforcing')} checked />
          </Field>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedSettingsPanel;
