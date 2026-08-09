import assert from "node:assert/strict";
import test from "node:test";
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

const databaseUrl = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.slice(1),
});
const prisma = new PrismaClient({ adapter });

test.after(async () => prisma.$disconnect());

test("migrations create the required tables and seed records", async () => {
  const tables = await prisma.$queryRaw<Array<{ tableName: string }>>`SELECT TABLE_NAME AS tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()`;
  const tableNames = tables.map(({ tableName }) => tableName);
  assert.ok(tableNames.includes("users"));
  assert.ok(tableNames.includes("web_apps"));

  const webApps = await prisma.webApp.findMany({ orderBy: { name: "asc" } });
  assert.deepEqual(webApps, [
    {
      id: webApps[0].id,
      name: "chat bot open",
      description: "A chat assistant app for visitor conversations, lead capture, long threads, summaries, and request limits.",
      repoUrl: "https://github.com/uhanku/chat-bot-open",
    },
    {
      id: webApps[1].id,
      name: "doc-llm",
      description: "A document workspace for uploading PDFs, ingesting their contents, querying them with AI, and chatting per document.",
      repoUrl: "https://github.com/uhanku/doc-llm",
    },
    {
      id: webApps[2].id,
      name: "gpt-runner",
      description: "A NestJS API for creating jobs, preparing disposable workspaces, running commands, and collecting artifacts.",
      repoUrl: "https://github.com/uhanku/gpt-runner",
    },
  ]);

  const columns = await prisma.$queryRaw<Array<{ tableName: string; columnName: string }>>`SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('users', 'web_apps')`;
  const columnSet = new Set(columns.map(({ tableName, columnName }) => `${tableName}.${columnName}`));
  for (const column of ["users.username", "users.password", "users.webapp_id", "web_apps.name", "web_apps.description", "web_apps.repo_url"]) {
    assert.ok(columnSet.has(column), `missing ${column}`);
  }

  const foreignKeys = await prisma.$queryRaw<Array<{ columnName: string; referencedTable: string }>>`SELECT COLUMN_NAME AS columnName, REFERENCED_TABLE_NAME AS referencedTable FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'webapp_id'`;
  assert.deepEqual(foreignKeys, [{ columnName: "webapp_id", referencedTable: "web_apps" }]);
});
