import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../types/device";
import { FastbootPartitionListResult, PartitionImageInspection } from "../types/fastbootPartition";
import { logService } from "./logService";

class FastbootPartitionService {
  /**
   * 获取 Fastboot 模式下设备的分区列表
   */
  async getFastbootPartitions(serial: string): Promise<FastbootPartitionListResult> {
    try {
      logService.info(`获取设备分区列表: ${serial}`, "FastbootPartitionService");
      return await invoke<FastbootPartitionListResult>("get_fastboot_partitions", { serial });
    } catch (error: any) {
      logService.error(`获取分区列表失败: ${error?.message || error}`, "FastbootPartitionService");
      throw error;
    }
  }

  /**
   * 刷入镜像到指定分区
   */
  async flashPartition(
    serial: string,
    partition: string,
    filePath: string,
    slot?: string,
    disableVerity?: boolean,
    disableVerification?: boolean
  ): Promise<CommandResult> {
    try {
      logService.info(
        `刷入分区: serial=${serial}, part=${partition}, file=${filePath}, slot=${slot}`,
        "FastbootPartitionService"
      );
      return await invoke<CommandResult>("fastboot_flash_partition", {
        serial,
        partition,
        filePath,
        slot: slot || null,
        disableVerity: disableVerity ?? false,
        disableVerification: disableVerification ?? false,
      });
    } catch (error: any) {
      logService.error(`刷入分区失败: ${error?.message || error}`, "FastbootPartitionService");
      throw error;
    }
  }

  /**
   * 从设备拉取/备份分区 (fastboot fetch)
   */
  async fetchPartition(serial: string, partition: string, outputPath: string): Promise<CommandResult> {
    try {
      logService.info(
        `备份拉取分区: serial=${serial}, part=${partition}, out=${outputPath}`,
        "FastbootPartitionService"
      );
      return await invoke<CommandResult>("fastboot_fetch_partition", {
        serial,
        partition,
        outputPath,
      });
    } catch (error: any) {
      logService.error(`备份分区失败: ${error?.message || error}`, "FastbootPartitionService");
      throw error;
    }
  }

  /**
   * 擦除指定分区 (fastboot erase)
   */
  async erasePartition(serial: string, partition: string, slot?: string): Promise<CommandResult> {
    try {
      logService.info(`擦除分区: serial=${serial}, part=${partition}, slot=${slot}`, "FastbootPartitionService");
      return await invoke<CommandResult>("fastboot_erase_partition", {
        serial,
        partition,
        slot: slot || null,
      });
    } catch (error: any) {
      logService.error(`擦除分区失败: ${error?.message || error}`, "FastbootPartitionService");
      throw error;
    }
  }

  /**
   * 切换活动 A/B 槽位
   */
  async switchActiveSlot(serial: string, slot: string): Promise<CommandResult> {
    try {
      logService.info(`切换活动槽位: serial=${serial}, slot=${slot}`, "FastbootPartitionService");
      return await invoke<CommandResult>("switch_ab_partition", {
        serial,
        slot,
      });
    } catch (error: any) {
      logService.error(`切换槽位失败: ${error?.message || error}`, "FastbootPartitionService");
      throw error;
    }
  }

  /**
   * 深度二进制解包并解析分区镜像文件元数据
   */
  async inspectPartitionImage(filePath: string): Promise<PartitionImageInspection> {
    try {
      logService.info(`解包分析镜像: ${filePath}`, "FastbootPartitionService");
      return await invoke<PartitionImageInspection>("inspect_partition_image", { filePath });
    } catch (error: any) {
      logService.error(`解包分析镜像失败: ${error?.message || error}`, "FastbootPartitionService");
      throw error;
    }
  }

  /**
   * 真实解包镜像中的组件 (Kernel, Ramdisk, DTB等) 到指定目录
   */
  async unpackPartitionImage(imagePath: string, outputDir: string): Promise<any> {
    try {
      logService.info(`解包分区组件: ${imagePath} -> ${outputDir}`, "FastbootPartitionService");
      return await invoke("unpack_partition_image", { imagePath, outputDir });
    } catch (error: any) {
      logService.error(`解包分区组件失败: ${error?.message || error}`, "FastbootPartitionService");
      throw error;
    }
  }
}

export const fastbootPartitionService = new FastbootPartitionService();
