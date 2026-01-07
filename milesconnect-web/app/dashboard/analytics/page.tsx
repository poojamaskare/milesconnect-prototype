import AnalyticsClient from "./AnalyticsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Analytics · MilesConnect",
    description: "Fleet performance insights and predictive analytics",
};

export default function AnalyticsPage() {
    return <AnalyticsClient />;
}
