/**
 * 优化后的设备统计服务
 * 专为存储空间限制优化，支持高效的数据操作
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, desc, asc, count, sum, avg, max, and, gte, lte, sql, inArray } from 'drizzle-orm';
import { 
  deviceStatsTable, 
  geoCodesTable,
  DeviceStats,
  NewDeviceStats,
  DeviceStatsRequest,
  DeviceStatsResponse,
  StatsOverview,
  CountryStats,
  DeviceActivityTrend,
  GeoLocation,
  BatchRunCountUpdate,
  DeviceStatsFilter,
  DeviceStatsQuery,
  DeviceStatsWithGeo,
  validateDeviceFingerprint,
  validateCountryCode,
  QUERY_LIMITS,
  GEO_CONSTANTS
} from '../database/schema/optimized-device-stats';

export class OptimizedDeviceStatsService {
  private db: ReturnType<typeof drizzle>;

  constructor(databaseUrl: string) {
    const sql = neon(databaseUrl);
    this.db = drizzle(sql);
  }

  /**
   * 记录或更新设备统计
   */
  async recordDeviceStats(request: DeviceStatsRequest): Promise<DeviceStatsResponse> {
    try {
      // 验证设备指纹
      if (!validateDeviceFingerprint(request.deviceFingerprint)) {
        throw new Error('无效的设备指纹格式');
      }

      // 解析地理位置
      const geoLocation = await this.resolveGeoLocation(request.ipAddress);

      // 检查设备是否已存在
      const existingDevice = await this.db
        .select()
        .from(deviceStatsTable)
        .where(eq(deviceStatsTable.deviceFingerprint, request.deviceFingerprint))
        .limit(1);

      if (existingDevice.length > 0) {
        // 更新现有设备
        const device = existingDevice[0];
        const updatedDevice = await this.db
          .update(deviceStatsTable)
          .set({
            runCount: device.runCount + 1,
            lastSeen: new Date(),
            updatedAt: new Date(),
            // 更新系统信息（如果提供）
            ...(request.osVersion && { osVersion: request.osVersion }),
            ...(request.arch && { arch: request.arch }),
          })
          .where(eq(deviceStatsTable.deviceFingerprint, request.deviceFingerprint))
          .returning();

        return {
          success: true,
          installRank: device.installRank,
          runCount: device.runCount + 1,
          isNewDevice: false,
          message: '设备统计已更新'
        };
      } else {
        // 创建新设备记录
        const nextRank = await this.getNextInstallRank();
        
        const newDevice: NewDeviceStats = {
          deviceFingerprint: request.deviceFingerprint,
          installRank: nextRank,
          countryCode: geoLocation?.countryCode || GEO_CONSTANTS.UNKNOWN_COUNTRY,
          regionCode: geoLocation?.regionCode || GEO_CONSTANTS.UNKNOWN_REGION,
          osVersion: request.osVersion || 'unknown',
          arch: request.arch || 'unknown',
          runCount: 1,
        };

        const createdDevice = await this.db
          .insert(deviceStatsTable)
          .values(newDevice)
          .returning();

        return {
          success: true,
          installRank: nextRank,
          runCount: 1,
          isNewDevice: true,
          message: '新设备已记录'
        };
      }
    } catch (error) {
      console.error('记录设备统计失败:', error);
      throw new Error(`记录设备统计失败: ${error.message}`);
    }
  }

  /**
   * 批量更新运行次数
   */
  async batchUpdateRunCounts(updates: BatchRunCountUpdate[]): Promise<number> {
    try {
      let updatedCount = 0;

      // 分批处理，避免单次操作过大
      const batchSize = 100;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        for (const update of batch) {
          if (!validateDeviceFingerprint(update.deviceFingerprint)) {
            continue;
          }

          const result = await this.db
            .update(deviceStatsTable)
            .set({
              runCount: sql`${deviceStatsTable.runCount} + ${update.increment}`,
              lastSeen: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(deviceStatsTable.deviceFingerprint, update.deviceFingerprint));

          updatedCount++;
        }
      }

      return updatedCount;
    } catch (error) {
      console.error('批量更新运行次数失败:', error);
      throw new Error(`批量更新失败: ${error.message}`);
    }
  }

  /**
   * 获取统计概览
   */
  async getStatsOverview(): Promise<StatsOverview> {
    try {
      // 基础统计
      const basicStats = await this.db
        .select({
          totalDevices: count(),
          totalRuns: sum(deviceStatsTable.runCount),
          averageRuns: avg(deviceStatsTable.runCount),
          latestInstallRank: max(deviceStatsTable.installRank),
        })
        .from(deviceStatsTable);

      // 国家数量
      const countriesCount = await this.db
        .select({ count: count() })
        .from(deviceStatsTable)
        .groupBy(deviceStatsTable.countryCode);

      // 活跃设备统计
      const activeLast7Days = await this.db
        .select({ count: count() })
        .from(deviceStatsTable)
        .where(gte(deviceStatsTable.lastSeen, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));

      const activeLast30Days = await this.db
        .select({ count: count() })
        .from(deviceStatsTable)
        .where(gte(deviceStatsTable.lastSeen, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));

      // 热门国家
      const topCountries = await this.getTopCountries(QUERY_LIMITS.STATS_TOP_COUNTRIES);

      // 最近活动趋势
      const recentActivity = await this.getRecentActivityTrend(QUERY_LIMITS.RECENT_ACTIVITY_DAYS);

      const stats = basicStats[0];
      return {
        totalDevices: Number(stats.totalDevices) || 0,
        totalRuns: Number(stats.totalRuns) || 0,
        averageRunsPerDevice: Number(stats.averageRuns) || 0,
        countriesCount: countriesCount.length,
        latestInstallRank: Number(stats.latestInstallRank) || 0,
        activeLast7Days: Number(activeLast7Days[0]?.count) || 0,
        activeLast30Days: Number(activeLast30Days[0]?.count) || 0,
        topCountries,
        recentActivity,
      };
    } catch (error) {
      console.error('获取统计概览失败:', error);
      throw new Error(`获取统计概览失败: ${error.message}`);
    }
  }

  /**
   * 获取热门国家统计
   */
  async getTopCountries(limit: number = 10): Promise<CountryStats[]> {
    try {
      const results = await this.db
        .select({
          countryCode: deviceStatsTable.countryCode,
          countryName: geoCodesTable.countryName,
          deviceCount: count(),
          totalRuns: sum(deviceStatsTable.runCount),
          averageRuns: avg(deviceStatsTable.runCount),
          lastActivity: max(deviceStatsTable.lastSeen),
        })
        .from(deviceStatsTable)
        .leftJoin(geoCodesTable, 
          and(
            eq(deviceStatsTable.countryCode, geoCodesTable.countryCode),
            eq(deviceStatsTable.regionCode, geoCodesTable.regionCode)
          )
        )
        .groupBy(deviceStatsTable.countryCode, geoCodesTable.countryName)
        .orderBy(desc(count()))
        .limit(limit);

      return results.map(row => ({
        countryCode: row.countryCode || GEO_CONSTANTS.UNKNOWN_COUNTRY,
        countryName: row.countryName || GEO_CONSTANTS.DEFAULT_COUNTRY_NAME,
        deviceCount: Number(row.deviceCount),
        totalRuns: Number(row.totalRuns) || 0,
        averageRuns: Number(row.averageRuns) || 0,
        lastActivity: row.lastActivity || new Date(),
      }));
    } catch (error) {
      console.error('获取热门国家失败:', error);
      throw new Error(`获取热门国家失败: ${error.message}`);
    }
  }

  /**
   * 获取最近活动趋势
   */
  async getRecentActivityTrend(days: number = 30): Promise<DeviceActivityTrend[]> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const results = await this.db
        .select({
          date: sql<string>`DATE(${deviceStatsTable.lastSeen})`,
          activeDevices: count(),
          totalRuns: sum(deviceStatsTable.runCount),
        })
        .from(deviceStatsTable)
        .where(gte(deviceStatsTable.lastSeen, startDate))
        .groupBy(sql`DATE(${deviceStatsTable.lastSeen})`)
        .orderBy(desc(sql`DATE(${deviceStatsTable.lastSeen})`));

      // 获取新设备数据
      const newDevicesData = await this.db
        .select({
          date: sql<string>`DATE(${deviceStatsTable.firstSeen})`,
          newDevices: count(),
        })
        .from(deviceStatsTable)
        .where(gte(deviceStatsTable.firstSeen, startDate))
        .groupBy(sql`DATE(${deviceStatsTable.firstSeen})`)
        .orderBy(desc(sql`DATE(${deviceStatsTable.firstSeen})`));

      // 合并数据
      const newDevicesMap = new Map(
        newDevicesData.map(item => [item.date, Number(item.newDevices)])
      );

      return results.map(row => ({
        date: row.date,
        activeDevices: Number(row.activeDevices),
        newDevices: newDevicesMap.get(row.date) || 0,
        totalRuns: Number(row.totalRuns) || 0,
      }));
    } catch (error) {
      console.error('获取活动趋势失败:', error);
      throw new Error(`获取活动趋势失败: ${error.message}`);
    }
  }

  /**
   * 查询设备统计（支持过滤和分页）
   */
  async queryDeviceStats(filter: DeviceStatsFilter): Promise<DeviceStatsQuery> {
    try {
      const conditions = [];
      
      if (filter.countryCode) {
        conditions.push(eq(deviceStatsTable.countryCode, filter.countryCode));
      }
      if (filter.regionCode) {
        conditions.push(eq(deviceStatsTable.regionCode, filter.regionCode));
      }
      if (filter.osVersion) {
        conditions.push(eq(deviceStatsTable.osVersion, filter.osVersion));
      }
      if (filter.arch) {
        conditions.push(eq(deviceStatsTable.arch, filter.arch));
      }
      if (filter.minRunCount) {
        conditions.push(gte(deviceStatsTable.runCount, filter.minRunCount));
      }
      if (filter.maxRunCount) {
        conditions.push(lte(deviceStatsTable.runCount, filter.maxRunCount));
      }
      if (filter.dateFrom) {
        conditions.push(gte(deviceStatsTable.firstSeen, filter.dateFrom));
      }
      if (filter.dateTo) {
        conditions.push(lte(deviceStatsTable.firstSeen, filter.dateTo));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const limit = Math.min(filter.limit || QUERY_LIMITS.DEFAULT_PAGE_SIZE, QUERY_LIMITS.MAX_PAGE_SIZE);
      const offset = filter.offset || 0;

      // 获取总数
      const totalResult = await this.db
        .select({ count: count() })
        .from(deviceStatsTable)
        .where(whereClause);

      const total = Number(totalResult[0]?.count) || 0;

      // 获取数据
      const devices = await this.db
        .select()
        .from(deviceStatsTable)
        .leftJoin(geoCodesTable, 
          and(
            eq(deviceStatsTable.countryCode, geoCodesTable.countryCode),
            eq(deviceStatsTable.regionCode, geoCodesTable.regionCode)
          )
        )
        .where(whereClause)
        .orderBy(desc(deviceStatsTable.lastSeen))
        .limit(limit)
        .offset(offset);

      const devicesWithGeo: DeviceStatsWithGeo[] = devices.map(row => ({
        ...row.device_stats,
        geoInfo: row.geo_codes || undefined,
      }));

      return {
        devices: devicesWithGeo,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error('查询设备统计失败:', error);
      throw new Error(`查询设备统计失败: ${error.message}`);
    }
  }

  /**
   * 获取下一个安装排名
   */
  private async getNextInstallRank(): Promise<number> {
    try {
      const result = await this.db
        .select({ maxRank: max(deviceStatsTable.installRank) })
        .from(deviceStatsTable);

      return (Number(result[0]?.maxRank) || 0) + 1;
    } catch (error) {
      console.error('获取下一个安装排名失败:', error);
      return 1; // 默认返回1
    }
  }

  /**
   * 解析地理位置
   */
  private async resolveGeoLocation(ipAddress?: string): Promise<GeoLocation | null> {
    if (!ipAddress) {
      return null;
    }

    try {
      // 这里可以集成IP地理位置服务
      // 暂时返回默认值
      return {
        countryCode: 'CN',
        countryName: '中国',
        regionCode: 'UN',
        regionName: '未知',
      };
    } catch (error) {
      console.error('解析地理位置失败:', error);
      return null;
    }
  }

  /**
   * 数据库性能监控
   */
  async getDatabasePerformanceInfo() {
    try {
      const result = await this.db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE tablename IN ('device_stats', 'geo_codes')
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);

      return result.rows;
    } catch (error) {
      console.error('获取数据库性能信息失败:', error);
      throw new Error(`获取数据库性能信息失败: ${error.message}`);
    }
  }

  /**
   * 数据清理（删除长期不活跃的设备）
   */
  async cleanupInactiveDevices(inactiveDays: number = 365, dryRun: boolean = true): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);
      
      if (dryRun) {
        // 只统计，不删除
        const result = await this.db
          .select({ count: count() })
          .from(deviceStatsTable)
          .where(
            and(
              lte(deviceStatsTable.lastSeen, cutoffDate),
              eq(deviceStatsTable.runCount, 1)
            )
          );
        
        return Number(result[0]?.count) || 0;
      } else {
        // 实际删除
        const result = await this.db
          .delete(deviceStatsTable)
          .where(
            and(
              lte(deviceStatsTable.lastSeen, cutoffDate),
              eq(deviceStatsTable.runCount, 1)
            )
          );

        return result.rowCount || 0;
      }
    } catch (error) {
      console.error('清理不活跃设备失败:', error);
      throw new Error(`清理不活跃设备失败: ${error.message}`);
    }
  }
}
