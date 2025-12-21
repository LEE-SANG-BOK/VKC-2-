export class ApiError extends Error {
  status: number;
  code?: string;
  retryAfterSeconds?: number;

  constructor(message: string, status: number, code?: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class AccountRestrictedError extends ApiError {
  constructor(message: string) {
    super(message, 403, 'ACCOUNT_RESTRICTED');
    this.name = 'AccountRestrictedError';
  }
}

export function isAccountRestrictedError(error: unknown): error is AccountRestrictedError {
  return error instanceof AccountRestrictedError;
}

export function getRetryAfterSeconds(headers: Headers): number | undefined {
  const value = headers.get('Retry-After');
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}
