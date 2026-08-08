import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { requireAuthentication } from './middleware/authentication.js';
import { requestObservability } from './middleware/request-observability.js';
import { accountRouter } from './modules/accounts/account.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { monitoringRouter } from './modules/monitoring/monitoring.routes.js';
import { transactionRouter } from './modules/transactions/transaction.routes.js';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());
app.use(requestObservability);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: '1mb' }));

app.use('/api', monitoringRouter);
app.use('/api/auth', authRouter);
app.use('/api/accounts', requireAuthentication, accountRouter);
app.use('/api/dashboard', requireAuthentication, dashboardRouter);
app.use('/api/transactions', requireAuthentication, transactionRouter);

app.use(notFoundHandler);
app.use(errorHandler);
