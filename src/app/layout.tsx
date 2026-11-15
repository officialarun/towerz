import type { Metadata } from 'next';
import { Provider } from '@/components/layout/Provider';
import { Header } from '@/components/layout/Header';
import './globals.css';
import './explorer-mobile.css';
import './site-explorer.css';
import './model-controls.css';
import './mobile-navigation.css';
export const metadata: Metadata = {
  title: { default: 'The Plaza — Inayat Nagar, Ayodhya', template: '%s · The Plaza' },
  description:
    'Explore the construction and proposed finish of a plaza opposite Inayat Nagar Police Station, along Ayodhya–Raebareli Road / SH15.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Provider>
          <Header />
          {children}
        </Provider>
      </body>
    </html>
  );
}
