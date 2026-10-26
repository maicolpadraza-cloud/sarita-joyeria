import { createPool, type Pool } from "mysql2/promise";

declare global {
  var saritaMysqlPool: Pool | undefined;
}

function createDatabasePool(): Pool {
  return createPool({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? "3306"),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "sarita_joyeria",
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

export const db =
  process.env.NODE_ENV === "production"
    ? createDatabasePool()
    : (globalThis.saritaMysqlPool ??= createDatabasePool());
