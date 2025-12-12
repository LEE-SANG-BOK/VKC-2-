export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
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
