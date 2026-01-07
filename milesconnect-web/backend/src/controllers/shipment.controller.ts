import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { ShipmentStatus } from '@prisma/client';
import { createInvoiceFromShipment } from './invoice.controller';

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
      price,
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
        priceCents: price ? BigInt(Math.round(parseFloat(price) * 100)) : BigInt(0),
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
    const { status, driverId, vehicleId, scheduledPickupAt, scheduledDropAt, weightKg, price } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Shipment ID is required',
      });
    }

    // Defensive: Validate status transition?
    // For now, trust the input but ensure atomic application.

    // Start strict transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get current state (LOCKING hint if possible, but Prisma handles isolation)
      const existingShipment = await tx.shipment.findUnique({
        where: { id },
        include: { driver: true, vehicle: true }
      });

      if (!existingShipment) {
        throw new Error('SHIPMENT_NOT_FOUND');
      }

      const updateData: any = {};

      // 2. Handle Status Changes & Availability Locks
      if (status) {
        // Validation: Prevent silly transitions (e.g. DELIVERED -> DRAFT)
        if (existingShipment.status === ShipmentStatus.DELIVERED && status !== ShipmentStatus.DELIVERED) {
          throw new Error('CANNOT_MODIFY_DELIVERED_SHIPMENT');
        }

        updateData.status = status;

        // Transition Logic
        if (status === ShipmentStatus.IN_TRANSIT) {
          const targetDriverId = driverId || existingShipment.driverId;
          const targetVehicleId = vehicleId || existingShipment.vehicleId;

          if (!targetDriverId) throw new Error('DRIVER_REQUIRED_FOR_TRANSIT');
          if (!targetVehicleId) throw new Error('VEHICLE_REQUIRED_FOR_TRANSIT');

          // STRICT Availability Check (Driver)
          // Must have ZERO active shipments (excluding this one)
          const driverBusyCount = await tx.shipment.count({
            where: {
              driverId: targetDriverId,
              status: ShipmentStatus.IN_TRANSIT,
              id: { not: id }
            }
          });
          if (driverBusyCount > 0) throw new Error('DRIVER_BUSY');

          // STRICT Availability Check (Vehicle)
          const vehicleBusyCount = await tx.shipment.count({
            where: {
              vehicleId: targetVehicleId,
              status: ShipmentStatus.IN_TRANSIT,
              id: { not: id }
            }
          });
          if (vehicleBusyCount > 0) throw new Error('VEHICLE_BUSY');

          // STRICT Maintenance Check
          const vehicle = await tx.vehicle.findUnique({ where: { id: targetVehicleId } });
          if (vehicle?.status === 'MAINTENANCE') throw new Error('VEHICLE_MAINTENANCE');

          // Auto-timestamp
          if (!existingShipment.actualPickupAt) updateData.actualPickupAt = new Date();
        }

        if (status === ShipmentStatus.DELIVERED) {
          // Logic: Free up resources (Implicit by changing status from IN_TRANSIT)
          // Auto-timestamp
          if (!existingShipment.actualDropAt) updateData.actualDropAt = new Date();

          // Trigger Invoice
          // Use explicit await to ensure this is part of the transaction
          await createInvoiceFromShipment(id, tx);
        }
      }

      // 3. Handle Assignments (even without status change)
      if (driverId !== undefined && driverId !== existingShipment.driverId) {
        // If shipment is already IN_TRANSIT, new driver must be free
        if (existingShipment.status === ShipmentStatus.IN_TRANSIT || status === ShipmentStatus.IN_TRANSIT) {
          const driverBusyCount = await tx.shipment.count({
            where: { driverId: driverId, status: ShipmentStatus.IN_TRANSIT }
          });
          if (driverBusyCount > 0) throw new Error('TARGET_DRIVER_BUSY');
        }
        updateData.driverId = driverId;
      }

      if (vehicleId !== undefined && vehicleId !== existingShipment.vehicleId) {
        if (existingShipment.status === ShipmentStatus.IN_TRANSIT || status === ShipmentStatus.IN_TRANSIT) {
          const vehicleBusyCount = await tx.shipment.count({
            where: { vehicleId: vehicleId, status: ShipmentStatus.IN_TRANSIT }
          });
          if (vehicleBusyCount > 0) throw new Error('TARGET_VEHICLE_BUSY');

          const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
          if (vehicle?.status === 'MAINTENANCE') throw new Error('VEHICLE_MAINTENANCE');
        }
        updateData.vehicleId = vehicleId;
      }

      // Other fields
      if (scheduledPickupAt !== undefined) updateData.scheduledPickupAt = scheduledPickupAt ? new Date(scheduledPickupAt) : null;
      if (scheduledDropAt !== undefined) updateData.scheduledDropAt = scheduledDropAt ? new Date(scheduledDropAt) : null;
      if (weightKg !== undefined) updateData.weightKg = weightKg ? parseInt(weightKg) : null;
      if (price !== undefined) updateData.priceCents = price ? BigInt(Math.round(parseFloat(price) * 100)) : BigInt(0);

      // 4. Exec Update
      const updatedShipment = await tx.shipment.update({
        where: { id },
        data: updateData,
        include: {
          driver: { include: { user: { select: { name: true, email: true } } } },
          vehicle: true,
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });

      return updatedShipment;
    });

    res.status(200).json({
      success: true,
      data: result,
      meta: {
        driverUpdated: !!driverId || !!status,
        vehicleUpdated: !!vehicleId || !!status,
        analyticsUpdated: status === ShipmentStatus.DELIVERED
      }
    });

  } catch (error: any) {
    console.error('Error updating shipment:', error);
    const errMap: Record<string, { code: number, msg: string }> = {
      'SHIPMENT_NOT_FOUND': { code: 404, msg: 'Shipment not found' },
      'CANNOT_MODIFY_DELIVERED_SHIPMENT': { code: 400, msg: 'Cannot modify a delivered shipment' },
      'DRIVER_REQUIRED_FOR_TRANSIT': { code: 400, msg: 'Driver is required to start transit' },
      'VEHICLE_REQUIRED_FOR_TRANSIT': { code: 400, msg: 'Vehicle is required to start transit' },
      'DRIVER_BUSY': { code: 409, msg: 'Driver is currently busy with another active shipment' },
      'TARGET_DRIVER_BUSY': { code: 409, msg: 'Target driver is busy' },
      'VEHICLE_BUSY': { code: 409, msg: 'Vehicle is currently in use' },
      'TARGET_VEHICLE_BUSY': { code: 409, msg: 'Target vehicle is in use' },
      'VEHICLE_MAINTENANCE': { code: 409, msg: 'Vehicle is under maintenance' },
    };

    if (errMap[error.message]) {
      return res.status(errMap[error.message].code).json({ success: false, error: errMap[error.message].msg });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update shipment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
