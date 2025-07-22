# Triplit 数据迁移系统

这个迁移系统为 302.AI Studio 提供了一个简洁高效的数据库迁移解决方案，专注于 Triplit 的向前数据迁移。

## 核心特性

- **向前迁移**: 专注于数据向前迁移，不支持回滚
- **状态管理**: 使用 Electron Store 持久化迁移状态
- **依赖管理**: 支持迁移之间的依赖关系
- **自动执行**: 在主进程初始化时自动运行迁移
- **类型安全**: 完全的 TypeScript 支持
- **简洁设计**: 移除复杂的回滚和批次管理，专注核心功能

## 架构概览

```
src/
├── shared/triplit/migrations/     # 共享的迁移核心逻辑
│   ├── types.ts                   # 类型定义
│   ├── base-migration.ts          # 抽象基类
│   ├── migration-manager.ts       # 主控制器
│   └── index.ts                   # 导出文件
└── main/triplit/migrations/       # 主进程专用实现
    ├── main-migration-store.ts    # Electron Store 存储实现
    ├── index.ts                   # 主进程工厂函数
    └── versions/                  # 具体迁移实现
        └── 1.1.0.add-message-priority.ts
```

## 快速开始

### 1. 创建一个简单的字段迁移

```typescript
import { FieldMigration } from "@shared/triplit/migrations";
import type { CollectionMigrationConfig, DataFillFunction } from "@shared/triplit/migrations";

export class AddUserStatusMigration extends FieldMigration {
  public readonly version = "1.0.1";
  public readonly description = "Add status field to users";
  public readonly dependencies: string[] = [];

  private fillUserStatus: DataFillFunction = async (client, entity, context) => {
    // 为现有用户设置默认状态
    return {
      status: entity.last_seen ? "active" : "inactive"
    };
  };

  protected getMigrationConfig(): CollectionMigrationConfig[] {
    return [
      {
        collectionName: "users",
        fields: [
          {
            fieldName: "status",
            fillFunction: this.fillUserStatus,
          }
        ]
      }
    ];
  }
}
```

### 2. 注册并运行迁移

```typescript
import { migrationManager } from "@main/triplit/client";

// 注册迁移
migrationManager.registerMigration(new AddUserStatusMigration());

// 迁移会在主进程初始化时自动运行
```

## 迁移策略

### 推荐的字段添加流程

1. **添加 Optional 字段到 Schema**：
```typescript
// Schema 更新
messages: {
  schema: S.Schema({
    id: S.Id(),
    content: S.String(),
    priority: S.Optional(
      S.String({
        enum: ["high", "normal", "low"],
        default: "normal",
      }),
    ), // 新字段设为 Optional
  })
}
```

2. **创建迁移填充数据**：
```typescript
export class AddMessagePriorityMigration extends FieldMigration {
  public readonly version = "1.1.0";
  public readonly description = "Add priority field to messages";
  
  private fillMessagePriority: DataFillFunction = async (client, entity, context) => {
    // 智能设置优先级
    const content = entity.content?.toLowerCase() || "";
    if (urgentKeywords.some(keyword => content.includes(keyword))) {
      return { priority: "high" };
    }
    return { priority: "normal" };
  };

  protected getMigrationConfig(): CollectionMigrationConfig[] {
    return [
      {
        collectionName: "messages",
        fields: [
          {
            fieldName: "priority",
            fillFunction: this.fillMessagePriority,
          }
        ]
      }
    ];
  }
}
```

3. **（可选）后续版本移除 Optional**：
当所有数据都有该字段后，可以手动将 schema 中的字段改为必填：
```typescript
priority: S.String({
  enum: ["high", "normal", "low"],
  default: "normal",
}), // 移除 S.Optional 包装
```

## 复杂迁移

对于复杂的数据结构变更，继承 `BaseMigration` 类：

```typescript
export class RefactorDataMigration extends BaseMigration {
  public readonly version = "2.0.0";
  public readonly description = "Major data structure refactoring";
  public readonly dependencies = ["1.1.0"];

  public async up(context: MigrationContext): Promise<void> {
    const { client, logger } = context;
    
    // 复杂的数据转换逻辑
    const threadsQuery = client.query("threads");
    const threads = await client.fetch(threadsQuery);
    
    for (const [threadId, thread] of threads) {
      // 自定义迁移逻辑
      await this.transformThreadData(client, threadId, thread);
    }
  }
  
  private async transformThreadData(client: any, threadId: string, thread: any) {
    // 具体的数据转换实现
  }
}
```

