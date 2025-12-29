import type { Metadata } from "next";
import AddVehicleClient from "./add-vehicle-client";

export const metadata: Metadata = {
  title: "Add Vehicle · MilesConnect",
};

export default function AddVehiclePage() {
  return <AddVehicleClient />;
}
