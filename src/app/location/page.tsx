import { LocationPage } from '@/components/ContentPages';
import { Footer } from '@/components/layout/Footer';
export const metadata = { title: 'Location & Visits' };
export default function Page() {
  return (
    <>
      <LocationPage />
      <Footer />
    </>
  );
}