## 迁移管理

### 查看迁移状态

```typescript
import { migrationManager } from "@main/triplit/client";

// 获取统计信息
const stats = await migrationManager.getMigrationStats();
console.log(`${stats.completed}/${stats.total} migrations completed`);
```

### 手动运行迁移

```typescript
import { triplitClient } from "@main/triplit/client";
import { schema } from "@shared/triplit/schema";

// 手动运行迁移
const result = await migrationManager.runMigrations(triplitClient, schema);

if (result.success) {
  console.log(`${result.executedCount} migrations completed`);
} else {
  console.error("Migration failures:", result.failures);
}
```

## 最佳实践

### 1. 版本命名

使用语义化版本号：
- `1.0.0`: 主版本
- `1.1.0`: 添加新功能/字段
- `1.1.1`: 修复数据问题

### 2. 数据填充函数

```typescript
const fillFunction: DataFillFunction = async (client, entity, context) => {
  const { logger } = context;
  
  try {
    // 智能数据填充逻辑
    const newValue = computeNewValue(entity);
    
    logger.debug(`Updating entity ${entity.id}`);
    return { newField: newValue };
    
  } catch (error) {
    logger.error(`Failed to fill data for entity ${entity.id}:`, error);
    // 返回默认值
    return { newField: "default" };
  }
};
```

### 3. 错误处理

```typescript
export class SafeMigration extends FieldMigration {
  protected getMigrationConfig(): CollectionMigrationConfig[] {
    return [
      {
        collectionName: "collection",
        fields: [/* ... */],
        customMigration: async (context) => {
          try {
            // 执行自定义逻辑
            await this.complexOperation(context);
          } catch (error) {
            context.logger.error("Custom migration failed:", error);
            throw error; // 失败时停止迁移
          }
        }
      }
    ];
  }
}
```

### 4. 测试迁移

```typescript
// 在测试环境中验证迁移
describe("AddUserStatusMigration", () => {
  let migrationManager: MigrationManager;
  let testClient: TriplitClient<any>;

  beforeEach(async () => {
    // 设置测试环境
    migrationManager = createMainMigrationManager({
      autoRun: false,
      logger: testLogger
    });
    
    migrationManager.registerMigration(new AddUserStatusMigration());
  });

  it("should add status field to existing users", async () => {
    // 插入测试数据
    await testClient.insert("users", { id: "1", name: "Test User" });
    
    // 运行迁移
    const result = await migrationManager.runMigrations(testClient, schema);
    
    // 验证结果
    expect(result.success).toBe(true);
    
    const user = await testClient.fetchOne("users", "1");
    expect(user?.status).toBeDefined();
  });
});
```

## 系统限制

1. **仅向前迁移**: 系统不支持回滚功能，确保迁移前做好备份
2. **主进程执行**: 迁移只在主进程中执行，渲染进程不参与迁移
3. **顺序执行**: 迁移按版本号顺序执行，确保依赖关系正确

## 注意事项

1. **备份数据**: 在生产环境运行迁移前务必备份数据
2. **测试验证**: 在测试环境充分验证迁移逻辑
3. **监控日志**: 密切关注迁移执行日志
4. **Schema 同步**: 手动确保 schema 定义与迁移状态同步

## 存储位置

迁移状态存储在：
```
~/Library/Application Support/302-ai-studio/triplit-migrations.json (macOS)
%APPDATA%/302-ai-studio/triplit-migrations.json (Windows)
~/.config/302-ai-studio/triplit-migrations.json (Linux)
```

## 故障排除

### 常见问题

1. **迁移失败**: 检查日志，验证数据完整性
2. **依赖问题**: 确保依赖的迁移已完成
3. **类型错误**: 检查 schema 定义和迁移逻辑的匹配
4. **性能问题**: 对大量数据使用批量处理

### 调试技巧

```typescript
// 启用详细日志
const migrationManager = createMainMigrationManager({
  logger: {
    ...console,
    debug: (...args) => console.log('[DEBUG]', ...args)
  }
});

// 查看存储状态
const store = new MainMigrationStore();
const allMigrations = await store.getAllMigrations();
console.log('Migration history:', allMigrations);
```

## 架构设计原则

1. **单一职责**: 迁移系统专注于数据迁移，不处理 schema 变更
2. **简单可靠**: 移除复杂的回滚和批次管理，提高稳定性
3. **类型安全**: 全面的 TypeScript 支持，减少运行时错误
4. **可测试性**: 良好的抽象设计，方便单元测试