import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from './generated/prisma/client';

async function prepareDatabase() {
  const database = process.env.DATABASE_NAME;
  if (!database) throw new Error('DATABASE_NAME is required.');

  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb({
      host: requiredEnvironmentVariable('DATABASE_HOST'),
      port: Number(requiredEnvironmentVariable('DATABASE_PORT')),
      user: requiredEnvironmentVariable('DATABASE_USER'),
      password: requiredEnvironmentVariable('DATABASE_PASSWORD'),
      database,
    }),
  });

  try {
    const tables = await prisma.$queryRawUnsafe<Array<{ tableCount: bigint }>>(
      `SELECT COUNT(*) AS tableCount
       FROM information_schema.tables
       WHERE table_schema = ? AND table_name = 'event_quiz_attempts'`,
      database,
    );

    if (Number(tables[0]?.tableCount ?? 0) > 0) {
      await prisma.$executeRawUnsafe(`
        DELETE duplicate_attempt
        FROM event_quiz_attempts AS duplicate_attempt
        INNER JOIN event_quiz_attempts AS first_attempt
          ON duplicate_attempt.event_id = first_attempt.event_id
          AND duplicate_attempt.guest_id = first_attempt.guest_id
          AND duplicate_attempt.id > first_attempt.id
      `);
    }
  } finally {
    await prisma.$disconnect();
  }
}

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

void prepareDatabase();
