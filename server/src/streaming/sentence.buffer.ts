/**
 * ─── Sentence Buffer ────────────────────────────────────────────────────────
 *
 * Accumulates streaming LLM tokens and emits complete sentences as soon as
 * a sentence boundary is detected. This enables per-sentence TTS generation
 * without waiting for the full LLM response.
 *
 * Sentence detection uses:
 *  - Punctuation: . ! ? (including Hindi Devanagari purna viram: ।)
 *  - Lookahead to avoid splitting at abbreviations like "U.S.A."
 *  - Minimum character threshold to avoid emitting tiny fragments
 *
 * Usage:
 *   const buffer = new SentenceBuffer(onSentence, onDone);
 *   // Feed tokens as they arrive from OpenAI:
 *   buffer.push('Hello');
 *   buffer.push(', how are');
 *   buffer.push(' you?');  // → fires onSentence('Hello, how are you?', 0)
 *   buffer.flush();         // → fires onDone(fullText)
 */

import { SentenceCallback, StreamDoneCallback } from './streaming.types';

/**
 * Regex pattern to detect sentence-ending punctuation.
 *
 * Matches:
 *  - Standard sentence enders: . ! ?
 *  - Hindi purna viram: ।
 *  - Followed by a space or end-of-string
 *
 * The lookbehind avoids splitting on abbreviations like "Dr." or "U.S."
 * by requiring at least 2 word characters before the period.
 */
const SENTENCE_END_PATTERN = /(?<=[।.!?])(?:\s|$)/;

/**
 * Minimum characters before we consider emitting a sentence.
 * This prevents emitting ultra-short fragments like "OK." that
 * would produce rushed TTS audio.
 */
const MIN_SENTENCE_LENGTH = 12;

/**
 * Maximum buffer size before we force-flush even without a sentence end.
 * Prevents unbounded memory growth if the LLM produces long run-on text.
 */
const MAX_BUFFER_LENGTH = 500;

export class SentenceBuffer {
  /** Internal text accumulator */
  private buffer = '';

  /** Full text accumulated across the entire stream (for final callback) */
  private fullText = '';

  /** Running sentence index counter */
  private sentenceIndex = 0;

  /** Whether flush() has already been called */
  private flushed = false;

  constructor(
    /** Fires each time a complete sentence is detected */
    private readonly onSentence: SentenceCallback,
    /** Fires once when the stream is complete */
    private readonly onDone: StreamDoneCallback
  ) {}

  /**
   * Push a new token/chunk from the LLM stream.
   * Checks for sentence boundaries and emits complete sentences.
   */
  push(token: string): void {
    if (this.flushed) return;

    this.buffer += token;
    this.fullText += token;

    // Try to extract complete sentences from the buffer
    this.extractSentences();
  }

  /**
   * Force-flush any remaining text in the buffer.
   * Call this when the OpenAI stream ends.
   */
  flush(): void {
    if (this.flushed) return;
    this.flushed = true;

    const remaining = this.buffer.trim();
    if (remaining.length > 0) {
      this.onSentence(remaining, this.sentenceIndex++);
    }

    this.onDone(this.fullText);
  }

  /**
   * Reset the buffer for reuse (e.g. new user turn in the same call).
   */
  reset(): void {
    this.buffer = '';
    this.fullText = '';
    this.sentenceIndex = 0;
    this.flushed = false;
  }

  /**
   * Internal: scan the buffer for sentence boundaries and emit.
   */
  private extractSentences(): void {
    // Keep extracting while we can find sentence boundaries
    let safetyBreaker = 0;
    while (safetyBreaker++ < 50) {
      const match = this.buffer.match(SENTENCE_END_PATTERN);

      if (!match || match.index === undefined) {
        // No sentence boundary found; check if buffer is getting too long
        if (this.buffer.length > MAX_BUFFER_LENGTH) {
          this.forceFlushBuffer();
        }
        break;
      }

      // Position right after the punctuation + space
      const splitAt = match.index;
      const sentence = this.buffer.slice(0, splitAt).trim();
      this.buffer = this.buffer.slice(splitAt).trimStart();

      if (sentence.length < MIN_SENTENCE_LENGTH) {
        // Sentence is too short — merge it with the next one
        // Put it back (prepend) so it becomes part of the next sentence
        this.buffer = sentence + ' ' + this.buffer;
        break; // Wait for more tokens
      }

      // Emit the complete sentence
      this.onSentence(sentence, this.sentenceIndex++);
    }
  }

  /**
   * Force-flush when buffer exceeds MAX_BUFFER_LENGTH.
   * Finds the best split point (last space) to avoid mid-word breaks.
   */
  private forceFlushBuffer(): void {
    // Find the last space before the limit to break cleanly
    const lastSpace = this.buffer.lastIndexOf(' ', MAX_BUFFER_LENGTH);
    const splitAt = lastSpace > MIN_SENTENCE_LENGTH ? lastSpace : MAX_BUFFER_LENGTH;

    const chunk = this.buffer.slice(0, splitAt).trim();
    this.buffer = this.buffer.slice(splitAt).trimStart();

    if (chunk.length > 0) {
      this.onSentence(chunk, this.sentenceIndex++);
    }
  }
}
