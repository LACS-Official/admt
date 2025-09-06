import { SecurityConfigService } from './SecurityConfigService';
import { logService } from './logService';
import CryptoJS from 'crypto-js';

export interface TransferData {
  id: string;
  data: any;
  timestamp: number;
  checksum?: string;
}

export class SecureDataTransferService {
  private static instance: SecureDataTransferService | null = null;
  private securityConfig: SecurityConfigService;
  private initialized = false;

  private constructor() {
    this.securityConfig = SecurityConfigService.getInstance();
  }

  static getInstance(): SecureDataTransferService {
    if (!SecureDataTransferService.instance) {
      SecureDataTransferService.instance = new SecureDataTransferService();
    }
    return SecureDataTransferService.instance;
  }

  async initialize(): Promise<void> {
    try {
      if (!this.securityConfig.isInitialized()) {
        await this.securityConfig.initialize();
      }
      
      this.initialized = true;
      logService.info('安全数据传输服务初始化成功', 'SecureDataTransferService');
    } catch (error) {
      logService.error('安全数据传输服务初始化失败', 'SecureDataTransferService', error);
      throw error;
    }
  }

  private encryptData(data: any): string {
    const config = this.securityConfig.getConfig();
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, config.encryptionKey).toString();
  }

  private decryptData(encryptedData: string): any {
    const config = this.securityConfig.getConfig();
    const bytes = CryptoJS.AES.decrypt(encryptedData, config.encryptionKey);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  }

  async sendSecureData(data: any): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('安全数据传输服务未初始化');
    }

    try {
      const transferData: TransferData = {
        id: this.generateId(),
        data: this.encryptData(data),
        timestamp: Date.now(),
        checksum: this.generateChecksum(data)
      };

      const config = this.securityConfig.getConfig();
      const response = await fetch(`${config.apiEndpoint}/secure-transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
        signal: AbortSignal.timeout(config.timeout)
      });

      if (!response.ok) {
        throw new Error(`传输失败: ${response.status} ${response.statusText}`);
      }

      logService.info('安全数据传输成功', 'SecureDataTransferService', { id: transferData.id });
      return true;
    } catch (error) {
      logService.error('安全数据传输失败', 'SecureDataTransferService', error);
      return false;
    }
  }

  private generateId(): string {
    return `transfer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateChecksum(data: any): string {
    return CryptoJS.MD5(JSON.stringify(data)).toString();
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}