import pino from 'pino';
import { Worker, Queue } from 'bullmq';
import { getEnv } from '@growthos/config';

const env = getEnv();

const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port || '6379'),
};

// Phase 1: Notifications worker (stub — expands in Phase 2)
const notificationsWorker = new Worker(
  'notifications',
  async (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Processing notification job');
    // Phase 1: just log. Real implementation comes in Phase 2+.
    logger.info({ data: job.data }, 'Notification job data');
  },
  {
    connection,
    concurrency: 5,
  },
);

notificationsWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Notification job completed');
});

notificationsWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Notification job failed');
});

logger.info('GrowthOS Worker started');
logger.info({ queues: ['notifications'] }, 'Listening on queues');

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down worker...');
  await notificationsWorker.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
