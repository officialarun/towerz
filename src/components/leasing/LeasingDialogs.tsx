'use client';
import Link from 'next/link';
import { ArrowUpRight, Bookmark, Trash2 } from 'lucide-react';
import { useExplorer } from '@/store/explorer';
import { Dialog } from '@/components/ui/dialog';
import { EnquiryForm } from './EnquiryForm';
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
        className="enquiry-dialog"
        open={s.modal === 'enquiry'}
        onOpenChange={(v) => !v && s.setModal(null)}
        title="Let’s find your space."
        description="Find the space that suits your business."
      >
        <EnquiryForm selected={selected} />
      </Dialog>
    </>
  );
}
