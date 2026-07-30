import type { NextFunction, Request, Response } from 'express';
import { securityMiddleware } from './security.middleware';

function createResponse() {
  const response = {
    setHeader: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

describe('securityMiddleware', () => {
  it('sets security headers and continues within the rate limit', () => {
    const request = {
      ip: '192.0.2.1',
      method: 'GET',
      path: `/health-${Date.now()}`,
    } as Request;
    const response = createResponse();
    const next = jest.fn() as NextFunction;

    securityMiddleware(request, response as unknown as Response, next);

    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff',
    );
    expect(response.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('limits repeated OTP requests', () => {
    const request = {
      ip: '192.0.2.2',
      method: 'POST',
      path: `/events/public/${Date.now()}/guest-otp`,
    } as Request;
    const response = createResponse();
    const next = jest.fn() as NextFunction;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      securityMiddleware(request, response as unknown as Response, next);
    }

    expect(next).toHaveBeenCalledTimes(5);
    expect(response.status).toHaveBeenLastCalledWith(429);
  });
});
