
import React, { useState } from 'react';
import {
  makeStyles,
  Text,
  Button,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  createTableColumn,
  TableColumnDefinition,
} from "@fluentui/react-components";
import { ArrowSync24Regular, Delete24Regular, Warning24Regular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { DeviceInfo } from "../../types/device";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "16px",
    height: "100%",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grid: {
    flex: 1,
    overflow: "auto",
  }
});

interface RootModule {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
}

interface ModulePanelProps {
  device: DeviceInfo | null;
}

const ModulePanel: React.FC<ModulePanelProps> = ({ device }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [modules, setModules] = useState<RootModule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const columns: TableColumnDefinition<RootModule>[] = [
    createTableColumn<RootModule>({
      columnId: "name",
      renderHeaderCell: () => t('file_manager.header_name'),
      renderCell: (item) => <Text weight="semibold">{item.name}</Text>,
    }),
    createTableColumn<RootModule>({
      columnId: "version",
      renderHeaderCell: () => t('common.version'),
      renderCell: (item) => <Text>{item.version}</Text>,
    }),
    createTableColumn<RootModule>({
      columnId: "author",
      renderHeaderCell: () => t('common.author'),
      renderCell: (item) => <Text size={200}>{item.author}</Text>,
    }),
    createTableColumn<RootModule>({
      columnId: "actions",
      renderHeaderCell: () => t('file_manager.header_actions'),
      renderCell: (item) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button size="small" icon={<Delete24Regular />} appearance="subtle">{t('common.uninstall')}</Button>
        </div>
      ),
    }),
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    // TODO: Implement module listing logic via adb
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Text size={400} weight="semibold">{t('root.module_list')}</Text>
        <Button 
          icon={<ArrowSync24Regular />} 
          onClick={handleRefresh}
        >
          {t('root.refresh_list')}
        </Button>
      </div>

      {modules.length === 0 && !isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px", gap: "12px", color: "var(--colorNeutralForeground3)" }}>
          <Warning24Regular style={{ fontSize: "40px" }} />
          <Text>{t('root.no_modules')}</Text>
        </div>
      ) : (
        <DataGrid items={modules} columns={columns} className={styles.grid}>
          <DataGridHeader>
            <DataGridRow>
              {({ renderHeaderCell }) => (
                <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<RootModule>>
            {({ item, rowId }) => (
              <DataGridRow key={rowId}>
                {({ renderCell }) => (
                  <DataGridCell>{renderCell(item)}</DataGridCell>
                )}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      )}
    </div>
  );
};

export default ModulePanel;
