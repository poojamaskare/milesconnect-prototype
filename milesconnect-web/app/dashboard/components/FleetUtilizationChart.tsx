"use client";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from "recharts";

export default function FleetUtilizationChart({ active, idle, maintenance }: { active: number; idle: number; maintenance: number }) {
    const data = [
        { name: "Active", value: active, color: "#10b981" }, // Emerald-500
        { name: "Idle", value: idle, color: "#94a3b8" },   // Slate-400
        { name: "Maint", value: maintenance, color: "#f59e0b" }, // Amber-500
    ].filter(d => d.value > 0);

    const total = active + idle + maintenance;
    const utilization = total > 0 ? Math.round((active / total) * 100) : 0;

    if (data.length === 0) return <div className="h-[180px] w-full flex items-center justify-center text-xs text-foreground/40">No fleet data</div>;

    return (
        <div className="relative h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                className="transition-opacity duration-300 hover:opacity-80"
                                stroke="rgba(0,0,0,0)"
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: 'rgba(255,255,255,0.1)',
                            color: '#e2e8f0',
                            fontSize: '12px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                        }}
                        itemStyle={{ color: '#e2e8f0', fontWeight: 500 }}
                        cursor={{ fill: 'transparent' }}
                        separator=": "
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{utilization}%</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-foreground/50">Active</span>
            </div>
        </div>
    );
}
