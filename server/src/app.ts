import express from 'express';
import cors from 'cors';
import { envConfig } from './config';
import callsRoutes from './calls/calls.routes';
import aiRoutes from './ai/ai.routes';
import ttsRoutes from './tts/tts.routes';
import authRoutes from './auth/auth.routes';
import agentsRoutes from './agents/agents.routes';
import callLogsRoutes from './calllogs/calllogs.routes';
import companiesRoutes from './companies/companies.routes';
import contactsRoutes from './contacts/contacts.routes';
import promptLibraryRoutes from './promptlibrary/promptlibrary.routes';
import settingsRoutes from './settings/settings.routes';
import scheduledCallsRoutes from './scheduledcalls/scheduledcalls.routes';

const app = express();

// Middleware
app.use(cors({ origin: envConfig.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Suppress ECONNABORTED / ECONNRESET when the browser disconnects mid-request.
// Without this, Express logs a noisy unhandled error for every hot-reload or
// navigation that races with a slow API call (e.g. Sarvam TTS preview).
app.use((_req, res, next) => {
  const onSocketError = (err: NodeJS.ErrnoException) => {
    if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET') return;
    console.error('[Socket error]', err);
  };
  res.socket?.on('error', onSocketError);
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/calllogs', callLogsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/prompts', promptLibraryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/scheduled-calls', scheduledCallsRoutes);

export default app;
