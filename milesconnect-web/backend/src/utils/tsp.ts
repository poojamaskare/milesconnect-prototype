/**
 * Traveling Salesman Problem Solver
 * Greedy nearest-neighbor algorithm for route optimization
 */

interface Waypoint {
    id: string;
    type: 'pickup' | 'drop';
    shipmentId: string;
    location: string;
    latitude?: number;
    longitude?: number;
}

interface OptimizedWaypoint extends Waypoint {
    order: number;
    distanceFromPrevious: number;
    estimatedArrival?: Date;
}

/**
 * Calculate distance between two waypoints
 */
function waypointDistance(w1: Waypoint, w2: Waypoint): number {
    if (w1.latitude && w1.longitude && w2.latitude && w2.longitude) {
        // Use Haversine formula
        const R = 6371;
        const dLat = (w2.latitude - w1.latitude) * (Math.PI / 180);
        const dLon = (w2.longitude - w1.longitude) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(w1.latitude * (Math.PI / 180)) *
            Math.cos(w2.latitude * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    // Fallback: simple mock distance
    return Math.random() * 100 + 20;
}

/**
 * Solve TSP using greedy nearest-neighbor algorithm
 * @param waypoints List of waypoints to visit
 * @param startLocation Starting location
 * @param avgSpeedKmh Average travel speed (default: 60 km/h)
 * @returns Optimized sequence of waypoints
 */
export function optimizeRouteSequence(
    waypoints: Waypoint[],
    startLocation: { latitude: number; longitude: number },
    avgSpeedKmh: number = 60
): OptimizedWaypoint[] {
    if (waypoints.length === 0) {
        return [];
    }

    const unvisited = [...waypoints];
    const optimized: OptimizedWaypoint[] = [];
    let currentLocation = startLocation;
    let totalTime = 0; // minutes

    // Greedy nearest-neighbor
    while (unvisited.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = Infinity;

        // Find nearest unvisited waypoint
        for (let i = 0; i < unvisited.length; i++) {
            const dist = waypointDistance(
                { ...unvisited[i], type: 'pickup', id: '', shipmentId: '' },
                {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    location: '',
                    type: 'pickup',
                    id: '',
                    shipmentId: '',
                }
            );

            if (dist < nearestDistance) {
                nearestDistance = dist;
                nearestIndex = i;
            }
        }

        // Add to optimized route
        const waypoint = unvisited[nearestIndex];
        const travelTime = (nearestDistance / avgSpeedKmh) * 60; // minutes
        totalTime += travelTime;

        optimized.push({
            ...waypoint,
            order: optimized.length + 1,
            distanceFromPrevious: nearestDistance,
            estimatedArrival: new Date(Date.now() + totalTime * 60000),
        });

        // Update current location
        if (waypoint.latitude && waypoint.longitude) {
            currentLocation = {
                latitude: waypoint.latitude,
                longitude: waypoint.longitude,
            };
        }

        // Remove from unvisited
        unvisited.splice(nearestIndex, 1);
    }

    return optimized;
}

/**
 * Calculate total route metrics
 */
export function calculateRouteMetrics(optimizedRoute: OptimizedWaypoint[]): {
    totalDistance: number;
    totalTime: number;
    pickupCount: number;
    dropCount: number;
} {
    const totalDistance = optimizedRoute.reduce(
        (sum, wp) => sum + wp.distanceFromPrevious,
        0
    );
    const totalTime = optimizedRoute.length > 0
        ? (optimizedRoute[optimizedRoute.length - 1].estimatedArrival!.getTime() -
            Date.now()) /
        60000
        : 0;
    const pickupCount = optimizedRoute.filter((wp) => wp.type === 'pickup').length;
    const dropCount = optimizedRoute.filter((wp) => wp.type === 'drop').length;

    return {
        totalDistance: Math.round(totalDistance * 100) / 100,
        totalTime: Math.round(totalTime),
        pickupCount,
        dropCount,
    };
}

/**
 * Validate route sequence (ensure pickups before drops)
 */
export function validateRouteSequence(route: OptimizedWaypoint[]): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];
    const pickedUp = new Set<string>();

    for (const waypoint of route) {
        if (waypoint.type === 'pickup') {
            pickedUp.add(waypoint.shipmentId);
        } else if (waypoint.type === 'drop') {
            if (!pickedUp.has(waypoint.shipmentId)) {
                errors.push(
                    `Drop for shipment ${waypoint.shipmentId} before pickup`
                );
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
