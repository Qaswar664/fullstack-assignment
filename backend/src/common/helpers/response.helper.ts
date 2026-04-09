import { ApiResponse } from '../interfaces/api-response.interface';

export function successResponse<T>(
  message: string,
  data: T,
  statusCode: number = 200,
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    statusCode,
  };
}

export function errorResponse(
  message: string,
  statusCode: number = 400,
): ApiResponse<null> {
  return {
    success: false,
    message,
    statusCode,
  };
}
