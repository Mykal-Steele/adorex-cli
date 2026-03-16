import "dotenv/config";
import express from "express";
import { prisma } from "./utils/prisma.js";
import { logger } from "./utils/logger.js";

const app = express();
const port = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());
app.use(logger);

app.get("/", (_req, res) => {
  res.json({ message: "adorex app running" });
});

app.get("/health", async (_req, res) => {
  const users = await prisma.user.findMany();
  res.json({ ok: true, data: users });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
