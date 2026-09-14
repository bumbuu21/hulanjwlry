import { isAdmin } from "@/lib/auth";
import { getMaterials, listOrders } from "@/lib/orders";
import { AdminDashboard, AdminLogin } from "@/components/admin";
export const dynamic = "force-dynamic";
export const metadata = { title: "Студио удирдлага", robots: { index: false, follow: false } };
export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  const [orders, stones] = await Promise.all([listOrders(), getMaterials()]);
  return <AdminDashboard orders={orders} stones={stones} />;
}
