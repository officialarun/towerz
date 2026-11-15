import { Explorer } from '@/components/three/Explorer';
export const metadata = { title: 'Interactive Floor Plans' };
export default function Page() {
  return <Explorer dedicated initialView="plan" />;
}
