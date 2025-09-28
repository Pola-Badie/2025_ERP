import winston from 'winston';
// Configure logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    defaultMeta: { service: 'premier-erp' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = 400;
        this.isOperational = true;
        this.name = 'ValidationError';
    }
}
export class DatabaseError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = 500;
        this.isOperational = true;
        this.name = 'DatabaseError';
    }
}
export class AuthenticationError extends Error {
    constructor(message = 'Authentication failed') {
        super(message);
        this.statusCode = 401;
        this.isOperational = true;
        this.name = 'AuthenticationError';
    }
}
export class AuthorizationError extends Error {
    constructor(message = 'Access denied') {
        super(message);
        this.statusCode = 403;
        this.isOperational = true;
        this.name = 'AuthorizationError';
    }
}
export const errorHandler = (err, req, res, next) => {
    // Prevent multiple responses
    if (res.headersSent) {
        return next(err);
    }
    const { statusCode = 500, message, stack } = err;
    // Log error
    logger.error({
        message: err.message,
        statusCode,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    // Handle specific database errors
    if (err.code === '57P01') {
        return res.status(503).json({
            error: {
                message: 'Database connection temporarily unavailable. Please try again.',
            },
        });
    }
    // Don't expose stack traces in production
    const response = {
        error: {
            message: message || 'An unexpected error occurred',
            ...(process.env.NODE_ENV === 'development' && { stack }),
        },
    };
    res.status(statusCode).json(response);
};
export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};
export const asyncHandler = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        }
        catch (error) {
            // Log the error but don't crash
            logger.error('Async handler error:', error);
            // Send appropriate error response
            if (!res.headersSent) {
                const statusCode = error.statusCode || 500;
                res.status(statusCode).json({
                    error: {
                        message: error.message || 'Internal server error',
                        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
                    }
                });
            }
        }
    };
};
export { logger };
