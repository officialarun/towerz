'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Box, House, Layers, MapPin, Sparkles, Store } from 'lucide-react';
import { Logo } from './Logo';
import { useExplorer } from '@/store/explorer';
const links = [
  { label: 'Home', mobileLabel: 'Home', href: '/', icon: House },
  { label: 'Explore 3D', mobileLabel: '3D', href: '/explore', icon: Box },
  { label: 'Floor Plans', mobileLabel: 'Plans', href: '/floor-plans', icon: Layers },
  { label: 'Shops', mobileLabel: 'Shops', href: '/shops', icon: Store },
  { label: 'Amenities', mobileLabel: 'Amenities', href: '/amenities', icon: Sparkles },
  { label: 'Location', mobileLabel: 'Location', href: '/location', icon: MapPin },
];
export function Header() {
  const path = usePathname().replace(/\/$/, '') || '/';
  const openEnquiry = useExplorer((s) => s.openEnquiry);
  const name = useExplorer((s) => s.plaza.name);
  return (
    <header className="site-header">
      <Logo name={name} />
      <nav className="main-nav app-navigation" aria-label="Main navigation">
        {links.map(({ label, mobileLabel, href, icon: Icon }) => {
          const active = path === href || (href !== '/' && path.startsWith(href + '/'));
          return (
            <Link
              key={href}
              href={href}
              className={active ? 'active' : ''}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="app-nav-icon" size={19} strokeWidth={1.8} aria-hidden="true" />
              <span className="desktop-nav-label">{label}</span>
              <span className="mobile-nav-label">{mobileLabel}</span>
            </Link>
          );
        })}
      </nav>
      <div className="header-actions">
        <button
          className="btn btn-primary header-enquire"
          aria-label="Enquire now"
          onClick={() => openEnquiry([])}
        >
          <span className="desktop-header-label">Enquire now</span>
          <span className="mobile-header-label">Enquire</span> <ArrowUpRight size={17} />
        </button>
      </div>
    </header>
  );
}
