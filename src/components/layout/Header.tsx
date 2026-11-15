'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { useExplorer } from '@/store/explorer';
const links = [
  ['Home', '/'],
  ['Explore 3D', '/explore'],
  ['Floor Plans', '/floor-plans'],
  ['Shops', '/shops'],
  ['Amenities', '/amenities'],
  ['Location', '/location'],
];
export function Header() {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const openEnquiry = useExplorer((s) => s.openEnquiry);
  const name = useExplorer((s) => s.plaza.name);
  return (
    <header className="site-header">
      <Logo name={name} />
      <nav className={menu ? 'main-nav mobile-open' : 'main-nav'} aria-label="Main navigation">
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className={path === href ? 'active' : ''}
            onClick={() => setMenu(false)}
          >
            {label}
          </Link>
        ))}
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
        <button
          className="mobile-menu round-button"
          aria-label={menu ? 'Close menu' : 'Open menu'}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
