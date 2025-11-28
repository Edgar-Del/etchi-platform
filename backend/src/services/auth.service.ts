// src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, IUser, UserType, VerificationStatus } from '../models/User.model';
import { EmailService } from './email.service';
import { AnalyticsService } from './analytics.service';

export interface RegisterDto {
  email: string;
  phone: string;
  password: string;
  name: string;
  userType?: UserType;
  role?: 'client' | 'courier'; // Compatibilidade com API antiga
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export class AuthService {
  private emailService: EmailService;
  private analyticsService: AnalyticsService;

  constructor() {
    this.emailService = new EmailService();
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Regista um novo usuário no sistema
   */
  async registerUser(registerDto: RegisterDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: { user: IUser; access_token: string } 
  }> {
    try {
      const { email, phone, password, name, userType, role } = registerDto;

      // Mapear role para userType se necessário (compatibilidade)
      let finalUserType: UserType;
      if (userType) {
        finalUserType = userType;
      } else if (role) {
        // Mapear valores antigos para novos
        finalUserType = role === 'client' ? UserType.CUSTOMER : UserType.DELIVERY_PARTNER;
      } else {
        throw new Error('userType ou role é obrigatório');
      }

      // Verificar se o usuário já existe
      const existingUser = await User.findOne({
        $or: [{ email }, { phone }],
      });

      if (existingUser) {
        throw new Error('Email ou telefone já registado');
      }

      // Criar usuário (o hash da password será feito pelo middleware pre('save') do modelo)
      const user = await User.create({
        name,
        email,
        phone,
        password: password, // Senha em texto plano - será hasheada pelo middleware
        userType: finalUserType,
        verificationStatus: finalUserType === UserType.CUSTOMER ? 
          VerificationStatus.VERIFIED : VerificationStatus.PENDING,
        preferences: {
          pushNotifications: true,
          emailNotifications: true,
          language: 'pt',
          currency: 'AOA',
        },
      });

      // Gerar token
      const payload = { 
        sub: user._id, 
        email: user.email, 
        userType: user.userType 
      };
      
      const access_token = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: '1h'
      });

      // Log analytics
      await this.analyticsService.trackUserRegistration(user);

      // Enviar email de boas-vindas
      if (user.userType !== UserType.DELIVERY_PARTNER) {
        await this.emailService.sendWelcomeEmail(user.email, user.name);
      }

      console.log(`Novo usuário registado: ${user.email}`);

      return {
        success: true,
        message: 'Registo realizado com sucesso',
        data: { user, access_token }
      };
    } catch (error: any) {
      console.error(`Erro no registo: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Valida as credenciais do usuário
   */
  async validateUser(email: string, password: string): Promise<IUser> {
    try {
      const user = await User.findOne({
        $or: [{ email }, { phone: email }],
      })
      .select('+password')
      .exec();

      if (!user) {
        throw new Error('Credenciais inválidas');
      }

      if (!user.isActive) {
        throw new Error('Conta desativada');
      }

      if (!user.password) {
        throw new Error('Credenciais inválidas - senha não configurada');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        throw new Error('Credenciais inválidas');
      }

      // Atualizar última atividade
      user.lastActive = new Date();
      await user.save();

      // Remover password do retorno
      user.password = undefined as any;

      return user;
    } catch (error: any) {
      console.error(`Erro na validação do usuário: ${error.message}`);
      throw error;
    }
  }

  /**
   * Realiza login do usuário
   */
  async login(loginDto: LoginDto): Promise<{ 
    success: boolean; 
    message: string; 
    data: { 
      access_token: string; 
      refresh_token: string;
      user: IUser;
    } 
  }> {
    try {
      const { email, password } = loginDto;
      
      const user = await this.validateUser(email, password);
      
      const payload = {
        sub: user._id,
        email: user.email,
        userType: user.userType,
      };

      const access_token = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: '1h',
      });

      const refresh_token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '7d',
      });

      // Log analytics
      await this.analyticsService.trackUserLogin(user);

      console.log(`Login realizado: ${user.email}`);

      return {
        success: true,
        message: 'Login realizado com sucesso',
        data: { access_token, refresh_token, user }
      };
    } catch (error: any) {
      console.error(`Erro no login: ${error.message}`);
      throw error;
    }
  }

  /**
   * Atualiza o token de acesso usando refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: { access_token: string } 
  }> {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

      const user = await User.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new Error('Usuário não encontrado ou inativo');
      }

      const newPayload = {
        sub: user._id,
        email: user.email,
        userType: user.userType,
      };

      const access_token = jwt.sign(newPayload, process.env.JWT_SECRET!, {
        expiresIn: '1h',
      });

      return {
        success: true,
        message: 'Token atualizado com sucesso',
        data: { access_token }
      };
    } catch (error: any) {
      console.error(`Erro no refresh token: ${error.message}`);
      throw new Error('Refresh token inválido ou expirado');
    }
  }

  /**
   * Inicia processo de recuperação de password
   */
  async resetPassword(email: string): Promise<{ 
    success: boolean; 
    message: string; 
  }> {
    try {
      const user = await User.findOne({ email });
      
      // Por segurança, não revelar se o email existe
      if (!user) {
        console.warn(`Tentativa de reset de password para email não registado: ${email}`);
        return {
          success: true,
          message: 'Se o email existir, enviaremos instruções de recuperação'
        };
      }

      // Gerar token de reset
      const resetToken = uuidv4();
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

      // Atualizar usuário com token de reset
      await User.findByIdAndUpdate(user._id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpiry,
      });

      // Enviar email com link de reset
      await this.emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

      console.log(`Pedido de reset de password para: ${user.email}`);

      return {
        success: true,
        message: 'Email de recuperação enviado com sucesso'
      };
    } catch (error: any) {
      console.error(`Erro no reset de password: ${error.message}`);
      throw new Error('Erro ao processar pedido de recuperação');
    }
  }

  /**
   * Altera a password usando token de reset
   */
  async changePasswordWithToken(resetPasswordDto: ResetPasswordDto): Promise<{ 
    success: boolean; 
    message: string; 
  }> {
    try {
      const { token, newPassword } = resetPasswordDto;

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        throw new Error('Token de recuperação inválido ou expirado');
      }

      // Hash da nova password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await User.findByIdAndUpdate(user._id, {
        password: hashedPassword,
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined,
      });

      // Enviar email de confirmação
      await this.emailService.sendPasswordChangedConfirmation(user.email, user.name);

      console.log(`Password alterada para: ${user.email}`);

      return {
        success: true,
        message: 'Password alterada com sucesso'
      };
    } catch (error: any) {
      console.error(`Erro ao alterar password: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica se o token JWT é válido
   */
  async verifyToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }

  /**
   * Obtém o perfil do usuário
   */
  async getProfile(userId: string): Promise<{ 
    success: boolean; 
    message: string; 
    data: IUser 
  }> {
    try {
      const user = await User.findById(userId).select('-password -refreshToken');
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      return {
        success: true,
        message: 'Perfil obtido com sucesso',
        data: user
      };
    } catch (error: any) {
      console.error(`Erro ao obter perfil do usuário ${userId}: ${error.message}`);
      throw error;
    }
  }
}