'use client';

import { useState } from 'react';
import { Truck, Package, Route, Loader2, AlertCircle, Zap, MapPin, CheckCircle2, Scale, Navigation, Plus, X } from 'lucide-react';

type Vehicle = {
    id: string;
    capacity_kg: number;
    current_load: number;
};

type Shipment = {
    id: string;
    weight_kg: number;
};

type Allocation = {
    vehicle_id: string;
    shipment_ids: string[];
    total_weight: number;
    utilization_pct: number;
};

type LoadResponse = {
    allocations: Allocation[];
    unassigned_shipment_ids: string[];
};

type Waypoint = {
    name: string;
    lat: number;
    lng: number;
};

type RouteResponse = {
    route: { lat: number; lng: number }[];
    total_distance_km: number;
};

export default function OptimizationClient() {
    const [activeTab, setActiveTab] = useState<'load' | 'route'>('load');

    // Load Optimization State
    const [vehicles, setVehicles] = useState<Vehicle[]>([
        { id: 'BharatBenz 2028', capacity_kg: 40000, current_load: 0 }
    ]);
    const [shipments, setShipments] = useState<Shipment[]>([
        { id: 'Heavy Machinery', weight_kg: 32000 }
    ]);
    const [loadResult, setLoadResult] = useState<LoadResponse | null>(null);
    const [loadLoading, setLoadLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Route Optimization State
    const [startPoint, setStartPoint] = useState<Waypoint>({ name: 'Delhi', lat: 28.6139, lng: 77.2090 });
    const [endPoint, setEndPoint] = useState<Waypoint>({ name: 'Mumbai', lat: 19.0760, lng: 72.8777 });
    const [waypoints, setWaypoints] = useState<Waypoint[]>([
        { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
        { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    ]);
    const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const [routeError, setRouteError] = useState<string | null>(null);

    const handleOptimizeLoad = async () => {
        setLoadLoading(true);
        setLoadError(null);
        try {
            const response = await fetch('http://localhost:8081/optimize-load', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vehicles, shipments })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            setLoadResult(data);
        } catch (error: any) {
            setLoadError(error.message);
        } finally {
            setLoadLoading(false);
        }
    };

    const handleOptimizeRoute = async () => {
        setRouteLoading(true);
        setRouteError(null);
        try {
            const payload = {
                start: { lat: startPoint.lat, lng: startPoint.lng },
                end: { lat: endPoint.lat, lng: endPoint.lng },
                waypoints: waypoints.map(w => ({ lat: w.lat, lng: w.lng }))
            };

            const response = await fetch('http://localhost:8081/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            setRouteResult(data);
        } catch (error: any) {
            setRouteError(error.message);
        } finally {
            setRouteLoading(false);
        }
    };

    const addVehicle = () => {
        const newId = `Truck ${vehicles.length + 1}`;
        setVehicles([...vehicles, { id: newId, capacity_kg: 25000, current_load: 0 }]);
    };

    const addShipment = () => {
        const newId = `Shipment ${shipments.length + 1}`;
        setShipments([...shipments, { id: newId, weight_kg: 5000 }]);
    };

    const addWaypoint = () => {
        setWaypoints([...waypoints, { name: `Stop ${waypoints.length + 1}`, lat: 0, lng: 0 }]);
    };

    const removeVehicle = (index: number) => {
        setVehicles(vehicles.filter((_, i) => i !== index));
    };

    const removeShipment = (index: number) => {
        setShipments(shipments.filter((_, i) => i !== index));
    };

    const removeWaypoint = (index: number) => {
        setWaypoints(waypoints.filter((_, i) => i !== index));
    };

    const updateVehicle = (index: number, field: keyof Vehicle, value: string | number) => {
        const updated = [...vehicles];
        updated[index] = { ...updated[index], [field]: value };
        setVehicles(updated);
    };

    const updateShipment = (index: number, field: keyof Shipment, value: string | number) => {
        const updated = [...shipments];
        updated[index] = { ...updated[index], [field]: value };
        setShipments(updated);
    };

    const updateWaypoint = (index: number, field: keyof Waypoint, value: string | number) => {
        const updated = [...waypoints];
        updated[index] = { ...updated[index], [field]: value };
        setWaypoints(updated);
    };

    const totalCapacity = vehicles.reduce((sum, v) => sum + v.capacity_kg, 0);
    const totalWeight = shipments.reduce((sum, s) => sum + s.weight_kg, 0);

    return (
        <div className="p-6 space-y-6 min-h-screen">
            {/* Header with Gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Zap className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-bold">Optimization Engine</h1>
                    </div>
                    <p className="text-blue-100 max-w-xl">
                        Powered by Go Microservice • Advanced Algorithms • Real-time Processing
                    </p>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-10">
                    <Navigation className="h-48 w-48" />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('load')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${activeTab === 'load'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    <Scale className="h-4 w-4" />
                    Load Optimizer
                </button>
                <button
                    onClick={() => setActiveTab('route')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${activeTab === 'route'
                        ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    <Route className="h-4 w-4" />
                    Route Optimizer
                </button>
            </div>

            {/* Load Optimizer Tab */}
            {activeTab === 'load' && (
                <div className="space-y-6">
                    {/* Stats Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                            <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                                <Truck className="h-4 w-4" />
                                Fleet Size
                            </div>
                            <div className="text-2xl font-bold">{vehicles.length}</div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
                            <div className="flex items-center gap-2 text-emerald-100 text-sm mb-1">
                                <Scale className="h-4 w-4" />
                                Total Capacity
                            </div>
                            <div className="text-2xl font-bold">{(totalCapacity / 1000).toFixed(0)}T</div>
                        </div>
                        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-lg">
                            <div className="flex items-center gap-2 text-amber-100 text-sm mb-1">
                                <Package className="h-4 w-4" />
                                Shipments
                            </div>
                            <div className="text-2xl font-bold">{shipments.length}</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                            <div className="flex items-center gap-2 text-purple-100 text-sm mb-1">
                                <Zap className="h-4 w-4" />
                                Total Load
                            </div>
                            <div className="text-2xl font-bold">{(totalWeight / 1000).toFixed(0)}T</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Vehicles Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                            <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-slate-900 dark:text-white">Fleet Vehicles</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Add trucks with capacity</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={addVehicle}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                                {vehicles.map((v, idx) => (
                                    <div key={idx} className="group relative p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                                        <button
                                            onClick={() => removeVehicle(idx)}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                                        >
                                            ×
                                        </button>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Vehicle Name</label>
                                                <input
                                                    type="text"
                                                    value={v.id}
                                                    onChange={(e) => updateVehicle(idx, 'id', e.target.value)}
                                                    className="w-full mt-1 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Capacity (kg)</label>
                                                <input
                                                    type="number"
                                                    value={v.capacity_kg}
                                                    onChange={(e) => updateVehicle(idx, 'capacity_kg', parseInt(e.target.value) || 0)}
                                                    className="w-full mt-1 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipments Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                                            <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-slate-900 dark:text-white">Shipments</h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Add loads to optimize</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={addShipment}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                                {shipments.map((s, idx) => (
                                    <div key={idx} className="group relative p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors">
                                        <button
                                            onClick={() => removeShipment(idx)}
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                                        >
                                            ×
                                        </button>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Shipment Name</label>
                                                <input
                                                    type="text"
                                                    value={s.id}
                                                    onChange={(e) => updateShipment(idx, 'id', e.target.value)}
                                                    className="w-full mt-1 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Weight (kg)</label>
                                                <input
                                                    type="number"
                                                    value={s.weight_kg}
                                                    onChange={(e) => updateShipment(idx, 'weight_kg', parseInt(e.target.value) || 0)}
                                                    className="w-full mt-1 px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleOptimizeLoad}
                        disabled={loadLoading || vehicles.length === 0 || shipments.length === 0}
                        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        {loadLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Running Best-Fit Algorithm...
                            </>
                        ) : (
                            <>
                                <Zap className="h-5 w-5" />
                                Optimize Fleet Allocation
                            </>
                        )}
                    </button>

                    {loadError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <strong>Connection Error:</strong> {loadError}
                                <p className="text-sm mt-1 text-red-600 dark:text-red-300">Make sure the Go service is running on port 8081</p>
                            </div>
                        </div>
                    )}

                    {loadResult && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">Optimization Complete</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Best-Fit Decreasing Algorithm</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                {loadResult.allocations.map((alloc, idx) => (
                                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                <span className="font-semibold text-slate-900 dark:text-white">{alloc.vehicle_id}</span>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${alloc.utilization_pct >= 80
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                                : alloc.utilization_pct >= 50
                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                                    : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                                                }`}>
                                                {alloc.utilization_pct}% Utilized
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mb-3">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-1000 ${alloc.utilization_pct >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                    : alloc.utilization_pct >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                                        : 'bg-gradient-to-r from-red-500 to-rose-500'
                                                    }`}
                                                style={{ width: `${alloc.utilization_pct}%` }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="text-slate-600 dark:text-slate-400">
                                                <span className="font-medium">Total Load:</span> {(alloc.total_weight / 1000).toFixed(1)}T
                                            </div>
                                            <div className="text-slate-600 dark:text-slate-400">
                                                <span className="font-medium">Items:</span> {alloc.shipment_ids.join(', ')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {loadResult.unassigned_shipment_ids && loadResult.unassigned_shipment_ids.length > 0 && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium mb-1">
                                            <AlertCircle className="h-4 w-4" />
                                            Unassigned Shipments
                                        </div>
                                        <p className="text-sm text-red-600 dark:text-red-300">
                                            {loadResult.unassigned_shipment_ids.join(', ')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Route Optimizer Tab */}
            {activeTab === 'route' && (
                <div className="space-y-6">
                    {/* Stats Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
                            <div className="flex items-center gap-2 text-green-100 text-sm mb-1">
                                <MapPin className="h-4 w-4" />
                                Start Point
                            </div>
                            <div className="text-xl font-bold">{startPoint.name}</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
                            <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                                <Route className="h-4 w-4" />
                                Waypoints
                            </div>
                            <div className="text-xl font-bold">{waypoints.length} stops</div>
                        </div>
                        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-4 text-white shadow-lg">
                            <div className="flex items-center gap-2 text-red-100 text-sm mb-1">
                                <MapPin className="h-4 w-4" />
                                End Point
                            </div>
                            <div className="text-xl font-bold">{endPoint.name}</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                    <Route className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-slate-900 dark:text-white">Route Planning</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Nearest Neighbor TSP Algorithm</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Start Point */}
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">S</div>
                                    <span className="font-medium text-green-800 dark:text-green-200">Start Point</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        value={startPoint.name}
                                        onChange={(e) => setStartPoint({ ...startPoint, name: e.target.value })}
                                        placeholder="Location Name"
                                        className="px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
                                    />
                                    <input
                                        type="number"
                                        value={startPoint.lat}
                                        onChange={(e) => setStartPoint({ ...startPoint, lat: parseFloat(e.target.value) || 0 })}
                                        placeholder="Latitude"
                                        className="px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
                                    />
                                    <input
                                        type="number"
                                        value={startPoint.lng}
                                        onChange={(e) => setStartPoint({ ...startPoint, lng: parseFloat(e.target.value) || 0 })}
                                        placeholder="Longitude"
                                        className="px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Waypoints */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">Waypoints</span>
                                    <button
                                        onClick={addWaypoint}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        <Plus className="h-4 w-4" /> Add Stop
                                    </button>
                                </div>
                                {waypoints.map((wp, idx) => (
                                    <div key={idx} className="group relative p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                        <button
                                            onClick={() => removeWaypoint(idx)}
                                            className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                                            <span className="font-medium text-blue-800 dark:text-blue-200">Stop {idx + 1}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <input
                                                type="text"
                                                value={wp.name}
                                                onChange={(e) => updateWaypoint(idx, 'name', e.target.value)}
                                                placeholder="Location Name"
                                                className="px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
                                            />
                                            <input
                                                type="number"
                                                value={wp.lat}
                                                onChange={(e) => updateWaypoint(idx, 'lat', parseFloat(e.target.value) || 0)}
                                                placeholder="Latitude"
                                                className="px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
                                            />
                                            <input
                                                type="number"
                                                value={wp.lng}
                                                onChange={(e) => updateWaypoint(idx, 'lng', parseFloat(e.target.value) || 0)}
                                                placeholder="Longitude"
                                                className="px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* End Point */}
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">E</div>
                                    <span className="font-medium text-red-800 dark:text-red-200">End Point</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        value={endPoint.name}
                                        onChange={(e) => setEndPoint({ ...endPoint, name: e.target.value })}
                                        placeholder="Location Name"
                                        className="px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
                                    />
                                    <input
                                        type="number"
                                        value={endPoint.lat}
                                        onChange={(e) => setEndPoint({ ...endPoint, lat: parseFloat(e.target.value) || 0 })}
                                        placeholder="Latitude"
                                        className="px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
                                    />
                                    <input
                                        type="number"
                                        value={endPoint.lng}
                                        onChange={(e) => setEndPoint({ ...endPoint, lng: parseFloat(e.target.value) || 0 })}
                                        placeholder="Longitude"
                                        className="px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleOptimizeRoute}
                        disabled={routeLoading}
                        className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                    >
                        {routeLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Optimizing Route...
                            </>
                        ) : (
                            <>
                                <Route className="h-5 w-5" />
                                Optimize Route
                            </>
                        )}
                    </button>

                    {routeError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <strong>Error:</strong> {routeError}
                            </div>
                        </div>
                    )}

                    {routeResult && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">Route Optimized!</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Nearest Neighbor Algorithm</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
                                        <Route className="h-8 w-8 mb-2 opacity-80" />
                                        <div className="text-green-100 text-sm font-medium">Total Distance</div>
                                        <div className="text-3xl font-bold">{Math.round(routeResult.total_distance_km).toLocaleString()} km</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
                                        <MapPin className="h-8 w-8 mb-2 opacity-80" />
                                        <div className="text-blue-100 text-sm font-medium">Total Stops</div>
                                        <div className="text-3xl font-bold">{routeResult.route.length}</div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Optimized Route Sequence</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {routeResult.route.map((loc, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
                                                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-xs ${idx === 0 ? 'bg-green-500' : idx === routeResult.route.length - 1 ? 'bg-red-500' : 'bg-blue-500'}`}>
                                                    {idx === 0 ? 'S' : idx === routeResult.route.length - 1 ? 'E' : idx}
                                                </span>
                                                <span className="text-slate-600 dark:text-slate-400">
                                                    {loc.lat.toFixed(2)}°, {loc.lng.toFixed(2)}°
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
