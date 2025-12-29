"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Image from "next/image";

async function createVehicle(data: any) {
  return api.post("/api/vehicles", data);
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-foreground/10 bg-card">
      <div className="border-b border-foreground/10 p-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-xs text-foreground/60">{description}</p> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function AddVehicleClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    registrationNumber: "",
    make: "",
    model: "",
    status: "ACTIVE",
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const createMutation = useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      router.push("/vehicles");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl: string | undefined;

    // If there's an image file, convert to base64 data URL for storage
    if (imageFile) {
      imageUrl = previewImage || undefined;
    }

    const payload = {
      registrationNumber: formData.registrationNumber,
      name: formData.name || undefined,
      make: formData.make || undefined,
      model: formData.model || undefined,
      imageUrl,
      status: formData.status,
    };

    createMutation.mutate(payload);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Add Vehicle</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Add a new vehicle to your fleet.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Vehicle Details">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/60">
                Registration Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., MH12AB1234"
                value={formData.registrationNumber}
                onChange={(e) =>
                  setFormData({ ...formData, registrationNumber: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/60">
                Vehicle Name
              </label>
              <input
                type="text"
                placeholder="e.g., Blue Hauler"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-foreground/60">Make</label>
                <input
                  type="text"
                  placeholder="e.g., Tata"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60">Model</label>
                <input
                  type="text"
                  placeholder="e.g., Prima"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/60">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>
        </Card>

        <Card title="Vehicle Photo">
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {previewImage ? (
              <div className="relative">
                <div className="relative h-48 w-full overflow-hidden rounded-lg border border-foreground/10">
                  <Image
                    src={previewImage}
                    alt="Vehicle preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-48 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-foreground/20 bg-foreground/[0.02] hover:border-foreground/30 hover:bg-foreground/[0.04]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-10 w-10 text-foreground/40"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
                <span className="mt-2 text-sm text-foreground/60">Click to upload photo</span>
                <span className="mt-1 text-xs text-foreground/40">PNG, JPG up to 5MB</span>
              </button>
            )}
          </div>
        </Card>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background outline-none transition hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:opacity-50"
          >
            {createMutation.isPending ? "Adding..." : "Add Vehicle"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-md border border-foreground/10 bg-card px-4 py-2 text-sm font-semibold text-foreground outline-none transition hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-foreground/30"
          >
            Cancel
          </button>
        </div>

        {createMutation.isError ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
            Failed to add vehicle. Please check the registration number is unique and try again.
          </div>
        ) : null}
      </form>
    </main>
  );
}
