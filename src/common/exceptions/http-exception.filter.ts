import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resContent: any = exception.getResponse();
      
      if (typeof resContent === 'string') {
        message = resContent;
      } else if (resContent && typeof resContent === 'object') {
        message = resContent.message || 'Error occurred';
        errors = resContent.error || null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // In production, mask raw server error stack traces
      if (process.env.NODE_ENV === 'production') {
        message = 'Internal database or application runtime error';
      }
    }

    response.status(status).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }
}
