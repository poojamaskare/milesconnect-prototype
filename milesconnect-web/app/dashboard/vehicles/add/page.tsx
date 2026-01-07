"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateVehicle } from "@/lib/hooks/useVehicles";
import { toast } from "sonner";

export default function AddVehiclePage() {
    const router = useRouter();
    const createVehicle = useCreateVehicle();

    const [formData, setFormData] = useState({
        registrationNumber: "",
        make: "",
        model: "",
        capacityKg: "",
        name: "",
        status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "MAINTENANCE",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        createVehicle.mutate(
            {
                registrationNumber: formData.registrationNumber,
                make: formData.make,
                model: formData.model,
                capacityKg: formData.capacityKg ? parseInt(formData.capacityKg) : undefined,
                name: formData.name || undefined,
                status: formData.status,
            } as any,
            {
                onSuccess: () => {
                    toast.success("Vehicle added successfully");
                    router.push("/dashboard/vehicles");
                },
                onError: (error: any) => {
                    toast.error("Failed to add vehicle: " + (error.message || "Unknown error"));
                },
            }
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="h-4 w-4"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                        Back to Vehicles
                    </button>
                    <h1 className="text-3xl font-bold text-foreground">Add New Vehicle</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Register a new vehicle to your fleet
                    </p>
                </div>

                {/* Form */}
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Registration Number */}
                        <div>
                            <label
                                htmlFor="registrationNumber"
                                className="block text-sm font-medium text-foreground"
                            >
                                Registration Number *
                            </label>
                            <input
                                type="text"
                                id="registrationNumber"
                                name="registrationNumber"
                                value={formData.registrationNumber}
                                onChange={handleChange}
                                required
                                placeholder="MH-01-AB-1234"
                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        {/* Make and Model */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label htmlFor="make" className="block text-sm font-medium text-foreground">
                                    Make *
                                </label>
                                <input
                                    type="text"
                                    id="make"
                                    name="make"
                                    value={formData.make}
                                    onChange={handleChange}
                                    required
                                    placeholder="Tata"
                                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label htmlFor="model" className="block text-sm font-medium text-foreground">
                                    Model *
                                </label>
                                <input
                                    type="text"
                                    id="model"
                                    name="model"
                                    value={formData.model}
                                    onChange={handleChange}
                                    required
                                    placeholder="LPT 1618"
                                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>

                        {/* Name and Capacity */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Truck 01"
                                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label htmlFor="capacityKg" className="block text-sm font-medium text-foreground">
                                    Capacity (kg)
                                </label>
                                <input
                                    type="number"
                                    id="capacityKg"
                                    name="capacityKg"
                                    value={formData.capacityKg}
                                    onChange={handleChange}
                                    min="0"
                                    placeholder="5000"
                                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-foreground">
                                Status *
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="MAINTENANCE">Maintenance</option>
                            </select>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex justify-end gap-3 border-t border-border pt-6">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createVehicle.isPending}
                                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                                {createVehicle.isPending ? "Adding Vehicle..." : "Add Vehicle"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
