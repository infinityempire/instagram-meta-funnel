import { safeErrorMessage } from "./safeLog";

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export class RetryableHttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "RetryableHttpError";
  }
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = Math.min(options.maxAttempts ?? 3, 3);
  const baseDelayMs = options.baseDelayMs ?? 500;
  const sleep = options.sleep ?? defaultSleep;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof RetryableHttpError ||
        error instanceof TypeError ||
        (error instanceof Error && error.name === "TimeoutError");
      if (!retryable || attempt === maxAttempts) throw new Error(safeErrorMessage(error));
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw new Error(safeErrorMessage(lastError));
}
