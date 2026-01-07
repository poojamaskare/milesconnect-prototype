// Centralized query keys for cache management
export const queryKeys = {
  // Fleet
  fleet: {
    all: ["fleet"] as const,
    vehicles: () => [...queryKeys.fleet.all, "vehicles"] as const,
    status: () => [...queryKeys.fleet.all, "status"] as const,
  },
  // Vehicles
  vehicles: {
    all: ["vehicles"] as const,
    list: () => [...queryKeys.vehicles.all, "list"] as const,
    detail: (id: string) => [...queryKeys.vehicles.all, "detail", id] as const,
  },
  // Shipments
  shipments: {
    all: ["shipments"] as const,
    list: () => [...queryKeys.shipments.all, "list"] as const,
    detail: (id: string) => [...queryKeys.shipments.all, "detail", id] as const,
  },
  // Trip Sheets
  tripSheets: {
    all: ["trip-sheets"] as const,
    list: () => [...queryKeys.tripSheets.all, "list"] as const,
    detail: (id: string) => [...queryKeys.tripSheets.all, "detail", id] as const,
  },
  // Drivers
  drivers: {
    all: ["drivers"] as const,
    list: () => [...queryKeys.drivers.all, "list"] as const,
    detail: (id: string) => [...queryKeys.drivers.all, "detail", id] as const,
  },
  // Dashboard
  dashboard: {
    all: ["dashboard"] as const,
    kpis: () => [...queryKeys.dashboard.all, "kpis"] as const,
  },
  // Analytics
  analytics: {
    all: ["analytics"] as const,
    health: () => [...queryKeys.analytics.all, "health"] as const,
    performance: () => [...queryKeys.analytics.all, "driver-performance"] as const,
  },
};

// All query keys that should be invalidated when a trip completes
// These match the actual queryKey values used in each page's useQuery hook
export const tripCompletionQueryKeys: readonly (readonly string[])[] = [
  ["fleet", "vehicles"],          // Fleet page
  ["vehicles", "shipments"],      // Vehicles page
  ["shipments"],                  // Shipments page
  ["trip-sheets"],                // Trip Sheets page
  ["drivers"],                    // Drivers page
  ["dashboard"],                  // Dashboard KPIs
  ["maintenance", "vehicles"],    // Maintenance page
];
