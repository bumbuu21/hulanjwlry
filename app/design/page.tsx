import type { Metadata } from "next";
import { Designer } from "@/components/designer";
import { getMaterials } from "@/lib/orders";
export const metadata: Metadata = { title: "Бугуйвчаа бүтээх" };
export const dynamic = "force-dynamic";
export default async function DesignPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; stone?: string; resume?: string }>;
}) {
  const params = await searchParams;
  return (
    <Designer
      stones={await getMaterials()}
      preset={params.preset}
      startingStone={params.stone}
      resume={params.resume === "1"}
    />
  );
}
