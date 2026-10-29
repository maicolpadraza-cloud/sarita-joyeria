import { createPool, type Pool } from "mysql2/promise";

declare global {
  var saritaMysqlPool: Pool | undefined;
}

function getDatabaseConfig() {
  const requiredVariables = [
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "DB_SSL",
  ] as const;
  const missingVariables = requiredVariables.filter(
    (variable) => !process.env[variable]?.trim(),
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missingVariables.join(", ")}`,
    );
  }

  const host = process.env.DB_HOST!.trim().toLowerCase();
  if (["localhost", "127.0.0.1", "::1"].includes(host)) {
    throw new Error("Local database hosts are disabled; configure the TiDB Cloud host.");
  }

  const port = Number(process.env.DB_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("DB_PORT must be an integer between 1 and 65535.");
  }

  const sslSetting = process.env.DB_SSL?.trim().toLowerCase();
  if (sslSetting !== "true") {
    throw new Error("DB_SSL=true is required for TiDB Cloud connections.");
  }

  return {
    host: process.env.DB_HOST!,
    port,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  };
}

export function validateProductionDatabaseConfig(): void {
  getDatabaseConfig();
}

function createDatabasePool(): Pool {
  const config = getDatabaseConfig();

  return createPool({
    ...config,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 20,
  });
}

function getDatabasePool(): Pool {
  return (globalThis.saritaMysqlPool ??= createDatabasePool());
}

export const db = new Proxy({} as Pool, {
  get(_target, property) {
    const pool = getDatabasePool();
    const value = Reflect.get(pool, property, pool);
    return typeof value === "function" ? value.bind(pool) : value;
  },
});
