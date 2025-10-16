// backend/src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser, UserType } from '../models/User.model';

interface RegisterData {
  email: string;
  phone: string;
  password: string;
  name: string;
  userType: UserType;
}

interface LoginData {
  emailOrPhone: string;
  password: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  userType: UserType;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'etchi_secret_key';
  private readonly JWT_EXPIRES_IN = '7d';

  async register(data: RegisterData): Promise<{ user: IUser; token: string }> {
    // Verificar se usuário já existe
    const existingUser = await User.findOne({
      $or: [{ email: data.email }, { phone: data.phone }]
    });

    if (existingUser) {
      throw new Error('Email ou telefone já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Criar usuário
    const user = await User.create({
      ...data,
      password: hashedPassword
    });

    // Gerar token
    const token = this.generateToken({
      userId: user._id.toString(),
      email: user.email,
      userType: user.userType
    });

    return { user, token };
  }

  async login(data: LoginData): Promise<{ user: IUser; token: string }> {
    // Buscar usuário
    const user = await User.findOne({
      $or: [
        { email: data.emailOrPhone },
        { phone: data.emailOrPhone }
      ]
    }).select('+password');

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new Error('Usuário inativo');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas');
    }

    // Gerar token
    const token = this.generateToken({
      userId: user._id.toString(),
      email: user.email,
      userType: user.userType
    });

    // Remover senha do retorno
    user.password = undefined as any;

    return { user, token };
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }

  async refreshToken(oldToken: string): Promise<string> {
    const decoded = await this.verifyToken(oldToken);
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new Error('Usuário não encontrado ou inativo');
    }

    return this.generateToken({
      userId: user._id.toString(),
      email: user.email,
      userType: user.userType
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Senha atual incorreta');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  async resetPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) {
      // Não revelar se o email existe ou não por segurança
      return;
    }

    // TODO: Implementar envio de email com código de recuperação
    // Por enquanto, apenas log
    console.log(`Reset password requested for: ${email}`);
  }

  private generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    });
  }
}

export const authService = new AuthService();
