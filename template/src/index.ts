import 'dotenv/config';
import express, { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import morgan from 'morgan';
import prisma from './lib/prisma.js';

const app = express();
const PORT = process.env.PORT;
if (!PORT) throw new Error('PORT is not in the .env file');

app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'adorex app running' });
});

/**
 * @NOTE MAKE SURE TO DELETE OR EDIT THIS ENDPOINT IF YOU REMOVED THE DEFAULT USER TABLE
 */
app.get('/health', async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  res.json({ ok: true, data: users });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
