"use client";

import { useEffect } from "react";
import { usePredictDeliveryTime, type DeliveryTimePrediction } from "@/lib/hooks/useML";
import { Loader2, TrendingUp, Clock, Gauge } from "lucide-react";

interface MLPredictionCardProps {
    originAddress: string;
    destinationAddress: string;
    weightKg: number;
    vehicleCapacityKg?: number;
}

export function MLPredictionCard({
    originAddress,
    destinationAddress,
    weightKg,
    vehicleCapacityKg,
}: MLPredictionCardProps) {
    const predictMutation = usePredictDeliveryTime();

    useEffect(() => {
        if (originAddress && destinationAddress && weightKg > 0) {
            predictMutation.mutate({
                origin_address: originAddress,
                destination_address: destinationAddress,
                weight_kg: weightKg,
                vehicle_capacity_kg: vehicleCapacityKg,
            });
        }
    }, [originAddress, destinationAddress, weightKg, vehicleCapacityKg]);

    if (!originAddress || !destinationAddress || weightKg <= 0) {
        return null;
    }

    if (predictMutation.isPending) {
        return (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-900">Calculating AI prediction...</span>
                </div>
            </div>
        );
    }

    if (predictMutation.isError) {
        return null; // Silently fail - ML is optional
    }

    if (!predictMutation.data) {
        return null;
    }

    const prediction = predictMutation.data;

    if (!prediction) {
        return null;
    }

    return (
        <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-blue-900">🤖 AI Prediction</h4>
                    <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-700">Estimated Delivery Time:</span>
                            <span className="font-bold text-blue-900">
                                {prediction.predicted_hours.toFixed(1)} hours
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-700">Confidence:</span>
                            <span className="font-semibold text-blue-900">
                                {(prediction.confidence * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                            <Clock className="h-3 w-3" />
                            <span>Expected arrival: {new Date(prediction.estimated_arrival).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Factors */}
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-blue-200 pt-2">
                        <div className="text-xs">
                            <div className="text-blue-600">Travel Time</div>
                            <div className="font-semibold text-blue-900">
                                {prediction.factors.base_travel_hours.toFixed(1)}h
                            </div>
                        </div>
                        <div className="text-xs">
                            <div className="text-blue-600">Loading Time</div>
                            <div className="font-semibold text-blue-900">
                                {prediction.factors.loading_time_hours.toFixed(1)}h
                            </div>
                        </div>
                        <div className="text-xs">
                            <div className="text-blue-600">Avg Speed</div>
                            <div className="font-semibold text-blue-900 flex items-center gap-1">
                                <Gauge className="h-3 w-3" />
                                {prediction.factors.effective_speed_kmh.toFixed(0)} km/h
                            </div>
                        </div>
                        <div className="text-xs">
                            <div className="text-blue-600">Traffic Factor</div>
                            <div className="font-semibold text-blue-900">
                                {(prediction.factors.traffic_factor * 100).toFixed(0)}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
