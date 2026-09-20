/**
 * PsychePath - Gemini API Transport Service
 *
 * Handles HTTP transport, timeout enforcement, exponential retry backoff,
 * response JSON extraction, and normalized error mapping for Gemini AI.
 */

const config = require("../config");

class GeminiService {
  constructor() {
    this.apiKey = config.geminiApiKey;
    this.model = config.geminiModel;
    this.timeoutMs = config.geminiTimeoutMs;
    this.maxRetries = config.geminiMaxRetries;
    // Allow custom transport handler for testing/mocking
    this._customTransport = null;
  }

  /**
   * Override or set a custom transport handler (useful for testing)
   * @param {Function|null} handler - (url, options) => Promise<Response>
   */
  setCustomTransport(handler) {
    this._customTransport = handler;
  }

  /**
   * Creates a sanitized error with internal code
   */
  createError(message, errorCode, statusCode = 502, cause = null) {
    const error = new Error(message);
    error.errorCode = errorCode;
    error.statusCode = statusCode;
    if (cause) error.cause = cause;
    return error;
  }

  /**
   * Executes a fetch request with timeout support
   */
  async _fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const fetchFn = this._customTransport || globalThis.fetch;
      const response = await fetchFn(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Generates content using Gemini API with retry handling and timeout
   * @param {Object} promptData - { systemInstruction, userContent }
   * @returns {Promise<Object>} Parsed JSON response from Gemini
   */
  async generateContent(promptData) {
    const apiKey = this.apiKey || config.geminiApiKey;
    if (!apiKey) {
      throw this.createError(
        "Gemini API key is not configured.",
        "AI_CONFIGURATION_ERROR",
        500,
      );
    }

    const model = this.model || config.geminiModel;
    const timeoutMs = this.timeoutMs || config.geminiTimeoutMs;
    const maxRetries = this.maxRetries ?? config.geminiMaxRetries;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: promptData.systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: promptData.userContent }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2, // low temperature for deterministic structure
      },
    };

    let attempt = 0;
    let lastError = null;

    while (attempt <= maxRetries) {
      attempt++;
      try {
        const response = await this._fetchWithTimeout(
          endpoint,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          },
          timeoutMs,
        );

        if (!response.ok) {
          const status = response.status;
          let errorDetails = "";
          try {
            const errJson = await response.json();
            errorDetails = errJson?.error?.message || "";
          } catch {
            // Ignore body read error
          }

          // Distinguish retryable statuses (429 rate limit, 500, 503)
          const isRetryable = status === 429 || status >= 500;
          const code =
            status === 429
              ? "AI_SERVICE_UNAVAILABLE"
              : status >= 500
                ? "AI_SERVICE_UNAVAILABLE"
                : "AI_REQUEST_FAILED";

          const error = this.createError(
            `Gemini API request failed with HTTP ${status}${errorDetails ? `: ${errorDetails}` : ""}`,
            code,
            status >= 500 ? 502 : 400,
          );
          error.isRetryable = isRetryable;
          throw error;
        }

        const data = await response.json();
        return this._parseGeminiResponse(data);
      } catch (err) {
        lastError = err;

        // Check if error was caused by AbortController timeout
        if (err.name === "AbortError" || err.message?.includes("aborted")) {
          lastError = this.createError(
            `Gemini API request timed out after ${timeoutMs}ms`,
            "AI_TIMEOUT",
            504,
          );
          lastError.isRetryable = true;
        }

        // Only retry if allowed and marked retryable
        if (attempt <= maxRetries && lastError.isRetryable) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
          await new Promise((res) => setTimeout(res, backoffDelay));
          continue;
        }

        break;
      }
    }

    throw lastError;
  }

  /**
   * Extracts and parses JSON from Gemini API response candidates
   */
  _parseGeminiResponse(data) {
    const candidate = data?.candidates?.[0];
    if (!candidate) {
      throw this.createError(
        "Gemini returned an empty candidate list.",
        "AI_INVALID_RESPONSE",
        502,
      );
    }

    const textPart = candidate.content?.parts?.[0]?.text;
    if (!textPart || typeof textPart !== "string") {
      throw this.createError(
        "Gemini response did not contain valid text content.",
        "AI_INVALID_RESPONSE",
        502,
      );
    }

    // Clean any markdown wrapper if present (e.g. ```json ... ```)
    let cleaned = textPart.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
      return JSON.parse(cleaned);
    } catch (parseErr) {
      const err = this.createError(
        "Gemini returned malformed JSON.",
        "AI_INVALID_RESPONSE",
        502,
        parseErr,
      );
      err.isRetryable = true; // Malformed JSON may resolve on retry
      throw err;
    }
  }
}

module.exports = new GeminiService();
