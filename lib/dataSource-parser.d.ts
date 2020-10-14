export type Entry = {
  path: string;
  pattern: string;
  dataSourceName: string;
};

export type Metadata = {
  path: string;
  dataSourceName: string;
  pattern: string;
};

export type StorageInfo = {
  path: string;
};

export type DataSourceMetaData = {
  metadata: Metadata;
  storageInfo: StorageInfo;
};

export { dataSourceParser as default } from "./dataSource-parser";
