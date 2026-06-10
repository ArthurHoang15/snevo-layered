import { randomUUID } from 'node:crypto';

function serializeError(error) {
  if (!error) return undefined;

  return {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
  };
}

function cleanMetadata(metadata) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined)
  );
}

class Logger {
  log(level, event, metadata = {}) {
    const payload = cleanMetadata({
      timestamp: new Date().toISOString(),
      level,
      event,
      service: process.env.APP_NAME || 'snevo-layered',
      environment: process.env.NODE_ENV || 'development',
      ...metadata
    });

    const line = JSON.stringify(payload);
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  info(event, metadata = {}) {
    this.log('info', event, metadata);
  }

  warn(event, metadata = {}) {
    this.log('warn', event, metadata);
  }

  error(event, error, metadata = {}) {
    this.log('error', event, {
      ...metadata,
      error: serializeError(error)
    });
  }

  createRequestContext(req) {
    const requestId = req.headers?.['x-request-id'] || randomUUID();
    return {
      requestId,
      startedAt: process.hrtime.bigint()
    };
  }

  httpRequest(req, res, context) {
    const durationNs = process.hrtime.bigint() - context.startedAt;
    const durationMs = Number(durationNs / 1000000n);
    const parsedUrl = new URL(req.url || '/', 'http://localhost');

    this.info('http_request', {
      requestId: context.requestId,
      method: req.method,
      path: parsedUrl.pathname,
      statusCode: res.statusCode,
      durationMs,
      userAgent: req.headers?.['user-agent'],
      ip: req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress
    });
  }
}

const logger = new Logger();

export default logger;
