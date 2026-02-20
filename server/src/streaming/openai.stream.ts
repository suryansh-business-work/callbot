/**
 * ─── OpenAI Streaming Module ────────────────────────────────────────────────
 *
 * Streams ChatCompletion tokens from OpenAI using SSE (Server-Sent Events).
 * Tokens are delivered one-by-one via `onToken` callback, which feeds into
 * the SentenceBuffer for sentence-level TTS generation.
 *
 * Key features:
 *  - True streaming: `stream: true` on the OpenAI call
 *  - Abort support: pass an AbortSignal to cancel mid-stream (barge-in)
 *  - Error resilience: catches and reports errors without crashing
 *  - Low max_tokens for conversational responses (keeps replies concise)
 */

import OpenAI from 'openai';
import { envConfig } from '../config';
import { OpenAIStreamOptions } from './streaming.types';

// ─── Lazy singleton client ──────────────────────────────────────────────────

let openaiClient: OpenAI | null = null;

const getOpenAI = (): OpenAI => {
  if (!openaiClient) {
    if (!envConfig.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openaiClient = new OpenAI({ apiKey: envConfig.OPENAI_API_KEY });
  }
  return openaiClient;
};

// ─── Stream ChatCompletion ──────────────────────────────────────────────────

/**
 * Stream tokens from OpenAI ChatCompletion API.
 *
 * This returns a Promise that resolves when streaming is complete.
 * Tokens are delivered via `onToken` callback as they arrive.
 *
 * The AbortSignal allows the caller (orchestrator) to cancel the stream
 * when the user interrupts (barge-in) or the call ends.
 *
 * @example
 * ```ts
 * await streamChatCompletion({
 *   messages: [{ role: 'user', content: 'Hello' }],
 *   model: 'gpt-4o-mini',
 *   onToken: (token) => sentenceBuffer.push(token),
 *   onDone: (full) => console.log('Done:', full),
 *   onError: (err) => console.error(err),
 *   signal: abortController.signal,
 * });
 * ```
 */
export const streamChatCompletion = async (options: OpenAIStreamOptions): Promise<void> => {
  const { messages, model, onToken, onDone, onError, signal } = options;
  const openai = getOpenAI();

  let fullText = '';
  const startMs = Date.now();

  try {
    // Check if already aborted before starting
    if (signal?.aborted) {
      onDone('');
      return;
    }

    /**
     * OpenAI stream: true returns an async iterable of SSE chunks.
     * Each chunk contains a delta with partial content.
     */
    const stream = await openai.chat.completions.create(
      {
        model,
        messages,
        stream: true,
        max_tokens: 300,        // Keep responses concise for phone calls
        temperature: 0.7,
        // Encourage shorter, conversational responses
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      },
      // Pass abort signal for cancellation support
      signal ? { signal } : undefined,
    );

    // Iterate over the SSE stream
    for await (const chunk of stream) {
      // Check abort between chunks
      if (signal?.aborted) {
        console.log('[OpenAI Stream] Aborted by signal');
        break;
      }

      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullText += delta;
        onToken(delta);
      }

      // Check for finish reason
      const finishReason = chunk.choices[0]?.finish_reason;
      if (finishReason) {
        console.log(`[OpenAI Stream] Finished: ${finishReason} in ${Date.now() - startMs}ms`);
        break;
      }
    }

    onDone(fullText);
  } catch (err: unknown) {
    // Gracefully handle abort errors (expected during barge-in)
    if (signal?.aborted) {
      console.log('[OpenAI Stream] Cancelled (barge-in or call ended)');
      onDone(fullText);
      return;
    }

    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[OpenAI Stream] Error:', error.message);
    onError(error);
  }
};
