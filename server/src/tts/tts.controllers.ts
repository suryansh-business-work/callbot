import { Request, Response } from 'express';
import { getCachedAudio, generatePreviewSpeech, generateOpenAiPreview } from './tts.services';

/** Serve cached TTS audio to Twilio <Play> */
export const serveCachedAudio = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const cached = getCachedAudio(id);

  if (!cached) {
    res.status(404).send('Audio not found or expired');
    return;
  }

  res.set({
    'Content-Type': cached.contentType,
    'Content-Length': String(cached.buffer.length),
    'Cache-Control': 'no-cache',
  });
  res.send(cached.buffer);
};

/** Generate a preview TTS sample for the UI voice selector */
export const previewVoice = async (req: Request, res: Response): Promise<void> => {
  // Abort the Sarvam fetch automatically when the browser disconnects.
  const abortController = new AbortController();
  req.on('close', () => abortController.abort());

  // Suppress ECONNABORTED / ECONNRESET when writing to a disconnected client.
  req.socket?.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET') return;
    console.error('[TTS Preview] Socket error:', err);
  });

  try {
    const { speaker, text, language } = req.body as {
      speaker?: string;
      text?: string;
      language?: string;
    };

    if (!speaker) {
      res.status(400).json({ error: 'speaker is required' });
      return;
    }

    let base64Audio: string;

    // Route to OpenAI TTS for openai-* voice IDs
    if (speaker.startsWith('openai-')) {
      base64Audio = await generateOpenAiPreview(
        speaker,
        text || `Hello, I am ${speaker.replace('openai-', '')}. How can I help you today?`,
        abortController.signal
      );
    } else {
      base64Audio = await generatePreviewSpeech(
        speaker,
        text || `Hello, I am ${speaker}. How can I help you today?`,
        language || 'en-IN',
        abortController.signal
      );
    }

    // Client may have disconnected while TTS was responding — skip write.
    if (res.destroyed || res.headersSent) return;

    const contentType = speaker.startsWith('openai-') ? 'audio/mpeg' : 'audio/wav';
    res.json({ audio: base64Audio, contentType });
  } catch (err: unknown) {
    // AbortError means the client closed the connection — not a real error.
    const isAbort = err instanceof Error && (
      err.name === 'AbortError' ||
      err.message === 'AbortError' ||
      err.message === 'Aborted' ||
      err.message?.includes('abort')
    );
    if (isAbort) return;
    if (!res.destroyed && !res.headersSent) {
      console.error('[TTS Preview] Error:', err);
      res.status(500).json({ error: 'Failed to generate voice preview' });
    }
  }
};
