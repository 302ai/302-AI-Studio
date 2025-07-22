/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import type { TriplitClient } from "@triplit/client";

/**
 * 迁移版本号类型
 * 格式: "major.minor.patch" (e.g., "1.0.0", "1.2.3")
 */
export type MigrationVersion = string;

/**
 * 迁移状态
 */
export enum MigrationStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress", 
  COMPLETED = "completed",
  FAILED = "failed"
}

/**
 * 迁移执行上下文
 */
export interface MigrationContext {
  /** Triplit 客户端实例 */
  client: TriplitClient<any>;
  /** 当前 schema */
  schema: any;
  /** 迁移记录存储 */
  migrationStore: IMigrationStore;
  /** 日志记录器 */
  logger: Console | any;
}

/**
 * 迁移记录
 */
export interface MigrationRecord {
  /** 迁移版本号 */
  version: MigrationVersion;
  /** 迁移状态 */
  status: MigrationStatus;
  /** 执行开始时间 */
  startedAt?: Date;
  /** 执行完成时间 */
  completedAt?: Date;
  /** 错误信息 */
  error?: string;
}

/**
 * 迁移存储接口
 */
export interface IMigrationStore {
  /** 获取所有迁移记录 */
  getAllMigrations(): Promise<MigrationRecord[]>;
  
  /** 获取指定版本的迁移记录 */
  getMigration(version: MigrationVersion): Promise<MigrationRecord | null>;
  
  /** 保存迁移记录 */
  saveMigration(record: MigrationRecord): Promise<void>;
  
  /** 更新迁移记录 */
  updateMigration(version: MigrationVersion, updates: Partial<MigrationRecord>): Promise<void>;
  
  /** 删除迁移记录 */
  deleteMigration(version: MigrationVersion): Promise<void>;
  
  /** 获取已完成的迁移版本列表 */
  getCompletedMigrations(): Promise<MigrationVersion[]>;
  
  /** 获取失败的迁移版本列表 */
  getFailedMigrations(): Promise<MigrationVersion[]>;
}

/**
 * 数据填充函数类型
 */
export type DataFillFunction<T = any> = (
  client: TriplitClient<any>,
  entity: T,
  context: MigrationContext
) => Promise<Partial<T>> | Partial<T>;

/**
 * 字段迁移配置
 */
export interface FieldMigrationConfig {
  /** 字段名 */
  fieldName: string;
  /** 数据填充函数 */
  fillFunction?: DataFillFunction;
}

/**
 * 集合迁移配置
 */
export interface CollectionMigrationConfig {
  /** 集合名称 */
  collectionName: string;
  /** 字段迁移配置 */
  fields: FieldMigrationConfig[];
  /** 自定义迁移逻辑 */
  customMigration?: (context: MigrationContext) => Promise<void>;
}