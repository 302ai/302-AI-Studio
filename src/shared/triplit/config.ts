import path from "node:path";
import { app } from "electron";

// Triplit服务器配置
export interface TrilitServerConfig {
  port: number;
  verboseLogs: boolean;
  jwtSecret: string;
  projectId: string;
  externalJwtSecret?: string;
  maxPayloadMb?: string;
  localDatabaseUrl?: string;
}

export const defaultTrilitConfig: TrilitServerConfig = {
  port: 8080,
  verboseLogs: false,
  jwtSecret: "default-jwt-secret-change-in-production",
  projectId: "chat-app-triplit",
  externalJwtSecret: undefined,
  maxPayloadMb: "10",
  localDatabaseUrl: undefined, // Will be set dynamically
};

export function getTrilitConfig(): TrilitServerConfig {
  const userDataPath = app.getPath("userData");
  const defaultDatabaseDir = path.join(userDataPath, "triplit");
  const defaultDatabaseFile = path.join(defaultDatabaseDir, "db.sqlite");

  console.log("Default database file:", defaultDatabaseFile);

  const config = {
    port: +(process.env.PORT || defaultTrilitConfig.port),
    verboseLogs: !!(
      process.env.VERBOSE_LOGS || defaultTrilitConfig.verboseLogs
    ),
    jwtSecret: process.env.JWT_SECRET || defaultTrilitConfig.jwtSecret,
    projectId: process.env.PROJECT_ID || defaultTrilitConfig.projectId,
    externalJwtSecret: process.env.EXTERNAL_JWT_SECRET,
    maxPayloadMb: process.env.MAX_BODY_SIZE || defaultTrilitConfig.maxPayloadMb,
    localDatabaseUrl: process.env.LOCAL_DATABASE_URL || defaultDatabaseFile,
  };

  console.log("Final Triplit config:", config);
  return config;
}
