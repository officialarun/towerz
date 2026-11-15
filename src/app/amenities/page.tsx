import { AmenitiesPage } from '@/components/ContentPages';
import { Footer } from '@/components/layout/Footer';
export const metadata = { title: 'Considered Amenities' };
export default function Page() {
  return (
    <>
      <AmenitiesPage />
      <Footer />
    </>
  );
}
