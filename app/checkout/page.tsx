import { Checkout } from "@/components/checkout";
import { getMaterials } from "@/lib/orders";
import { paymentSettings } from "@/lib/http";
export const dynamic = "force-dynamic";
export const metadata = { title: "Захиалга" };
export default async function CheckoutPage() {
  return <Checkout stones={await getMaterials()} payment={paymentSettings()} />;
}
