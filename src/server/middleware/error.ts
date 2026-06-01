import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack, path: req.path });
  
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
};
