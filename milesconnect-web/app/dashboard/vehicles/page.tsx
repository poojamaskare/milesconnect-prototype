import type { Metadata } from "next";
import VehiclesPage from "../../(dashboard)/vehicles/page";

export const metadata: Metadata = {
  title: "Vehicles · MilesConnect",
};

export default function VehiclesPageAlias() {
  return <VehiclesPage />;
}
