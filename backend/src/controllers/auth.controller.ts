// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { BaseController } from './base.controller';

export class AuthController extends BaseController {
  private authService: AuthService;

  constructor() {
    super();
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.registerUser(req.body);
      this.successResponse(res, result, 'Utilizador registado com sucesso', 201);
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      this.successResponse(res, result, 'Login realizado com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 401);
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken(refreshToken);
      this.successResponse(res, result, 'Token renovado com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 401);
    }
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // req.user será definido pelo middleware de autenticação
      const user = await this.authService.getProfile((req as any).user.id);
      this.successResponse(res, user, 'Perfil obtido com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 401);
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      const result = await this.authService.resetPassword(email);
      this.successResponse(res, result, 'Se o email existir, enviaremos instruções de recuperação');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      const result = await this.authService.changePasswordWithToken({ token, newPassword });
      this.successResponse(res, result, 'Password alterada com sucesso');
    } catch (error: any) {
      this.errorResponse(res, error.message, 400);
    }
  };
}