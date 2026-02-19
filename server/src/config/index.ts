import dotenv from 'dotenv';
import { EnvConfig } from './env.interface';

dotenv.config();

const getEnvVar = (key: string, fallback?: string): string => {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getOptionalEnvVar = (key: string, fallback?: string): string => {
  return process.env[key] || fallback || '';
};

export const envConfig: EnvConfig = {
  TWILIO_ACCOUNT_SID: getOptionalEnvVar('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: getOptionalEnvVar('TWILIO_AUTH_TOKEN'),
  TWILIO_PHONE_NUMBER: getEnvVar('TWILIO_PHONE_NUMBER'),
  PORT: parseInt(getEnvVar('PORT', '9004'), 10),
  WS_PORT: parseInt(getEnvVar('WS_PORT', '9005'), 10),
  NODE_ENV: getEnvVar('NODE_ENV', 'development') as EnvConfig['NODE_ENV'],
  CLIENT_URL: getEnvVar('CLIENT_URL', 'http://localhost:9003'),
  BASE_URL: getEnvVar('BASE_URL', 'http://localhost:5000'),
  OPENAI_API_KEY: getOptionalEnvVar('OPENAI_API_KEY'),
  AI_SYSTEM_PROMPT: getOptionalEnvVar(
    'AI_SYSTEM_PROMPT',
    'You are a helpful, friendly AI phone assistant. Keep your responses concise and conversational, suitable for a phone call. Respond in 1-3 sentences unless more detail is needed. Be warm, natural, and professional.'
  ),

  // MongoDB
  MONGODB_URI: getEnvVar('MONGODB_URI', 'mongodb://localhost:27017/twilio_call_bot'),

  // JWT
  JWT_SECRET: getEnvVar('JWT_SECRET', 'super-secret-jwt-key-change-me'),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '7d'),

  // SMTP
  SMTP_HOST: getOptionalEnvVar('SMTP_HOST', 'smtp.gmail.com'),
  SMTP_PORT: parseInt(getOptionalEnvVar('SMTP_PORT', '587'), 10),
  SMTP_USER: getOptionalEnvVar('SMTP_USER'),
  SMTP_PASS: getOptionalEnvVar('SMTP_PASS'),
  SMTP_FROM: getOptionalEnvVar('SMTP_FROM', 'noreply@exyconn.com'),

  // ImageKit
  IMAGEKIT_PUBLIC_KEY: getOptionalEnvVar('IMAGEKIT_PUBLIC_KEY'),
  IMAGEKIT_PRIVATE_KEY: getOptionalEnvVar('IMAGEKIT_PRIVATE_KEY'),
  IMAGEKIT_URL_ENDPOINT: getOptionalEnvVar('IMAGEKIT_URL_ENDPOINT'),

  // Sarvam.ai TTS
  SARVAM_API_KEY: getOptionalEnvVar('SARVAM_API_KEY'),
};
