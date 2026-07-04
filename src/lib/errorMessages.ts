// Error message mapping utility
// Translates technical errors into human-readable messages for non-technical IQAC staff

const ERROR_MAP: Record<string, string> = {
  // Prisma errors
  P2002: 'This record already exists. Please check if you\'ve already entered this data.',
  P2003: 'This record is linked to other data. Please remove related records first.',
  P2025: 'The record you are trying to update or delete was not found. It may have already been removed.',
  P2014: 'This change would break a required relationship between records.',

  // HTTP status codes
  '400': 'The information provided is incomplete or invalid. Please check the form and try again.',
  '401': 'Your session has expired. Please log in again.',
  '403': 'You don\'t have permission to perform this action. Contact your IQAC Coordinator if you need access.',
  '404': 'The requested information was not found. It may have been moved or deleted.',
  '409': 'This record conflicts with existing data. Please check for duplicates.',
  '413': 'The file you\'re trying to upload is too large. Maximum allowed size is 50MB.',
  '429': 'Too many attempts. Please wait a few minutes before trying again.',
  '500': 'Something went wrong on our end. Please try again, or contact support if this continues.',
  '502': 'The server is temporarily unavailable. Please try again in a few moments.',
  '503': 'The service is temporarily under maintenance. Please try again shortly.',
};

export function friendlyError(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const errStr = String(error);

  // Check for network errors
  if (errStr.includes('Failed to fetch') || errStr.includes('NetworkError') || errStr.includes('net::ERR')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (errStr.includes('timeout') || errStr.includes('Timeout')) {
    return 'The request took too long. Please try again. If this persists, try with a smaller amount of data.';
  }

  // Check for Prisma error codes
  for (const code of Object.keys(ERROR_MAP)) {
    if (errStr.includes(code)) {
      return ERROR_MAP[code];
    }
  }

  // Check for HTTP status code patterns
  const statusMatch = errStr.match(/(?:status|error)\s*(?:code\s*)?:?\s*(\d{3})/i);
  if (statusMatch && ERROR_MAP[statusMatch[1]]) {
    return ERROR_MAP[statusMatch[1]];
  }

  // Check for specific known error patterns
  if (errStr.includes('Unique constraint')) {
    return ERROR_MAP.P2002;
  }
  if (errStr.includes('ECONNREFUSED') || errStr.includes('ENOTFOUND')) {
    return 'Unable to connect to the database. Please contact your system administrator.';
  }

  // If error is a readable message already (no stack trace, no code), return it
  if (errStr.length < 200 && !errStr.includes('at ') && !errStr.includes('Error:')) {
    return errStr;
  }

  return 'Something went wrong. Please try again, or contact support if this continues.';
}

export function friendlyHttpError(status: number, fallbackMessage?: string): string {
  return ERROR_MAP[String(status)] || fallbackMessage || 'An unexpected error occurred.';
}
