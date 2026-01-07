/**
 * Distance Calculator Utility 
 * Haversine formula for calculating distances between GPS coordinates
 */

interface Coordinates {
    latitude: number;
    longitude: number;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param coord1 First coordinate {latitude, longitude}
 * @param coord2 Second coordinate {latitude, longitude}
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const deg2rad = (deg: number) => deg * (Math.PI / 180);

    const dLat = deg2rad(coord2.latitude - coord1.latitude);
    const dLon = deg2rad(coord2.longitude - coord1.longitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(coord1.latitude)) *
        Math.cos(deg2rad(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

/**
 * Calculate estimated travel time based on distance and average speed
 * @param distanceKm Distance in kilometers
 * @param avgSpeedKmh Average speed in km/h (default: 60 km/h)
 * @returns Travel time in minutes
 */
export function estimateTravelTime(distanceKm: number, avgSpeedKmh: number = 60): number {
    return (distanceKm / avgSpeedKmh) * 60;
}

/**
 * Mock geocoding - convert Indian cities to approximate coordinates
 * In production, use Google Maps Geocoding API
 */
const CITY_COORDINATES: Record<string, Coordinates> = {
    // Maharashtra
    Mumbai: { latitude: 19.076, longitude: 72.8777 },
    Pune: { latitude: 18.5204, longitude: 73.8567 },
    Nagpur: { latitude: 21.1458, longitude: 79.0882 },
    Nashik: { latitude: 19.9975, longitude: 73.7898 },
    Aurangabad: { latitude: 19.8762, longitude: 75.3433 },

    // Karnataka
    Bangalore: { latitude: 12.9716, longitude: 77.5946 },
    Mysore: { latitude: 12.2958, longitude: 76.6394 },
    Mangalore: { latitude: 12.9141, longitude: 74.856 },

    // Gujarat
    Ahmedabad: { latitude: 23.0225, longitude: 72.5714 },
    Surat: { latitude: 21.1702, longitude: 72.8311 },
    Vadodara: { latitude: 22.3072, longitude: 73.1812 },

    // Tamil Nadu
    Chennai: { latitude: 13.0827, longitude: 80.2707 },
    Coimbatore: { latitude: 11.0168, longitude: 76.9558 },
    Madurai: { latitude: 9.9252, longitude: 78.1198 },

    // Delhi NCR
    Delhi: { latitude: 28.7041, longitude: 77.1025 },
    Gurgaon: { latitude: 28.4595, longitude: 77.0266 },
    Noida: { latitude: 28.5355, longitude: 77.391 },

    // Rajasthan
    Jaipur: { latitude: 26.9124, longitude: 75.7873 },
    Udaipur: { latitude: 24.5854, longitude: 73.7125 },
    Jodhpur: { latitude: 26.2389, longitude: 73.0243 },

    // Kerala
    Kochi: { latitude: 9.9312, longitude: 76.2673 },
    Trivandrum: { latitude: 8.5241, longitude: 76.9366 },
    Kozhikode: { latitude: 11.2588, longitude: 75.7804 },

    // West Bengal
    Kolkata: { latitude: 22.5726, longitude: 88.3639 },

    // Telangana
    Hyderabad: { latitude: 17.385, longitude: 78.4867 },

    // Andhra Pradesh
    Vijayawada: { latitude: 16.5062, longitude: 80.6480 },
    Visakhapatnam: { latitude: 17.6868, longitude: 83.2185 },
};

/**
 * Extract city name from address string
 * Simple heuristic: looks for known city names
 */
export function extractCityFromAddress(address: string): string | null {
    const upperAddress = address.toUpperCase();
    for (const city of Object.keys(CITY_COORDINATES)) {
        if (upperAddress.includes(city.toUpperCase())) {
            return city;
        }
    }
    return null;
}

/**
 * Get coordinates for an address (mock implementation)
 */
export function getCoordinates(address: string): Coordinates | null {
    const city = extractCityFromAddress(address);
    if (city && CITY_COORDINATES[city]) {
        // Add small random offset to simulate exact location
        const base = CITY_COORDINATES[city];
        return {
            latitude: base.latitude + (Math.random() - 0.5) * 0.1,
            longitude: base.longitude + (Math.random() - 0.5) * 0.1,
        };
    }
    return null;
}

/**
 * Calculate distance between two addresses
 */
export function calculateAddressDistance(address1: string, address2: string): number | null {
    const coord1 = getCoordinates(address1);
    const coord2 = getCoordinates(address2);

    if (!coord1 || !coord2) {
        return null;
    }

    return calculateDistance(coord1, coord2);
}
