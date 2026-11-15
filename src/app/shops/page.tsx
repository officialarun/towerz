import { ShopCatalog } from '@/components/leasing/ShopCatalog';
import { Footer } from '@/components/layout/Footer';
export const metadata = { title: 'Find Your Space' };
export default function Page() {
  return (
    <>
      <ShopCatalog />
      <Footer />
    </>
  );
}
