import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

// Configurar upload de arquivos
const storage = multer.diskStorage({
  destination: './uploads/deliverers/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens e PDFs são permitidos'));
  }
});

// Completar perfil do entregador
router.post('/profile/complete', authenticate, upload.fields([
  { name: 'biPhoto', maxCount: 1 },
  { name: 'licensePhoto', maxCount: 1 },
  { name: 'vehiclePhoto', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user!.userId;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    const {
      biNumber,
      licenseNumber,
      licenseExpiry,
      vehicleType,
      vehiclePlate,
      vehicleBrand,
      vehicleModel,
      vehicleYear,
      maxWeight,
      maxVolume
    } = req.body;
    
    // Verificar se já tem perfil
    const existingProfile = await prisma.delivererProfile.findUnique({
      where: { userId }
    });
    
    if (existingProfile) {
      return res.status(400).json({ error: 'Perfil já existe' });
    }
    
    // Criar perfil
    const profile = await prisma.delivererProfile.create({
      data: {
        userId,
        biNumber,
        licenseNumber,
        licenseExpiry: new Date(licenseExpiry),
        vehicleType,
        vehiclePlate,
        vehicleBrand,
        vehicleModel,
        vehicleYear: parseInt(vehicleYear),
        maxWeight: parseFloat(maxWeight),
        maxVolume: parseFloat(maxVolume),
        biPhoto: files.biPhoto?.[0]?.filename || '',
        licensePhoto: files.licensePhoto?.[0]?.filename || '',
        vehiclePhoto: files.vehiclePhoto?.[0]?.filename || '',
        profilePhoto: files.profilePhoto?.[0]?.filename || '',
        vehicleInsurance: 'pending', // Será enviado depois
        insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    });
    
    res.status(201).json({ 
      profile,
      message: 'Perfil criado. Aguardando aprovação da administração.' 
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ error: 'Erro ao completar perfil' });
  }
});

// Atualizar disponibilidade
router.patch('/availability', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { isAvailable, currentLat, currentLng } = req.body;
    
    const profile = await prisma.delivererProfile.update({
      where: { userId },
      data: {
        isAvailable,
        isOnline: isAvailable,
        currentLat: currentLat || undefined,
        currentLng: currentLng || undefined,
        lastSeen: new Date()
      }
    });
    
    res.json({ profile });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Erro ao atualizar disponibilidade' });
  }
});

// Buscar pedidos disponíveis próximos
router.get('/orders/available', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { lat, lng, radius = 10 } = req.query;
    
    // Buscar perfil do entregador
    const profile = await prisma.delivererProfile.findUnique({
      where: { userId }
    });
    
    if (!profile || !profile.isActive) {
      return res.status(403).json({ error: 'Perfil não aprovado' });
    }
    
    // Buscar pedidos pendentes próximos
    // Nota: Para produção, usar PostGIS ou similar para busca geoespacial eficiente
    const orders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        // Aqui você adicionaria filtros de distância
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        }
      },
      take: 20,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({ orders });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// Aceitar pedido
router.post('/orders/:orderId/accept', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { orderId } = req.params;
    
    // Buscar perfil
    const profile = await prisma.delivererProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      return res.status(403).json({ error: 'Perfil de entregador não encontrado' });
    }
    
    // Verificar se pedido ainda está disponível
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order || order.status !== 'PENDING') {
      return res.status(400).json({ error: 'Pedido não disponível' });
    }
    
    // Criar entrega e atualizar pedido
    const delivery = await prisma.$transaction(async (tx) => {
      // Atualizar order
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'ACCEPTED' }
      });
      
      // Criar delivery
      const newDelivery = await tx.delivery.create({
        data: {
          orderId,
          delivererId: profile.id,
          acceptedAt: new Date()
        },
        include: {
          order: {
            include: {
              sender: true
            }
          }
        }
      });
      
      // Adicionar histórico
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'ACCEPTED',
          notes: `Aceito por ${profile.user.name}`
        }
      });
      
      return newDelivery;
    });
    
    // Notificar cliente (implementar depois)
    
    res.json({ delivery });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ error: 'Erro ao aceitar pedido' });
  }
});

// Confirmar coleta
router.post('/deliveries/:deliveryId/confirm-pickup', authenticate, async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { pickupCode, pickupPhoto, notes } = req.body;
    
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true }
    });
    
    if (!delivery) {
      return res.status(404).json({ error: 'Entrega não encontrada' });
    }
    
    // Verificar código
    if (delivery.order.pickupCode !== pickupCode) {
      return res.status(400).json({ error: 'Código de coleta inválido' });
    }
    
    // Atualizar delivery
    await prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          pickedUpAt: new Date(),
          pickupPhoto,
          pickupNotes: notes
        }
      });
      
      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: 'PICKED_UP' }
      });
      
      await tx.orderStatusHistory.create({
        data: {
          orderId: delivery.orderId,
          status: 'PICKED_UP'
        }
      });
    });
    
    res.json({ message: 'Coleta confirmada' });
  } catch (error) {
    console.error('Confirm pickup error:', error);
    res.status(500).json({ error: 'Erro ao confirmar coleta' });
  }
});

// Confirmar entrega
router.post('/deliveries/:deliveryId/confirm-delivery', authenticate, async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { deliveryCode, deliveryPhoto, notes } = req.body;
    
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true }
    });
    
    if (!delivery) {
      return res.status(404).json({ error: 'Entrega não encontrada' });
    }
    
    // Verificar código
    if (delivery.order.deliveryCode !== deliveryCode) {
      return res.status(400).json({ error: 'Código de entrega inválido' });
    }
    
    // Calcular duração
    const actualDuration = delivery.pickedUpAt 
      ? Math.floor((Date.now() - delivery.pickedUpAt.getTime()) / 60000)
      : null;
    
    // Atualizar delivery
    await prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          deliveredAt: new Date(),
          deliveryPhoto,
          deliveryNotes: notes,
          actualDuration
        }
      });
      
      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: 'DELIVERED' }
      });
      
      await tx.orderStatusHistory.create({
        data: {
          orderId: delivery.orderId,
          status: 'DELIVERED'
        }
      });
      
      // Atualizar estatísticas do entregador
      await tx.delivererProfile.update({
        where: { id: delivery.delivererId },
        data: {
          totalDeliveries: { increment: 1 },
          completedDeliveries: { increment: 1 }
        }
      });
    });
    
    res.json({ message: 'Entrega confirmada com sucesso' });
  } catch (error) {
    console.error('Confirm delivery error:', error);
    res.status(500).json({ error: 'Erro ao confirmar entrega' });
  }
});

// Buscar minhas entregas
router.get('/deliveries', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { status } = req.query;
    
    const profile = await prisma.delivererProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }
    
    const deliveries = await prisma.delivery.findMany({
      where: {
        delivererId: profile.id,
        ...(status && { order: { status: status as any } })
      },
      include: {
        order: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                phone: true,
                profilePhoto: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({ deliveries });
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ error: 'Erro ao buscar entregas' });
  }
});

export default router;