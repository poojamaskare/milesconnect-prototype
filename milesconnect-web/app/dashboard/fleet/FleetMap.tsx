"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import mapboxgl from "mapbox-gl";
import { tripCompletionQueryKeys } from "@/lib/queryKeys";

// Use environment variable for production
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

// Realistic travel data
// Delhi to Mumbai: ~1,400 km, avg truck speed 45 km/h = ~31 hours
// Bengaluru to Hyderabad: ~570 km, avg truck speed 45 km/h = ~12.5 hours
const ROUTE_DATA = {
  DELHI_MUMBAI: {
    distanceKm: 1400,
    avgSpeedKmh: 45,
    totalHours: 31,
  },
  BENGALURU_HYDERABAD: {
    distanceKm: 570,
    avgSpeedKmh: 45,
    totalHours: 12.5,
  },
};

// Mock vehicle data based on your database
interface VehicleData {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  driver: string;
  driverId: string;
  status: "ACTIVE" | "IDLE" | "MAINTENANCE";
  shipmentId: string;
  shipmentRef: string;
  origin: { name: string; coords: [number, number] };
  destination: { name: string; coords: [number, number] };
  route: [number, number][];
  progress: number; // 0-1, how far along the route
  totalTripHours: number; // Total trip duration in hours
  startTime: number; // When the trip started (timestamp)
  completed?: boolean; // Whether the trip has been completed
}

// Fallback route waypoints (will be replaced with real routes from Mapbox Directions API)
const DELHI_TO_MUMBAI_ROUTE: [number, number][] = [
  [77.209, 28.6139],   // Delhi
  [72.8777, 19.076],   // Mumbai
];

const BENGALURU_TO_HYDERABAD_ROUTE: [number, number][] = [
  [77.5946, 12.9716],  // Bengaluru
  [78.4867, 17.385],   // Hyderabad
];

// Fetch route from Mapbox Directions API that follows actual roads
async function fetchDirectionsRoute(
  origin: [number, number],
  destination: [number, number]
): Promise<[number, number][]> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch directions");
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates as [number, number][];
    }
    
    throw new Error("No routes found");
  } catch (error) {
    console.error("Error fetching directions:", error);
    // Return straight line as fallback
    return [origin, destination];
  }
}

// Calculate the current position along a route given progress (0-1)
function interpolatePosition(route: [number, number][], progress: number): [number, number] {
  if (progress <= 0) return route[0];
  if (progress >= 1) return route[route.length - 1];

  // Calculate total route length
  let totalDistance = 0;
  const segmentDistances: number[] = [];
  
  for (let i = 0; i < route.length - 1; i++) {
    const dist = Math.sqrt(
      Math.pow(route[i + 1][0] - route[i][0], 2) +
      Math.pow(route[i + 1][1] - route[i][1], 2)
    );
    segmentDistances.push(dist);
    totalDistance += dist;
  }

  // Find which segment we're on
  const targetDistance = totalDistance * progress;
  let accumulatedDistance = 0;

  for (let i = 0; i < segmentDistances.length; i++) {
    if (accumulatedDistance + segmentDistances[i] >= targetDistance) {
      // We're on this segment
      const segmentProgress = (targetDistance - accumulatedDistance) / segmentDistances[i];
      return [
        route[i][0] + (route[i + 1][0] - route[i][0]) * segmentProgress,
        route[i][1] + (route[i + 1][1] - route[i][1]) * segmentProgress,
      ];
    }
    accumulatedDistance += segmentDistances[i];
  }

  return route[route.length - 1];
}

