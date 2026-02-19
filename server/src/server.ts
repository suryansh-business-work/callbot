import http from 'http';
import app from './app';
import { envConfig } from './config';
import { connectDB } from './config/db';
import { initSocketIO } from './websocket';
import { startTunnel, getTunnelUrl } from './tunnel';

const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const httpServer = http.createServer(app);

    // Attach Socket.io on dedicated WebSocket port
    initSocketIO(envConfig.WS_PORT);

    httpServer.listen(envConfig.PORT, async () => {
      console.log(`Server running on http://localhost:${envConfig.PORT}`);
      console.log(`WebSocket running on ws://localhost:${envConfig.WS_PORT}`);
      console.log(`Environment: ${envConfig.NODE_ENV}`);

      if (envConfig.OPENAI_API_KEY) {
        console.log('OpenAI: configured ✓');
      } else {
        console.log('OpenAI: not configured (set OPENAI_API_KEY in .env for AI calls)');
      }

      // Auto-start Cloudflare tunnel for Twilio webhooks
      try {
        const url = await startTunnel(envConfig.PORT);
        console.log(`[Tunnel] Public URL ready: ${url}`);
        console.log('[Tunnel] AI conversation calls are now available ✓');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[Tunnel] Could not start: ${msg}`);
        if (
          !envConfig.BASE_URL.includes('localhost') &&
          !envConfig.BASE_URL.includes('127.0.0.1')
        ) {
          console.log(`[Tunnel] Falling back to configured BASE_URL: ${envConfig.BASE_URL}`);
        } else {
          console.warn('[Tunnel] AI conversation calls will not work without a public URL');
          console.warn('[Tunnel] Ensure cloudflared is installed: npm install -g cloudflared');
        }
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  const { stopTunnel } = require('./tunnel');
  stopTunnel();
  process.exit(0);
});

start();
