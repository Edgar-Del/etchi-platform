import { Request, Response } from 'express';
import { packageService } from '../services/Package.service';
import { PackageStatus } from '../models/Package.model';

export const packageController = {
  async createPackage(req: Request, res: Response) {
    try {
      const packageData = {
        ...req.body,
        senderId: req.user.userId
      };
      
      const newPackage = await packageService.createPackage(packageData);
      
      res.status(201).json({
        success: true,
        data: newPackage
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },
  
  async getAvailablePackages(req: Request, res: Response) {
    try {
      const packages = await packageService.getAvailablePackages(
        req.user.userId,
        req.query
      );
      
      res.json({
        success: true,
        data: packages
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },
  
  async makeOffer(req: Request, res: Response) {
    try {
      const { packageId } = req.params;
      const offerData = {
        ...req.body,
        travelerId: req.user.userId
      };
      
      const updatedPackage = await packageService.makeOffer(packageId, offerData);
      
      res.json({
        success: true,
        data: updatedPackage
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },
  
  async acceptOffer(req: Request, res: Response) {
    try {
      const { packageId } = req.params;
      const { travelerId } = req.body;
      
      const updatedPackage = await packageService.acceptOffer(packageId, travelerId);
      
      res.json({
        success: true,
        data: updatedPackage
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },
  
  async updateStatus(req: Request, res: Response) {
    try {
      const { packageId } = req.params;
      const { status, location } = req.body;
      
      const updatedPackage = await packageService.updatePackageStatus(
        packageId,
        status,
        req.user.userId,
        location
      );
      
      res.json({
        success: true,
        data: updatedPackage
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },
  
  async getMyPackages(req: Request, res: Response) {
    try {
      const { type } = req.query; // 'sent' or 'delivering'
      const userId = req.user.userId;
      
      let query: any = {};
      
      if (type === 'sent') {
        query.senderId = userId;
      } else if (type === 'delivering') {
        query.travelerId = userId;
      }
      
      const packages = await Package.find(query)
        .populate('senderId', 'name profilePhoto')
        .populate('travelerId', 'name profilePhoto travelerProfile')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: packages
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};