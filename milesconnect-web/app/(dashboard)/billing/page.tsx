import type { Metadata } from "next";

import BillingClient from "./billing-client";

export const metadata: Metadata = {
  title: "Billing & Payments · MilesConnect",
};
export default function BillingPage() {
	return <BillingClient />;
}
