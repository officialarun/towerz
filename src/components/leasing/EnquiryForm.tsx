'use client';
import { useEffect, useId, useRef } from 'react';
import { useExplorer } from '@/store/explorer';
import { isMobileViewport } from '@/hooks/useIsMobile';
import { FLOORS } from '@/data/demo';
import type { Unit } from '@/types';

export function EnquiryForm({ selected }: { selected: Unit[] }) {
  const floors = useExplorer((state) => state.floors);
  const form = useRef<HTMLFormElement>(null);
  const noticeId = useId();
  useEffect(() => {
    const viewport = window.visualViewport;
    const sheet = form.current?.closest<HTMLElement>('.enquiry-dialog');
    if (!viewport || !sheet) return;
    let frame = 0;
    function update() {
      if (!viewport || !sheet) return;
      sheet.style.setProperty('--enquiry-viewport-height', `${viewport.height}px`);
      sheet.style.setProperty(
        '--enquiry-viewport-bottom',
        `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`,
      );
      sheet.toggleAttribute('data-compact-height', viewport.height < 500);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const active = document.activeElement;
        if (
          isMobileViewport() &&
          active instanceof HTMLElement &&
          sheet.contains(active) &&
          active.matches('input, textarea, select')
        ) {
          active.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        }
      });
    }
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);
  return (
    <form ref={form} onSubmit={(event) => event.preventDefault()} className="enquiry-form">
      <div className="enquiry-fields">
        <p id={noticeId} className="enquiry-notice" role="status">
          Online submissions are coming soon. Entries in this form are not sent or saved.
        </p>
        <div className="selected-tags">
          {selected.length ? (
            selected.map((u) => (
              <span key={u.id}>
                {u.id} · {floors.find((f) => f.id === u.floor)?.label || FLOORS[u.floor].label}
              </span>
            ))
          ) : (
            <span>General leasing enquiry</span>
          )}
        </div>
        <div className="form-grid">
          <label>
            Full name
            <input
              name="name"
              enterKeyHint="next"
              autoComplete="name"
              placeholder="Your full name"
              required
              minLength={2}
              maxLength={100}
            />
          </label>
          <label>
            Mobile number
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              enterKeyHint="next"
              autoComplete="tel"
              placeholder="Your mobile number"
              required
              maxLength={22}
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              inputMode="email"
              enterKeyHint="next"
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="email"
              placeholder="you@business.com"
              required
              maxLength={254}
            />
          </label>
          <label>
            Business category
            <select name="category" required defaultValue="">
              <option value="" disabled>
                Select your business
              </option>
              {[
                'Retail',
                'Fashion & lifestyle',
                'Food & beverage',
                'Showroom',
                'Services',
                'Studio',
                'Other business',
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span>
            Preferred visit date <span className="muted">(optional)</span>
          </span>
          <input name="visitDate" type="date" min={new Date().toISOString().slice(0, 10)} />
        </label>
        <label>
          <span>
            A little about your plans <span className="muted">(optional)</span>
          </span>
          <textarea
            name="message"
            placeholder="What are you looking for in your next space?"
            rows={3}
            maxLength={3000}
          />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" name="consent" required />
          <span>
            I agree to be contacted about my enquiry and understand that submitting this form does
            not reserve a unit.
          </span>
        </label>
        <p className="demo-note">
          This is a demonstration property. Contact and location details will be supplied by the
          property owner.
        </p>
      </div>
      <div className="enquiry-submit-area">
        <button
          type="submit"
          className="btn btn-primary submit-enquiry"
          aria-describedby={noticeId}
          disabled
        >
          Submission coming soon
        </button>
      </div>
    </form>
  );
}
