import React from 'react';
import { makeStyles } from "@fluentui/react-components";
import KeySimulationCard from './KeySimulationCard';
import DisplayControlCard from './DisplayControlCard';
import { DeviceInfo } from "../../types/device";

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'row',
    gap: '16px',
    height: '100%',
  },
  card: {
    flex: 1,
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
    </div>
  );
};

export default SystemControlCard;