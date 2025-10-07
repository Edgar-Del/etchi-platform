import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Registro de Cliente
router.post('/register/customer', async (req, res) => {
  try {
    const { email, phone, password, name } = req.body;
    
    // Validações
    if (!email || !phone || !password || !name) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    
    // Verificar se já existe
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email ou telefone já cadastrado' });
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        name,
        userType: 'DELIVERER'
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        userType: true
      }
    });
    
    const token = jwt.sign(
      { userId: user.id, userType: user.userType },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      user, 
      token,
      message: 'Conta criada. Complete seu perfil de entregador.' 
    });
  } catch (error) {
    console.error('Register deliverer error:', error);
    res.status(500).json({ error: 'Erro ao registrar entregador' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        delivererProfile: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = jwt.sign(
      { userId: user.id, userType: user.userType },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

export default router;