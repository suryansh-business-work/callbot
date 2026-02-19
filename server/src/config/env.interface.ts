export interface EnvConfig {
  /** Twilio Account SID - Found in Twilio Console Dashboard */
  TWILIO_ACCOUNT_SID: string;

  /** Twilio Auth Token - Found in Twilio Console Dashboard */
  TWILIO_AUTH_TOKEN: string;

  /** Twilio Phone Number - Your purchased Twilio number (E.164 format: +1234567890) */
  TWILIO_PHONE_NUMBER: string;

  /** Server port */
  PORT: number;

  /** WebSocket port */
  WS_PORT: number;

  /** Node environment */
  NODE_ENV: 'development' | 'production' | 'test';

  /** Client URL for CORS */
  CLIENT_URL: string;

  /** Base URL for Twilio webhooks (e.g., ngrok URL or production domain) */
  BASE_URL: string;

  /** OpenAI API Key for AI conversation */
  OPENAI_API_KEY: string;

  /** Default system prompt for AI conversations */
  AI_SYSTEM_PROMPT: string;

  /** MongoDB connection URI */
  MONGODB_URI: string;

  /** JWT secret for auth tokens */
  JWT_SECRET: string;

  /** JWT expiration time */
  JWT_EXPIRES_IN: string;

  /** SMTP / Nodemailer settings */
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;

  /** ImageKit settings */
  IMAGEKIT_PUBLIC_KEY: string;
  IMAGEKIT_PRIVATE_KEY: string;
  IMAGEKIT_URL_ENDPOINT: string;

  /** Sarvam.ai TTS */
  SARVAM_API_KEY: string;
}
