/**
 * ─── Twilio WebSocket Handler ───────────────────────────────────────────────
 *
 * Handles the raw WebSocket connection from Twilio <Connect><Stream>.
 * This is the entry point for bidirectional audio streaming.
 *
 * Responsibilities:
 *  - Parse incoming Twilio WebSocket protocol events (connected, start, media, mark, stop)
 *  - Extract call metadata (callSid, streamSid) from the "start" event
 *  - Forward user speech events to the orchestrator
 *  - Send audio chunks back to Twilio (media messages)
 *  - Handle barge-in (user interruption) by clearing the audio queue
 *  - Clean up on disconnect
 *
 * Twilio Media Stream protocol:
 *  - Twilio opens a WS connection to our server (specified in TwiML <Stream>)
 *  - Audio flows as base64-encoded mulaw at 8kHz mono
 *  - We send audio back via { event: 'media', media: { payload: base64 } }
 *  - "mark" events let us know when audio playback reaches a checkpoint
 */

import WebSocket from 'ws';
import {
  TwilioStreamEvent,
  TwilioMediaMessage,
  TwilioMarkMessage,
  TwilioClearMessage,
  StreamSession,
} from './streaming.types';

// ─── Audio chunk size for outbound streaming ────────────────────────────────

/**
 * Size of each base64 audio chunk sent to Twilio.
 * Twilio expects chunks of ~20ms of audio. At 8kHz mulaw (1 byte/sample):
 *   20ms × 8000 samples/s = 160 bytes → ~214 base64 chars
 *
 * We use a larger chunk (640 bytes = 80ms) for efficiency while staying
 * well under Twilio's frame size limit.
 */
const AUDIO_CHUNK_BYTES = 640;

// ─── Active session registry ────────────────────────────────────────────────

/**
 * Maps streamSid → WebSocket for sending audio back to Twilio.
 * The orchestrator uses sendAudioToTwilio() which looks up the WS here.
 */
const activeConnections = new Map<string, WebSocket>();

// ─── Public API: Send audio to Twilio ───────────────────────────────────────

/**
 * Stream base64 mulaw audio to Twilio in appropriately sized chunks.
 * Twilio requires audio as base64-encoded mulaw payloads in media messages.
 *
 * This function:
 *  1. Converts the full base64 audio to a Buffer
 *  2. Splits into AUDIO_CHUNK_BYTES-sized pieces
 *  3. Re-encodes each chunk as base64
 *  4. Sends each as a Twilio media message
 *  5. Sends a mark after all chunks (to detect playback completion)
 */
export const sendAudioToTwilio = (
  streamSid: string,
  audioBase64: string,
  markName?: string,
): void => {
  const ws = activeConnections.get(streamSid);
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn(`[TwilioWS] No active connection for stream ${streamSid}`);
    return;
  }

  // Decode full audio from base64 to binary buffer
  const audioBuffer = Buffer.from(audioBase64, 'base64');
  let offset = 0;

  // Send in chunks for smooth playback
  while (offset < audioBuffer.length) {
    const end = Math.min(offset + AUDIO_CHUNK_BYTES, audioBuffer.length);
    const chunk = audioBuffer.subarray(offset, end);

    const message: TwilioMediaMessage = {
      event: 'media',
      streamSid,
      media: {
        payload: chunk.toString('base64'),
      },
    };

    ws.send(JSON.stringify(message));
    offset = end;
  }

  // Send a mark after the audio so we know when playback finishes
  if (markName) {
    const mark: TwilioMarkMessage = {
      event: 'mark',
      streamSid,
      mark: { name: markName },
    };
    ws.send(JSON.stringify(mark));
  }
};

/**
 * Clear Twilio's audio playback queue.
 * Used for barge-in: when the user starts speaking, we stop any AI audio.
 */
