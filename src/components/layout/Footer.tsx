'use client';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Logo } from './Logo';
import { useExplorer } from '@/store/explorer';
export function Footer() {
  const s = useExplorer();
  return (
    <footer className="site-footer">
      <div>
        <Logo name={s.plaza.name} />
        <p>A considered space for what comes next.</p>
      </div>
      <div>
        <Link href="/explore">
          Explore the plaza <ArrowUpRight size={13} />
        </Link>
        <Link href="/shops">
          Find your space <ArrowUpRight size={13} />
        </Link>
        <Link href="/contact">
          Get in touch <ArrowUpRight size={13} />
        </Link>
      </div>
      <div className="footer-note">
        <span>
          © {new Date().getFullYear()} {s.plaza.name}
        </span>
        <small>Architectural demonstration. All specifications are illustrative.</small>
      </div>
    </footer>
  );
}
