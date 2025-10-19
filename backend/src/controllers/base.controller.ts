// src/controllers/base.controller.ts
import { Response } from 'express';

export abstract class BaseController {
  protected successResponse(res: Response, data: any, message: string = 'Operação realizada com sucesso', statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  protected errorResponse(res: Response, message: string, statusCode: number = 400) {
    return res.status(statusCode).json({
      success: false,
      message
    });
  }
}