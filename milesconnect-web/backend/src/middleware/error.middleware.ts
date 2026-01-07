export type HttpError = Error & { statusCode?: number; code?: string };

export function httpError(statusCode: number, message: string, code?: string): HttpError {
    const err = new Error(message) as HttpError;
    err.statusCode = statusCode;
    if (code) err.code = code;
    return err;
}