// Format remaining time in human readable format
function formatETA(hoursRemaining: number): string {
  if (hoursRemaining <= 0) return "Arriving soon";
  if (hoursRemaining < 1) return `${Math.round(hoursRemaining * 60)} mins`;
  if (hoursRemaining < 24) {
    const hours = Math.floor(hoursRemaining);
    const mins = Math.round((hoursRemaining - hours) * 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  const days = Math.floor(hoursRemaining / 24);
  const hours = Math.round(hoursRemaining % 24);
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

interface FleetMapProps {
  filters: Set<"Active" | "Idle" | "Maintenance">;
}

export default function FleetMap({ filters }: FleetMapProps) {
  const queryClient = useQueryClient();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  
  // Initialize vehicles with realistic start times
  // Vehicle 1 started 10 hours ago (35% through a 31 hour trip)
  // Vehicle 2 started 2 hours ago (15% through a 12.5 hour trip)
  const [vehicles, setVehicles] = useState<VehicleData[]>(() => {
    const now = Date.now();
    return [
      {
        id: "00000000-0000-0000-0000-000000002001",
        registrationNumber: "MH 01 AB 9210",
        make: "Tata",
        model: "Ace Gold",
        driver: "Rohit Sharma",
        driverId: "00000000-0000-0000-0000-00000001d001",
        status: "ACTIVE",
        shipmentId: "00000000-0000-0000-0000-000000003001",
        shipmentRef: "SHP-48301",
        origin: { name: "Delhi", coords: [77.209, 28.6139] },
        destination: { name: "Mumbai", coords: [72.8777, 19.076] },
        route: DELHI_TO_MUMBAI_ROUTE,
        progress: 0.35,
        totalTripHours: ROUTE_DATA.DELHI_MUMBAI.totalHours,
        startTime: now - (0.35 * ROUTE_DATA.DELHI_MUMBAI.totalHours * 60 * 60 * 1000),
        completed: false,
      },
      {
        id: "00000000-0000-0000-0000-000000002002",
        registrationNumber: "KA 05 CD 1142",
        make: "Mahindra",
        model: "Jeeto",
        driver: "Neha Verma",
        driverId: "00000000-0000-0000-0000-00000001d002",
        status: "ACTIVE",
        shipmentId: "00000000-0000-0000-0000-000000003002",
        shipmentRef: "SHP-48342",
        origin: { name: "Bengaluru", coords: [77.5946, 12.9716] },
        destination: { name: "Hyderabad", coords: [78.4867, 17.385] },
        route: BENGALURU_TO_HYDERABAD_ROUTE,
        progress: 0.15,
        totalTripHours: ROUTE_DATA.BENGALURU_HYDERABAD.totalHours,
        startTime: now - (0.15 * ROUTE_DATA.BENGALURU_HYDERABAD.totalHours * 60 * 60 * 1000),
        completed: false,
      },
    ];
  });

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const completedTripsRef = useRef<Set<string>>(new Set());

  // Function to complete a trip via API
  const completeTripApi = useCallback(async (vehicle: VehicleData) => {
    // Prevent duplicate calls
    if (completedTripsRef.current.has(vehicle.id)) return;
    completedTripsRef.current.add(vehicle.id);

    try {
      const response = await fetch("/api/fleet/complete-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipmentId: vehicle.shipmentId,
          vehicleId: vehicle.id,
          driverId: vehicle.driverId,
          endOdometerKm: Math.round(
            vehicle.id === "00000000-0000-0000-0000-000000002001"
              ? ROUTE_DATA.DELHI_MUMBAI.distanceKm
              : ROUTE_DATA.BENGALURU_HYDERABAD.distanceKm
          ),
        }),
      });

      if (response.ok) {
        console.log(`Trip completed for ${vehicle.registrationNumber}`);
        
        // Update local state to reflect completion
        setVehicles((prev) =>
          prev.map((v) =>
            v.id === vehicle.id
              ? { ...v, status: "IDLE" as const, completed: true, progress: 1 }
              : v
          )
        );

        // Invalidate all related queries so other pages refresh their data
        tripCompletionQueryKeys.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });

        // Show a toast or notification (optional)
        console.log(`All dashboard data will be refreshed.`);
      } else {
        console.error("Failed to complete trip:", await response.text());
        // Remove from completed set to allow retry
        completedTripsRef.current.delete(vehicle.id);
      }
    } catch (error) {
      console.error("Error completing trip:", error);
      completedTripsRef.current.delete(vehicle.id);
    }
  }, [queryClient]);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    if (!MAPBOX_ACCESS_TOKEN) {
      setMapError("Mapbox access token is missing. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file.");
      return;
    }

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [78.0, 20.0], // Center of India
        zoom: 4.5,
      });

      map.current.on("error", (e) => {
        console.error("Mapbox error:", e);
        setMapError("Failed to load map. Please check your Mapbox access token.");
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.current.on("load", async () => {
        setMapLoaded(true);
      
        // Fetch real routes from Mapbox Directions API
        if (map.current) {
          // Fetch Delhi to Mumbai route following actual roads
          const delhiMumbaiRoute = await fetchDirectionsRoute(
            [77.209, 28.6139],  // Delhi
            [72.8777, 19.076]   // Mumbai
          );
          
          // Fetch Bengaluru to Hyderabad route following actual roads
          const bengaluruHyderabadRoute = await fetchDirectionsRoute(
            [77.5946, 12.9716], // Bengaluru
            [78.4867, 17.385]   // Hyderabad
          );
          
          // Update vehicle routes with real road-following routes
          setVehicles((prev) => prev.map((v) => {
            if (v.id === "00000000-0000-0000-0000-000000002001") {
              return { ...v, route: delhiMumbaiRoute };
            } else if (v.id === "00000000-0000-0000-0000-000000002002") {
              return { ...v, route: bengaluruHyderabadRoute };
            }
            return v;
          }));
          
          // Delhi to Mumbai route
          map.current.addSource("route-1", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: delhiMumbaiRoute,
              },
          },
        });

        map.current.addLayer({
          id: "route-1-line",
          type: "line",
          source: "route-1",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#10b981",
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });

        // Bengaluru to Hyderabad route
        map.current.addSource("route-2", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: bengaluruHyderabadRoute,
            },
          },
        });

        map.current.addLayer({
          id: "route-2-line",
          type: "line",
          source: "route-2",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });

        // Add origin/destination markers
        const locations = [
          { coords: [77.209, 28.6139] as [number, number], name: "Delhi", type: "origin" },
          { coords: [72.8777, 19.076] as [number, number], name: "Mumbai", type: "destination" },
          { coords: [77.5946, 12.9716] as [number, number], name: "Bengaluru", type: "origin" },
          { coords: [78.4867, 17.385] as [number, number], name: "Hyderabad", type: "destination" },
        ];

        locations.forEach((loc) => {
          const el = document.createElement("div");
          el.className = "location-marker";
          el.innerHTML = `
            <div style="
              width: 12px;
              height: 12px;
              background: ${loc.type === "origin" ? "#22c55e" : "#ef4444"};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            "></div>
          `;

          new mapboxgl.Marker(el)
            .setLngLat(loc.coords)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<div style="color: #1f2937; font-weight: 600;">${loc.name}</div>
                 <div style="color: #6b7280; font-size: 12px;">${loc.type === "origin" ? "Origin" : "Destination"}</div>`
              )
            )
            .addTo(map.current!);
        });
      }
    });
    } catch (error) {
      console.error("Failed to initialize map:", error);
      setMapError("Failed to initialize map. Please check your configuration.");
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Create vehicle markers - simplified design to avoid zoom glitches
  const createVehicleMarker = useCallback((vehicle: VehicleData) => {
    const position = interpolatePosition(vehicle.route, vehicle.progress);
    const hoursRemaining = vehicle.totalTripHours * (1 - vehicle.progress);
    const eta = formatETA(hoursRemaining);

    const el = document.createElement("div");
    el.className = "vehicle-marker";
    el.style.cssText = `
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: auto;
    `;
    
    // Use a simpler marker without rotation to avoid zoom glitches
    el.innerHTML = `
      <div style="
        background: rgba(0,0,0,0.85);
        color: white;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        white-space: nowrap;
        font-weight: 600;
        margin-bottom: 4px;
        border: 1px solid rgba(255,255,255,0.2);
      ">${vehicle.registrationNumber}</div>
      <div style="
        width: 32px;
        height: 32px;
        background: ${vehicle.status === "ACTIVE" ? "#10b981" : vehicle.status === "IDLE" ? "#f59e0b" : "#ef4444"};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM19.5 9.5l1.5 2.5H17V9.5h2.5zM6 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM19 3H9v6H3v7c0 .55.45 1 1 1h1c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h1c.55 0 1-.45 1-1v-5l-3-5h-2V3z"/>
        </svg>
      </div>
    `;

    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
      <div style="padding: 8px; min-width: 200px;">
        <div style="font-weight: 700; color: #1f2937; font-size: 14px; margin-bottom: 8px;">
          🚚 ${vehicle.registrationNumber}
        </div>
        <div style="display: grid; gap: 4px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">Vehicle:</span>
            <span style="color: #1f2937; font-weight: 500;">${vehicle.make} ${vehicle.model}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">Driver:</span>
            <span style="color: #1f2937; font-weight: 500;">${vehicle.driver}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">Shipment:</span>
            <span style="color: #1f2937; font-weight: 500;">${vehicle.shipmentRef}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">Route:</span>
            <span style="color: #1f2937; font-weight: 500;">${vehicle.origin.name} → ${vehicle.destination.name}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">Progress:</span>
            <span style="color: #1f2937; font-weight: 500;">${Math.round(vehicle.progress * 100)}%</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">ETA:</span>
            <span style="color: #10b981; font-weight: 500;">${eta}</span>
          </div>
          <div style="margin-top: 6px; background: #f3f4f6; border-radius: 4px; height: 6px; overflow: hidden;">
            <div style="background: #10b981; height: 100%; width: ${vehicle.progress * 100}%; transition: width 0.3s;"></div>
          </div>
        </div>
      </div>
    `);

    el.addEventListener("click", () => {
      setSelectedVehicle(vehicle.id);
    });

    const marker = new mapboxgl.Marker(el)
      .setLngLat(position)
      .setPopup(popup);

    return marker;
  }, []);

  // Update markers when map is loaded or vehicles change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Add markers for filtered vehicles
    vehicles.forEach((vehicle) => {
      const filterStatus = vehicle.status === "ACTIVE" ? "Active" : 
                          vehicle.status === "MAINTENANCE" ? "Maintenance" : "Idle";
      
      if (filters.has(filterStatus as "Active" | "Idle" | "Maintenance")) {
        const marker = createVehicleMarker(vehicle);
        marker.addTo(map.current!);
        markersRef.current.set(vehicle.id, marker);
      }
    });
  }, [vehicles, mapLoaded, filters, createVehicleMarker]);

  // Animate vehicles along their routes with REALISTIC timing
  // Vehicles move in real-time based on their total trip duration
  useEffect(() => {
    if (!mapLoaded) return;

    // Update every second for realistic movement
    const interval = setInterval(() => {
      const now = Date.now();
      
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) => {
          if (vehicle.status !== "ACTIVE" || vehicle.completed) return vehicle;
          
          // Calculate progress based on real elapsed time
          const elapsedMs = now - vehicle.startTime;
          const totalTripMs = vehicle.totalTripHours * 60 * 60 * 1000;
          const newProgress = Math.min(elapsedMs / totalTripMs, 1);
          
          // Check if trip is complete (reached destination)
          if (newProgress >= 1 && !vehicle.completed) {
            // Trigger trip completion API call
            completeTripApi(vehicle);
          }
          
          return {
            ...vehicle,
            progress: newProgress,
          };
        })
      );

      // Update marker positions smoothly
      markersRef.current.forEach((marker, vehicleId) => {
        const vehicle = vehicles.find((v) => v.id === vehicleId);
        if (vehicle && vehicle.status === "ACTIVE") {
          const position = interpolatePosition(vehicle.route, vehicle.progress);
          marker.setLngLat(position);
        }
      });
    }, 1000); // Update every second

    return () => {
      clearInterval(interval);
    };
  }, [mapLoaded, vehicles, completeTripApi]);

  // Focus on selected vehicle
  useEffect(() => {
    if (!map.current || !selectedVehicle) return;

    const vehicle = vehicles.find((v) => v.id === selectedVehicle);
    if (vehicle) {
      const position = interpolatePosition(vehicle.route, vehicle.progress);
      map.current.flyTo({
        center: position,
        zoom: 8,
        duration: 1000,
      });

      // Open the popup
      const marker = markersRef.current.get(vehicle.id);
      if (marker) {
        marker.togglePopup();
      }
    }
  }, [selectedVehicle, vehicles]);

  // Show error state
  if (mapError) {
    return (
      <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-rose-500/10 p-6">
        <div className="text-center">
          <div className="text-sm font-semibold text-rose-400">Map Error</div>
          <div className="mt-2 max-w-md text-xs text-foreground/60">{mapError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-xl" style={{ minHeight: "520px" }} />
      
      {/* Loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-card">
          <div className="text-sm text-foreground/60">Loading map...</div>
        </div>
      )}

      {/* Live indicator - top left */}
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-black/80 px-3 py-1.5 backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
        <span className="text-xs font-medium text-white">Live Tracking</span>
      </div>
      
      {/* Vehicle List Overlay */}
      <div className="absolute bottom-4 left-4 z-10 max-h-48 overflow-auto rounded-lg bg-black/80 p-3 backdrop-blur-sm">
        <div className="mb-2 text-xs font-semibold text-white/80">Active Vehicles</div>
        <div className="space-y-2">
          {vehicles
            .filter((v) => {
              const filterStatus = v.status === "ACTIVE" ? "Active" : 
                                  v.status === "MAINTENANCE" ? "Maintenance" : "Idle";
              return filters.has(filterStatus as "Active" | "Idle" | "Maintenance");
            })
            .map((vehicle) => {
              const hoursRemaining = vehicle.totalTripHours * (1 - vehicle.progress);
              const eta = formatETA(hoursRemaining);
              return (
                <button
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-white/10 ${
                    selectedVehicle === vehicle.id ? "bg-white/20" : ""
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      vehicle.status === "ACTIVE"
                        ? "bg-emerald-500"
                        : vehicle.status === "MAINTENANCE"
                        ? "bg-rose-500"
                        : "bg-amber-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-white">
                      {vehicle.registrationNumber}
                    </div>
                    <div className="truncate text-[10px] text-white/60">
                      {vehicle.origin.name} → {vehicle.destination.name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-white/80">{Math.round(vehicle.progress * 100)}%</span>
                      <span className="text-emerald-400">ETA: {eta}</span>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>      </div>
    </div>
  );
}