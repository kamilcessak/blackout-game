import { Request, Response, NextFunction } from 'express';

/**
 * Lekki logger requestów (bez zależności typu morgan). Loguje metodę, ścieżkę,
 * status i czas odpowiedzi — żeby nie być ślepym na błędy 4xx/5xx w produkcji.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`;
    if (res.statusCode >= 500) {
      console.error(line);
    } else if (res.statusCode >= 400) {
      console.warn(line);
    } else {
      console.log(line);
    }
  });

  next();
};
