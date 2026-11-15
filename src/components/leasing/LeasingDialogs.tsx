'use client';
import Link from 'next/link';
import { ArrowUpRight, Bookmark, Trash2 } from 'lucide-react';
import { useExplorer } from '@/store/explorer';
import { Dialog } from '@/components/ui/dialog';
import { FLOORS } from '@/data/demo';
import { area, money } from '@/lib/utils';
export function LeasingDialogs() {
  const s = useExplorer();
  const shortlisted = s.units.filter((u) => s.shortlist.includes(u.id));
  const selected = s.units.filter((u) => s.enquiryIds.includes(u.id));
  return (
    <>
      <Dialog
        open={s.modal === 'shortlist'}
        onOpenChange={(v) => !v && s.setModal(null)}
        title="Your space, shortlisted."
        description="Compare your favourite available spaces in one place."
        wide
      >
        {shortlisted.length ? (
          <>
            <div className="comparison-wrap">
              <table className="comparison">
                <thead>
                  <tr>
                    <th>Space</th>
                    {shortlisted.map((u) => (
                      <th key={u.id}>
                        <Link href={`/shops/${u.id}`} onClick={() => s.setModal(null)}>
                          {u.id} <ArrowUpRight size={13} />
                        </Link>
                        <button
                          aria-label={`Remove ${u.id}`}
                          onClick={() => s.toggleShortlist(u.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    [
                      'Floor',
                      ...shortlisted.map(
                        (u) => s.floors.find((f) => f.id === u.floor)?.name || FLOORS[u.floor].name,
                      ),
                    ],
                    [
                      'Area',
                      ...shortlisted.map((u) => `${area(u.areaSqFt)} / ${u.areaSqFt} sq ft`),
                    ],
                    ['Frontage', ...shortlisted.map((u) => `${u.frontage} m`)],
                    ['Ceiling height', ...shortlisted.map((u) => `${u.ceilingHeight} m`)],
                    ['Status', ...shortlisted.map((u) => u.status)],
                    [
                      'Rent',
                      ...shortlisted.map((u) =>
                        u.pricePublic && u.price !== undefined
                          ? money(u.price) + '/month'
                          : 'On request',
                      ),
                    ],
                  ].map(([label, ...cells]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      {cells.map((c, i) => (
                        <td key={i}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="demo-note">
              Illustrative specifications and availability. Confirm all details with the leasing
              team.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => s.openEnquiry(shortlisted.map((u) => u.id))}
            >
              Enquire about these spaces <ArrowUpRight size={16} />
            </button>
          </>
        ) : (
          <div className="empty-state">
            <Bookmark size={32} />
            <h3>A little room for possibility.</h3>
            <p>Add available units from the explorer or shop catalog to compare them here.</p>
            <Link href="/shops" className="btn btn-primary" onClick={() => s.setModal(null)}>
              Discover the spaces <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </Dialog>
      <Dialog
        open={s.modal === 'enquiry'}
        onOpenChange={(v) => !v && s.setModal(null)}
        title="Let’s find your space."
        description="Find the space that suits your business."
      >
        <form onSubmit={(event) => event.preventDefault()} className="enquiry-form">
          <p className="enquiry-notice" role="status">
            Online submissions are coming soon. Entries in this form are not sent or saved.
          </p>
          <div className="selected-tags">
            {selected.length ? (
              selected.map((u) => (
                <span key={u.id}>
                  {u.id} · {s.floors.find((f) => f.id === u.floor)?.label || FLOORS[u.floor].label}
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
            Preferred visit date <span className="muted">(optional)</span>
            <input name="visitDate" type="date" min={new Date().toISOString().slice(0, 10)} />
          </label>
          <label>
            A little about your plans <span className="muted">(optional)</span>
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
          <button type="submit" className="btn btn-primary submit-enquiry" disabled>
            Submission coming soon
          </button>
          <p className="demo-note">
            This is a demonstration property. Contact and location details will be supplied by the
            property owner.
          </p>
        </form>
      </Dialog>
    </>
  );
}
