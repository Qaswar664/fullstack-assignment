import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('healthCheck', () => {
    it('should return success response with version and timestamp', () => {
      const result = appController.healthCheck();
      expect(result.success).toBe(true);
      expect(result.message).toBe('App is running successfully');
      expect(result.data).toHaveProperty('version', '1.0.0');
      expect(result.data).toHaveProperty('timestamp');
      expect(result.statusCode).toBe(200);
    });
  });
});
