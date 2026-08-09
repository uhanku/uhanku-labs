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
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

const projects = [
  {
    name: "doc-llm",
    description: "A document workspace for uploading PDFs, ingesting their contents, querying them with AI, and chatting per document.",
    repoUrl: "https://github.com/uhanku/doc-llm",
  },
  {
    name: "gpt-runner",
    description: "A NestJS API for creating jobs, preparing disposable workspaces, running commands, and collecting artifacts.",
    repoUrl: "https://github.com/uhanku/gpt-runner",
  },
  {
    name: "chat bot open",
    description: "A chat assistant app for visitor conversations, lead capture, long threads, summaries, and request limits.",
    repoUrl: "https://github.com/uhanku/chat-bot-open",
  },
];

try {
  for (const project of projects) {
    await prisma.webApp.upsert({
      where: { name: project.name },
      update: { description: project.description, repoUrl: project.repoUrl },
      create: project,
    });
  }
} finally {
  await prisma.$disconnect();
}
