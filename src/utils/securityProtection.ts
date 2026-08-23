/**
 * 安全防护辅助类（轻量化）
 */
export class SecurityProtection {
  private static instance: SecurityProtection;
  private protectionEnabled = false;
  private refreshProtectionEnabled = false;

  private constructor() {}

  public static getInstance(): SecurityProtection {
    if (!SecurityProtection.instance) {
      SecurityProtection.instance = new SecurityProtection();
    }
    return SecurityProtection.instance;
  }

  public setProtectionEnabled(_enabled: boolean): void {
    this.protectionEnabled = _enabled;
  }

  public setRefreshProtectionEnabled(_enabled: boolean): void {
    this.refreshProtectionEnabled = _enabled;
  }

  public setDevToolsDetectedCallback(_callback: () => void): void {}

  public isProtectionActive(): boolean {
    return this.protectionEnabled;
  }
}

export const securityProtection = SecurityProtection.getInstance();
