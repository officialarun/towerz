'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Bookmark, Check, Grid2X2, List, Search } from 'lucide-react';
import { useExplorer } from '@/store/explorer';
import { Status, UnitPreview } from './UnitPanel';
import { area, money } from '@/lib/utils';
export function ShopCatalog() {
  const s = useExplorer();
  const [search, setSearch] = useState('');
  const [floor, setFloor] = useState('all');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [size, setSize] = useState('all');
  const [price, setPrice] = useState('all');
  const [list, setList] = useState(false);
  const filtered = useMemo(
    () =>
      s.units.filter(
        (u) =>
          (!search || `${u.id} ${u.category}`.toLowerCase().includes(search.toLowerCase())) &&
          (floor === 'all' || u.floor === Number(floor)) &&
          (status === 'all' || u.status === status) &&
          (category === 'all' || u.category === category) &&
          (size === 'all' ||
            (size === 'small'
              ? u.areaSqFt < 500
              : size === 'medium'
                ? u.areaSqFt >= 500 && u.areaSqFt <= 1000
                : u.areaSqFt > 1000)) &&
          (price === 'all' ||
            (u.pricePublic &&
              u.price !== undefined &&
              (price === 'low' ? u.price < 25000 : u.price >= 25000))),
      ),
    [s.units, search, floor, status, category, size, price],
  );
  const categories = [...new Set(s.units.map((u) => u.category))];
  function reset() {
    setSearch('');
    setFloor('all');
    setStatus('all');
    setCategory('all');
    setSize('all');
    setPrice('all');
  }
  return (
    <main id="main" className="page-main">
      <div className="page-intro content-width">
        <div>
          <p className="eyebrow">A SPACE FOR EVERY AMBITION</p>
          <h1>
            Find your place.
            <br />
            <em>Make it your own.</em>
          </h1>
          <p>
            Explore the spaces, compare the possibilities, and discover a new home for your
            business. All availability and specifications shown are illustrative.
          </p>
        </div>
        <button className="btn btn-outline" onClick={() => s.setModal('shortlist')}>
          <Bookmark size={15} />
          Your shortlist ({s.shortlist.length})
        </button>
      </div>
      <section className="content-width page-section" aria-label="Shop inventory">
        <div className="catalog-filters">
          <div className="search-field">
            <Search size={15} />
            <input
              aria-label="Search shops"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by unit or business type…"
            />
          </div>
          <select
            aria-label="Filter by floor"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
          >
            <option value="all">All floors</option>
            {s.floors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by availability"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All availability</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="leased">Leased</option>
          </select>
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Filter by area"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            <option value="all">All sizes</option>
            <option value="small">Under 500 sq ft</option>
            <option value="medium">500–1,000 sq ft</option>
            <option value="large">Over 1,000 sq ft</option>
          </select>
          {s.units.some((u) => u.pricePublic && u.price !== undefined) && (
            <select
              aria-label="Filter by monthly rent"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            >
              <option value="all">All rents</option>
              <option value="low">Under ₹25,000</option>
              <option value="high">₹25,000 and over</option>
            </select>
          )}
          <div className="layout-toggle">
            <button
              className={!list ? 'active' : ''}
              aria-label="Card view"
              onClick={() => setList(false)}
            >
              <Grid2X2 size={15} />
            </button>
            <button
              className={list ? 'active' : ''}
              aria-label="List view"
              onClick={() => setList(true)}
            >
              <List size={15} />
            </button>
          </div>
        </div>
        <div className="catalog-count">
          <span>
            {filtered.length} spaces to explore{' '}
            <span className="muted">
              · {s.units.filter((u) => u.status === 'available').length} available across the plaza
            </span>
          </span>
          <button onClick={reset}>Reset filters</button>
        </div>
        {filtered.length ? (
          <div className={`catalog-grid ${list ? 'list' : ''}`}>
            {filtered.map((u) => (
              <article className="shop-card" key={u.id}>
                <Link className="shop-card-image" href={`/shops/${u.id}`}>
                  {u.images[0] ? <img src={u.images[0]} alt={`Shop ${u.id}`} /> : <UnitPreview />}
                  <Status status={u.status} />
                </Link>
                <div className="shop-card-body">
                  <div className="shop-card-heading">
                    <Link href={`/shops/${u.id}`}>
                      <h2>Shop {u.id}</h2>
                    </Link>
                    <button
                      className={s.shortlist.includes(u.id) ? 'saved' : ''}
                      onClick={() => s.toggleShortlist(u.id)}
                      aria-label={`${s.shortlist.includes(u.id) ? 'Remove' : 'Shortlist'} ${u.id}`}
                      disabled={u.status !== 'available' && !s.shortlist.includes(u.id)}
                    >
                      {s.shortlist.includes(u.id) ? <Check size={17} /> : <Bookmark size={17} />}
                    </button>
                  </div>
                  <p>
                    {s.floors.find((f) => f.id === u.floor)?.name} <span>·</span> {u.category}
                  </p>
                  <div className="shop-card-metrics">
                    <span>
                      {area(u.areaSqFt)}
                      <small>{u.areaSqFt} sq ft</small>
                    </span>
                    <span>
                      {u.frontage.toFixed(1)} m<small>Frontage</small>
                    </span>
                    <span>
                      {u.ceilingHeight.toFixed(1)} m<small>Ceiling</small>
                    </span>
                  </div>
                  <div className="shop-card-footer">
                    <span>
                      {u.pricePublic && u.price !== undefined
                        ? `${money(u.price)} / mo`
                        : 'Rent on request'}
                    </span>
                    <Link href={`/shops/${u.id}`}>
                      Discover the space <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <h3>No spaces match just yet.</h3>
            <p>Try another floor, size, or business category.</p>
            <button className="btn btn-outline btn-sm" onClick={reset} style={{ marginTop: 20 }}>
              Reset filters
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
