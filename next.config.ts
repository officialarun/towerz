import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};
export default config;
