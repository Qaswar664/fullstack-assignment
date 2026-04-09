import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { successResponse } from './common/helpers/response.helper';

@ApiExcludeController()
@Controller({ path: '/', host: undefined })
export class AppController {
  @Get()
  healthCheck() {
    return successResponse('Multi-Tenant CRM API is running successfully', {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      docs: '/api',
      api: '/api/v1',
    });
  }
}
