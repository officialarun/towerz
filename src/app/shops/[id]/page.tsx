import { notFound } from 'next/navigation';
import { DEMO_UNITS } from '@/data/demo';
import { ShopDetails } from '@/components/leasing/ShopDetails';
import { Footer } from '@/components/layout/Footer';
export const dynamicParams = false;
export function generateStaticParams() {
  return DEMO_UNITS.map((unit) => ({ id: unit.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: `Shop ${(await params).id}` };
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = DEMO_UNITS.find((u) => u.id === id);
  if (!unit) notFound();
  return (
    <>
      <ShopDetails initialUnit={unit} />
      <Footer />
    </>
  );
}
