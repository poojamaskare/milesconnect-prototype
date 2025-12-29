import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { ShipmentStatus } from '../generated/prisma';

export const getAllShipments = async (req: Request, res: Response) => {
  try {
    const { status, driverId, vehicleId, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (status && typeof status === 'string') {
      where.status = status as ShipmentStatus;
    }
    
    if (driverId && typeof driverId === 'string') {
      where.driverId = driverId;
    }
    
    if (vehicleId && typeof vehicleId === 'string') {
      where.vehicleId = vehicleId;
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          driver: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          vehicle: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.shipment.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: shipments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shipments',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getShipmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Shipment ID is required',
      });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        driver: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        vehicle: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invoice: {
          include: {
            payments: true,
          },
        },
        documents: true,
        tripLinks: {
          include: {
            tripSheet: true,
          },
        },
      },
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shipment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const createShipment = async (req: Request, res: Response) => {
  try {
    const {
      referenceNumber,
      originAddress,
      destinationAddress,
      scheduledPickupAt,
      scheduledDropAt,
      weightKg,
      driverId,
      vehicleId,
      createdById,
    } = req.body;

    if (!referenceNumber || !originAddress || !destinationAddress || !createdById) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['referenceNumber', 'originAddress', 'destinationAddress', 'createdById'],
      });
    }

    // Check if reference number already exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { referenceNumber },
    });

    if (existingShipment) {
      return res.status(409).json({
        success: false,
        error: 'Shipment with this reference number already exists',
      });
    }

    // Verify createdBy user exists
    const user = await prisma.user.findUnique({
      where: { id: createdById },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Verify driver exists if provided
    if (driverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
      }
    }

    // Verify vehicle exists if provided
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found',
        });
      }
    }

    const shipment = await prisma.shipment.create({
      data: {
        referenceNumber,
        originAddress,
        destinationAddress,
        scheduledPickupAt: scheduledPickupAt ? new Date(scheduledPickupAt) : null,
        scheduledDropAt: scheduledDropAt ? new Date(scheduledDropAt) : null,
        weightKg: weightKg ? parseInt(weightKg) : null,
        status: ShipmentStatus.DRAFT,
        createdById,
        driverId: driverId || null,
        vehicleId: vehicleId || null,
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        vehicle: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: shipment,
      message: 'Shipment created successfully',
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create shipment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateShipmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, driverId, vehicleId, scheduledPickupAt, scheduledDropAt, weightKg } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Shipment ID is required',
      });
    }

    // Check if shipment exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!existingShipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found',
      });
    }

    // Validate status if provided
    if (status && !Object.values(ShipmentStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shipment status',
        validStatuses: Object.values(ShipmentStatus),
      });
    }

    // Verify driver exists if provided
    if (driverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
      }
    }

    // Verify vehicle exists if provided
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          error: 'Vehicle not found',
        });
      }
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      
      // Set actual pickup/drop timestamps based on status
      if (status === ShipmentStatus.IN_TRANSIT && !existingShipment.actualPickupAt) {
        updateData.actualPickupAt = new Date();
      }
      
      if (status === ShipmentStatus.DELIVERED && !existingShipment.actualDropAt) {
        updateData.actualDropAt = new Date();
      }
    }

    if (driverId !== undefined) {
      updateData.driverId = driverId;
    }

    if (vehicleId !== undefined) {
      updateData.vehicleId = vehicleId;
    }

    if (scheduledPickupAt !== undefined) {
      updateData.scheduledPickupAt = scheduledPickupAt ? new Date(scheduledPickupAt) : null;
    }

    if (scheduledDropAt !== undefined) {
      updateData.scheduledDropAt = scheduledDropAt ? new Date(scheduledDropAt) : null;
    }

    if (weightKg !== undefined) {
      updateData.weightKg = weightKg ? parseInt(weightKg) : null;
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id },
      data: updateData,
      include: {
        driver: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        vehicle: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedShipment,
      message: 'Shipment updated successfully',
    });
  } catch (error) {
    console.error('Error updating shipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update shipment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
