export interface FastbootPartitionItem {
  name: string;
  displayName: string;
  sizeBytes?: number;
  sizeFormatted?: string;
  partitionType?: string;
  slot?: "a" | "b" | string | null;
  isCritical: boolean;
  category?: string;
  description: string;
}

export interface FastbootPartitionListResult {
  currentSlot?: string;
  isAbDevice: boolean;
  partitions: FastbootPartitionItem[];
}

export interface RootDetectionItem {
  name: string;
  status: "detected" | "not_detected" | string;
  details: string;
}

export interface PartitionImageInspection {
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  imageType: "boot" | "vendor_boot" | "vbmeta" | "sparse" | "raw" | "unknown" | string;
  magic: string;
  isValidImage: boolean;
  headerVersion?: number;
  osVersion?: string;
  osPatchLevel?: string;
  kernelSize?: number;
  ramdiskSize?: number;
  secondSize?: number;
  dtbSize?: number;
  pageSize?: number;
  cmdline?: string;
  extraCmdline?: string;
  boardName?: string;
  avbVersion?: string;
  rollbackIndex?: number;
  avbFlags?: number;
  isVerityDisabled?: boolean;
  isVerificationDisabled?: boolean;
  releaseString?: string;
  sparseBlockSize?: number;
  sparseTotalBlocks?: number;
  rootDetections: RootDetectionItem[];
  extractedProperties: Record<string, string>;
  summaryText: string;
}

export interface UnpackPartitionResult {
  success: boolean;
  outputDir: string;
  extractedFiles: string[];
  summary: string;
  error?: string;
}
