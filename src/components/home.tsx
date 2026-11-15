'use client';
import Link from 'next/link';
import { ArrowUpRight, Construction, MapPin, Route, Store } from 'lucide-react';
import { useExplorer } from '@/store/explorer';
import { PlazaMark } from '@/components/layout/Logo';
import { SITE_LOCATION } from '@/data/site';
import styles from './site-location.module.css';
export function HomeContent() {
  const s = useExplorer();
  return (
    <>
      <section id="introduction" className="introduction content-width">
        <div className="intro-heading">
          <p className="eyebrow">{s.plaza.tagline.toUpperCase()}</p>
          <h2>
            Rooted in its setting.
            <br />
            <em>Ready for a new chapter.</em>
          </h2>
        </div>
        <div className="intro-copy">
          <PlazaMark size={52} />
          <p>{s.plaza.description}</p>
          <Link href="/amenities" className="text-link">
            Get to know the plaza <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="intro-strip">
          <span>
            <Construction size={19} />
            <strong>See the current structure</strong>
            <small>Concrete frame, open bays, and front stairs.</small>
          </span>
          <span>
            <Store size={19} />
            <strong>Explore a future finish</strong>
            <small>A concept for the same roadside footprint.</small>
          </span>
          <span>
            <Route size={19} />
            <strong>
              {SITE_LOCATION.roadName} / {SITE_LOCATION.roadCode}
            </strong>
            <small>{SITE_LOCATION.oppositeNote}.</small>
          </span>
        </div>
        <div className={styles.locationBrief}>
          <MapPin size={22} />
          <div>
            <strong>{s.plaza.address || SITE_LOCATION.address}</strong>
            <p>{SITE_LOCATION.accuracyNote}</p>
          </div>
          <Link href="/location" className="text-link">
            See the setting <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      {s.plaza.gallery.length > 0 && (
        <section className="property-gallery content-width" aria-label="Property gallery">
          {s.plaza.gallery.map((url, i) => (
            <img
              key={url}
              src={url}
              alt={`${s.plaza.name} gallery image ${i + 1}`}
              loading="lazy"
            />
          ))}
        </section>
      )}
      <section className="leasing-callout content-width">
        <div>
          <p className="eyebrow">A SPACE THAT FITS YOUR AMBITION</p>
          <h2>
            Let’s make room
            <br />
            for your next big idea.
          </h2>
        </div>
        <button className="btn btn-primary" onClick={() => s.openEnquiry([])}>
          Start a conversation <ArrowUpRight size={17} />
        </button>
      </section>
    </>
  );
}
