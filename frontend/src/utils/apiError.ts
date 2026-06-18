/**
 * Wyciąga komunikat błędu z odpowiedzi API (axios) bez uciekania się do `any`.
 * Zwraca `fallback`, gdy odpowiedź nie zawiera pola `error`.
 */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: unknown } } }).response;
    const message = response?.data?.error;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return fallback;
};
