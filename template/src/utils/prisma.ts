import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL environment variable");
}

const adapter = new PrismaLibSql({
  url: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

export default prisma;
