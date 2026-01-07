"use client";

import { useDemandForecast } from "@/lib/hooks/useML";
import { Loader2, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export function DemandForecastWidget() {
    const { data, isLoading, isError } = useDemandForecast(7);

    if (isLoading) {
        return (
            <div className="flex h-[300px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex h-[300px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-slate-500">Failed to load forecast data</p>
            </div>
        );
    }

    const forecast = data;

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case "increasing":
                return <TrendingUp className="h-5 w-5 text-green-500" />;
            case "decreasing":
                return <TrendingDown className="h-5 w-5 text-red-500" />;
            default:
                return <Minus className="h-5 w-5 text-slate-500" />;
        }
    };

    const getTrendColor = (trend: string) => {
        switch (trend) {
            case "increasing":
                return "text-green-600 bg-green-50 dark:bg-green-900/20";
            case "decreasing":
                return "text-red-600 bg-red-50 dark:bg-red-900/20";
            default:
                return "text-slate-600 bg-slate-50 dark:bg-slate-800";
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                        <span className="rounded-md bg-purple-100 p-1 text-purple-600 dark:bg-purple-900/30">
                            <Calendar className="h-5 w-5" />
                        </span>
                        Demand Forecast (Next 7 Days)
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        AI-powered shipment volume predictions
                    </p>
                </div>
                <div
                    className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${getTrendColor(
                        forecast.trend
                    )}`}
                >
                    {getTrendIcon(forecast.trend)}
                    <span className="capitalize">{forecast.trend} Trend</span>
                </div>
            </div>

            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecast.forecasts}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="day_of_week"
                            tick={{ fontSize: 12 }}
                            interval={0}
                            tickFormatter={(val) => val.substring(0, 3)}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                            labelStyle={{ color: "#64748b", fontSize: "12px" }}
                        />
                        <Bar
                            dataKey="predicted_shipments"
                            name="Predicted Shipments"
                            fill="#8b5cf6"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-2">
                {(forecast.recommendations || []).map((rec: string, index: number) => (
                    <div
                        key={index}
                        className="flex items-start gap-2 rounded-md bg-slate-50 p-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                        <span className="mt-0.5 text-xs">💡</span>
                        {rec}
                    </div>
                ))}
            </div>
        </div>
    );
}
