import { Request, Response } from 'express';
import prisma from '../prisma/client';

export const getAnalyticsDashboard = async (req: Request, res: Response) => {
    try {
        // 1. Shipment Status Counts
        const shipmentStats = await prisma.shipment.groupBy({
            by: ['status'],
            _count: {
                id: true,
            },
        });

        // 2. Active Vehicles
        const activeVehiclesCount = await prisma.vehicle.count({
            where: { status: 'ACTIVE' },
        });

        // 3. Total Revenue (from PAIED Invoices)
        // Note: Storing cents as BigInt, need to handle serialization for JSON
        const revenueAggr = await prisma.invoice.aggregate({
            _sum: {
                totalCents: true,
            },
            where: {
                status: 'PAID',
            },
        });

        // Serialize BigInt to string for JSON response
        const revenueCents = revenueAggr._sum.totalCents?.toString() || '0';

        // 4. Recent Alerts (Mocked for now, future: integration with IoT/Maintenance)
        const recentAlerts = [
            { id: '1', message: 'Vehicle KA01-1234 maintenance due in 2 days', severity: 'medium' },
            { id: '2', message: 'Driver John Doe exceeded speed limit', severity: 'high' },
        ];

        res.json({
            shipmentStats: shipmentStats.map((s: { status: string; _count: { id: number } }) => ({ status: s.status, count: s._count.id })),
            fleetSummary: {
                activeVehicles: activeVehiclesCount,
            },
            financials: {
                totalRevenueCents: revenueCents,
                currency: 'INR',
            },
            alerts: recentAlerts,
        });
    } catch (error) {
        console.error('Error fetching analytics dashboard:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getShipmentsAnalytics = async (req: Request, res: Response) => {
    try {
        const totalShipments = await prisma.shipment.count();
        const deliveredShipments = await prisma.shipment.count({
            where: { status: 'DELIVERED' }
        });

        // Example: On-time delivery rate (mock logic: if actualDropAt <= scheduledDropAt)
        // In a real query, we might use raw SQL or extensive filtering.
        // For MVP, simply return counts.

        res.json({
            totalShipments,
            deliveredShipments,
            // onTimeRate: ...
        });
    } catch (error) {
        console.error('Error fetching shipment analytics:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
