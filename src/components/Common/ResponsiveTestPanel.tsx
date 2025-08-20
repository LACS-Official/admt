import React  from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Badge,
} from "@fluentui/react-components";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

const useStyles = makeStyles({
  container: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  infoCard: {
    padding: "16px",
  },
  gridDemo: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  },
  demoCard: {
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "8px",
    textAlign: "center",
  },
});

const ResponsiveTestPanel: React.FC = () => {
  const styles = useStyles();
  const { windowSize, layoutSize, getGridColumns } = useResponsiveLayout();

  const gridColumns = getGridColumns({
    small: 1,
    medium: 2,
    large: 3,
    xlarge: 4,
  });

  return (
    <div className={styles.container}>
      <Card className={styles.infoCard}>
        <CardHeader
          header={<Text weight="semibold">响应式布局测试</Text>}
          action={
            <Badge appearance="filled" color="brand">
              {layoutSize}
            </Badge>
          }
        />
        <div style={{ padding: "16px" }}>
          <Text>窗口尺寸: {windowSize.width} x {windowSize.height}</Text>
          <br />
          <Text>布局大小: {layoutSize}</Text>
          <br />
          <Text>网格列数: {gridColumns}</Text>
        </div>
      </Card>

      <div 
        className={styles.gridDemo}
        style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={styles.demoCard}>
            <Text>卡片 {i + 1}</Text>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveTestPanel;
