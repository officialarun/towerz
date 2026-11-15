'use client';
import { useState } from 'react';
import {
  ArrowUpRight,
  Box,
  Construction,
  Footprints,
  Layers,
  LayoutGrid,
  Lightbulb,
  Mail,
  MapPin,
  Phone,
  Route,
  Shield,
  Store,
  Sun,
  Trees,
} from 'lucide-react';
import { useExplorer } from '@/store/explorer';
import { PlazaMark } from './layout/Logo';
import { SITE_LOCATION } from '@/data/site';
import styles from './site-location.module.css';
const icons: Record<string, React.ElementType> = {
  atrium: Sun,
  glass: Store,
  tree: Trees,
  stairs: Layers,
  light: Lightbulb,
  layout: LayoutGrid,
  road: Route,
  construction: Construction,
  station: Shield,
};
export function AmenitiesPage() {
  const s = useExplorer();
  return (
    <main id="main" className="page-main">
      <div className="page-intro content-width">
        <div>
          <p className="eyebrow">THE STRUCTURE AND THE POSSIBILITIES</p>
          <h1>
            The site today.
            <br />
            <em>A practical future vision.</em>
          </h1>
          <p>
            Start with the unfinished frame visible in the street views, then explore a proposed
            retail finish within the same roadside setting.
          </p>
        </div>
        <button className="btn btn-outline" onClick={() => s.openEnquiry([])}>
          Talk to the leasing team <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="content-width page-section">
        <div className="amenities-grid">
          {s.plaza.amenities.map((a, i) => {
            const Icon = icons[a.icon] || Box;
            return (
              <article className="amenity" key={i}>
                <span>
                  <Icon size={28} />
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2>{a.title}</h2>
                <p>{a.description}</p>
              </article>
            );
          })}
        </div>
        <p className="demo-note" style={{ marginTop: 22 }}>
          The current view reconstructs the visible concrete frame, stairs, and open bays. Glazing,
          signage, lighting and unit layouts belong to the illustrative proposal. Three commercial
          levels (GF, 1F and 2F) sit above the semi-basement; upper geometry extends the
          photographed grid. Facilities and specifications remain subject to property-team
          confirmation.
        </p>
      </div>
    </main>
  );
}
export function LocationPage() {
  const s = useExplorer();
  const address = s.plaza.address || SITE_LOCATION.address;
  const directionsUrl = s.plaza.mapUrl || SITE_LOCATION.directionsUrl;
  return (
    <main id="main" className="page-main">
      <div className="page-intro content-width">
        <div>
          <p className="eyebrow">
            {SITE_LOCATION.roadName} / {SITE_LOCATION.roadCode}
          </p>
          <h1>
            A roadside address.
            <br />
            <em>A recognizable setting.</em>
          </h1>
          <p>{address}</p>
        </div>
      </div>
      <div className="location-grid content-width">
        <LocationSchematic plazaName={s.plaza.name} />
        <div className="location-copy">
          <p className="eyebrow">{SITE_LOCATION.oppositeNote}</p>
          <h2 style={{ marginTop: 17 }}>Understand the approach.</h2>
          <p>
            The supplied views show the plaza beside existing shops, a mature tree and a small
            roadside shrine. The divided road, roadside railing and nearby pedestrian crossing help
            place the building in its surroundings.
          </p>
          <div className="location-fact">
            <MapPin size={18} />
            <div>
              <strong>Property location</strong>
              <p>{address}</p>
            </div>
          </div>
          <div className="location-fact">
            <Route size={18} />
            <div>
              <strong>Road context</strong>
              <p>
                {SITE_LOCATION.roadName} / {SITE_LOCATION.roadCode}, opposite{' '}
                {SITE_LOCATION.landmark}.
              </p>
            </div>
          </div>
          <div className="location-fact">
            <Footprints size={18} />
            <div>
              <strong>Explore at your pace</strong>
              <p>
                Request a preferred visit date. The property team will confirm access to the
                construction site and share arrival details.
              </p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => s.openEnquiry([])}>
            Request a site visit <ArrowUpRight size={15} />
          </button>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn btn-outline ${styles.directions}`}
          >
            Open directions <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
    </main>
  );
}

type SiteFeature = 'plaza' | 'station' | 'shops' | 'shrine' | 'crossing';
const featureCopy: Record<SiteFeature, { title: string; description: string }> = {
  plaza: {
    title: 'The plaza',
    description:
      'The unfinished roadside frame and entry stairs shown in the supplied street views.',
  },
  station: {
    title: SITE_LOCATION.landmark,
    description:
      'The user-provided landmark opposite the plaza, across Ayodhya–Raebareli Rd / SH15.',
  },
  shops: {
    title: 'Neighboring shops',
    description:
      'The modest mixed-use buildings, awnings and roadside stalls visible beside the site.',
  },
  shrine: {
    title: 'Tree and small shrine',
    description: 'The mature roadside tree and small conical shrine visible beside the plaza.',
  },
  crossing: {
    title: 'Pedestrian crossing / junction',
    description:
      'The zebra crossing and junction visible in the reference views, shown approximately.',
  },
};

function LocationSchematic({ plazaName }: { plazaName: string }) {
  const [selected, setSelected] = useState<SiteFeature>('plaza');
  function featureButton(feature: SiteFeature, label: React.ReactNode, className = '') {
    return (
      <button
        type="button"
        className={`${styles.feature} ${className} ${selected === feature ? styles.selected : ''}`}
        aria-pressed={selected === feature}
        onClick={() => setSelected(feature)}
      >
        {label}
      </button>
    );
  }
  return (
    <section className={styles.schematic} aria-label="Approximate site orientation">
      <div className={styles.mapHeading}>
        <MapPin size={20} />
        <div>
          <h2>The site at a glance</h2>
          <p>Tap a place to see its context.</p>
        </div>
      </div>
      <div className={styles.siteRow}>
        {featureButton(
          'shops',
          <>
            <Store size={20} />
            <span>
              Neighboring
              <br />
              shops
            </span>
          </>,
        )}
        {featureButton(
          'plaza',
          <>
            <Construction size={24} />
            <strong>{plazaName}</strong>
            <small>Current construction</small>
          </>,
          styles.plaza,
        )}
        {featureButton(
          'shrine',
          <>
            <Trees size={22} />
            <span>
              Tree &amp;
              <br />
              small shrine
            </span>
          </>,
        )}
      </div>
      <div className={styles.road}>
        <span className={styles.railing}>Roadside railing</span>
        <p>
          {SITE_LOCATION.roadName} <strong>{SITE_LOCATION.roadCode}</strong>
        </p>
        <div className={styles.median}>
          <span>Planted divider / guardrail</span>
        </div>
        {featureButton(
          'crossing',
          <>
            <Footprints size={16} />
            <span>Crossing / junction</span>
          </>,
          styles.crossing,
        )}
      </div>
      <div className={styles.opposite}>
        <p>{SITE_LOCATION.oppositeNote}</p>
        {featureButton(
          'station',
          <>
            <Shield size={19} />
            <span>{SITE_LOCATION.landmark}</span>
          </>,
          styles.station,
        )}
      </div>
      <div className={styles.featureDetail} aria-live="polite" aria-atomic="true">
        <strong>{selected === 'plaza' ? plazaName : featureCopy[selected].title}</strong>
        <p>{featureCopy[selected].description}</p>
      </div>
      <p className={styles.accuracy}>
        Orientation schematic, not to scale. {SITE_LOCATION.accuracyNote}
      </p>
    </section>
  );
}
export function ContactPage() {
  const s = useExplorer();
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  return (
    <main id="main" className="page-main">
      <div className="page-intro content-width">
        <div>
          <p className="eyebrow">THE START OF SOMETHING GOOD</p>
          <h1>
            Big ideas
            <br />
            <em>begin with a hello.</em>
          </h1>
          <p>
            Whether you have a space in mind or are just exploring, let’s talk about what comes
            next.
          </p>
        </div>
      </div>
      <div className="contact-grid content-width">
        <section className="contact-card">
          <PlazaMark size={45} />
          <h2>Let’s make room for you.</h2>
          <p>
            Explore the available spaces and plan your visit. Online enquiry submissions are coming
            soon.
          </p>
          <button className="btn btn-primary" onClick={() => s.openEnquiry()}>
            Start an enquiry <ArrowUpRight size={15} />
          </button>
          {whatsapp && /^\d{8,15}$/.test(whatsapp) && (
            <a
              className="btn btn-outline"
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hello, I would like to enquire about a space at The Plaza.')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Enquire on WhatsApp <ArrowUpRight size={15} />
            </a>
          )}
          {s.plaza.contactEmail && (
            <a className="contact-line" href={`mailto:${s.plaza.contactEmail}`}>
              <Mail size={16} />
              {s.plaza.contactEmail}
            </a>
          )}
          {s.plaza.contactPhone && (
            <a className="contact-line" href={`tel:${s.plaza.contactPhone.replace(/[^+\d]/g, '')}`}>
              <Phone size={16} />
              {s.plaza.contactPhone}
            </a>
          )}
          {!s.plaza.contactEmail && !s.plaza.contactPhone && (
            <p className="demo-note">
              Official phone and email details will be shared here when available.
            </p>
          )}
        </section>
        <div className="contact-steps">
          {[
            [
              'Explore your options',
              'Take a look around in 3D or browse the floor plans. Start with the level and space that feels right.',
            ],
            [
              'Build your shortlist',
              'Save your favourite available spaces and compare their specifications side by side.',
            ],
            [
              'Plan your visit',
              'Keep your preferred spaces in mind for a site visit. Online enquiries will be available here soon.',
            ],
          ].map(([title, body], i) => (
            <div key={title}>
              <span>0{i + 1}</span>
              <section>
                <h3>{title}</h3>
                <p>{body}</p>
              </section>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