export const clearTwilioAudio = (streamSid: string): void => {
  const ws = activeConnections.get(streamSid);
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  const clear: TwilioClearMessage = {
    event: 'clear',
    streamSid,
  };
  ws.send(JSON.stringify(clear));
  console.log(`[TwilioWS] Cleared audio queue for ${streamSid}`);
};

// ─── WebSocket Connection Handler ───────────────────────────────────────────

/**
 * Callbacks the orchestrator provides to hook into Twilio events.
 */
export interface TwilioWSCallbacks {
  /** Called when stream starts with session metadata */
  onStreamStart: (session: Pick<StreamSession, 'callSid' | 'streamSid'>, customParams: Record<string, string>) => void;
  /** Called when a mark is reached (audio playback checkpoint) */
  onMark: (streamSid: string, markName: string) => void;
  /** Called when the stream ends */
  onStreamEnd: (streamSid: string) => void;
}

/**
 * Handle a new Twilio WebSocket connection.
 *
 * This is typically called from the WS server's 'connection' event:
 * ```ts
 * wss.on('connection', (ws) => handleTwilioConnection(ws, callbacks));
 * ```
 */
export const handleTwilioConnection = (
  ws: WebSocket,
  callbacks: TwilioWSCallbacks,
): void => {
  let streamSid = '';
  let callSid = '';

  console.log('[TwilioWS] New connection established');

  ws.on('message', (data: WebSocket.RawData) => {
    try {
      const event = JSON.parse(data.toString()) as TwilioStreamEvent;

      switch (event.event) {
        case 'connected':
          console.log(`[TwilioWS] Connected: protocol=${event.protocol}`);
          break;

        case 'start':
          // Extract session identifiers from the start event
          streamSid = event.streamSid;
          callSid = event.start.callSid;

          // Register this WebSocket for outbound audio
          activeConnections.set(streamSid, ws);

          console.log(`[TwilioWS] Stream started: streamSid=${streamSid}, callSid=${callSid}`);
          console.log(`[TwilioWS] Media format: ${event.start.mediaFormat.encoding} @ ${event.start.mediaFormat.sampleRate}Hz`);

          // Notify orchestrator
          callbacks.onStreamStart(
            { callSid, streamSid },
            event.start.customParameters,
          );
          break;

        case 'media':
          // Inbound audio from the user — we don't do our own STT here.
          // Twilio handles STT via <Gather> or Google STT integration.
          // In the streaming architecture, we use Twilio's built-in STT
          // and receive transcriptions via the webhooks (not via WS media).
          //
          // If you want to add custom STT (e.g. Deepgram, Whisper),
          // you would forward event.media.payload to the STT engine here.
          break;

        case 'mark':
          // A mark we previously sent has been reached in playback
          console.log(`[TwilioWS] Mark reached: ${event.mark.name}`);
          callbacks.onMark(streamSid, event.mark.name);
          break;

        case 'stop':
          console.log(`[TwilioWS] Stream stopped: ${streamSid}`);
          callbacks.onStreamEnd(streamSid);
          cleanup();
          break;

        default:
          // Unknown event — log for debugging
          console.log(`[TwilioWS] Unknown event:`, (event as { event: string }).event);
      }
    } catch (err) {
      console.error('[TwilioWS] Failed to parse message:', err);
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`[TwilioWS] Connection closed: code=${code}, reason=${reason.toString()}`);
    if (streamSid) {
      callbacks.onStreamEnd(streamSid);
    }
    cleanup();
  });

  ws.on('error', (err) => {
    console.error(`[TwilioWS] WebSocket error:`, err.message);
    cleanup();
  });

  function cleanup() {
    if (streamSid) {
      activeConnections.delete(streamSid);
    }
  }
};

// ─── Utility: check if a stream is still active ────────────────────────────

export const isStreamActive = (streamSid: string): boolean => {
  const ws = activeConnections.get(streamSid);
  return !!ws && ws.readyState === WebSocket.OPEN;
};

/** Get count of active Twilio stream connections */
export const getActiveStreamCount = (): number => activeConnections.size;
