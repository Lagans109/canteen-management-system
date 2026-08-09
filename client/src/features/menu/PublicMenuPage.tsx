import { useEffect, useMemo, useState } from 'react';
import * as menuService from '../../services/menuService';
import type { PublicMenuItem } from '../../types';
import { EmptyState, ErrorState } from '../../components/StateViews';
import { IconBowl, IconSearch } from '../../components/Icons';

const ALL_CATEGORY = 'all';

function MenuSkeleton() {
  return (
    <div className="menu-shell">
      <div className="menu-toolbar">
        <div className="skeleton" style={{ height: 42, borderRadius: 999, marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 32, width: 84, borderRadius: 999 }} />
          ))}
        </div>
      </div>
      <div className="item-grid">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="item-card">
            <div className="skeleton" style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '90%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 18, width: 50 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PublicMenuPage() {
  const [items, setItems] = useState<PublicMenuItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);

  useEffect(() => {
    menuService
      .getPublicMenu()
      .then((res) => setItems(res.items))
      .catch(() => setError('Unable to load the menu right now.'));
  }, []);

  const categories = useMemo(() => {
    if (!items) return [];
    const seen = new Map<string, string>();
    for (const item of items) {
      if (!seen.has(item.category.id)) seen.set(item.category.id, item.category.name);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = activeCategory === ALL_CATEGORY || item.category.id === activeCategory;
      const matchesSearch =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [items, search, activeCategory]);

  const groupedByCategory = useMemo(() => {
    const byCategory = new Map<string, { name: string; items: PublicMenuItem[] }>();
    for (const item of filteredItems) {
      const existing = byCategory.get(item.category.id);
      if (existing) {
        existing.items.push(item);
      } else {
        byCategory.set(item.category.id, { name: item.category.name, items: [item] });
      }
    }
    return Array.from(byCategory.values());
  }, [filteredItems]);

  return (
    <div>
      <header className="public-hero">
        <div className="hero-icon">
          <IconBowl style={{ width: 28, height: 28 }} />
        </div>
        <h1>Campus Canteen</h1>
        <p>Fresh bites, fair prices — here's what's cooking today.</p>
      </header>

      {error ? (
        <div className="menu-shell">
          <div className="card">
            <ErrorState label={error} />
          </div>
        </div>
      ) : !items ? (
        <MenuSkeleton />
      ) : (
        <div className="menu-shell">
          <div className="menu-toolbar">
            <div className="search-box">
              <IconSearch />
              <input
                type="search"
                placeholder="Search for samosa, tea, maggi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search menu items"
              />
            </div>
            {categories.length > 0 && (
              <div className="category-pills" role="tablist" aria-label="Filter by category">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === ALL_CATEGORY}
                  className={`category-pill ${activeCategory === ALL_CATEGORY ? 'active' : ''}`}
                  onClick={() => setActiveCategory(ALL_CATEGORY)}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === cat.id}
                    className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <EmptyState label="No items are available right now. Please check back soon." />
          ) : filteredItems.length === 0 ? (
            <EmptyState label="No items match your search." />
          ) : (
            <>
              <div className="menu-count">
                {filteredItems.length} item{filteredItems.length === 1 ? '' : 's'}
              </div>
              {groupedByCategory.map((category) => (
                <section key={category.name} className="category-section">
                  <h2>{category.name}</h2>
                  <div className="item-grid">
                    {category.items.map((item) => (
                      <article key={item.id} className="item-card">
                        {item.imageUrl ? (
                          <img className="thumb" src={item.imageUrl} alt="" />
                        ) : (
                          <div className="thumb-fallback" aria-hidden="true">
                            <IconBowl />
                          </div>
                        )}
                        <div className="body">
                          <div className="name-row">
                            <span className="name">
                              {item.name}
                              {item.variantLabel && (
                                <span style={{ color: 'var(--color-muted)', fontWeight: 500 }}> · {item.variantLabel}</span>
                              )}
                            </span>
                          </div>
                          {item.description && <p className="description">{item.description}</p>}
                          <div className="footer-row">
                            <span className="price">₹{item.price.toFixed(2)}</span>
                            <span className="badge badge-success">Available</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
