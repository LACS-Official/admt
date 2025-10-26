import React from 'react';
import { makeStyles } from "@fluentui/react-components";
import KeySimulationCard from './KeySimulationCard';
import DisplayControlCard from './DisplayControlCard';
import AnimationSpeedCard from './AnimationSpeedCard';
import PowerManagementCard from './PowerManagementCard';
import { DeviceInfo } from "../../types/device";

const useStyles = makeStyles({
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: '16px',
    height: '100%',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
  },
});

interface SystemControlCardProps {
  device: DeviceInfo;
}

const SystemControlCard: React.FC<SystemControlCardProps> = ({ device }) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <KeySimulationCard device={device} />
      </div>
      <div className={styles.card}>
        <DisplayControlCard device={device} />
      </div>
      <div className={styles.card}>
        <AnimationSpeedCard device={device} />
      </div>
      <div className={styles.card}>
        <PowerManagementCard device={device} />
      </div>
    </div>
  );
};

export default SystemControlCard;