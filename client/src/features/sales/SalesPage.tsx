import { useEffect, useMemo, useState } from 'react';
import * as menuService from '../../services/menuService';
import * as saleService from '../../services/saleService';
import type { PublicMenuItem, Sale } from '../../types';
import { useToast } from '../../components/Toast';
import { ApiError } from '../../lib/apiClient';
import { LoadingState, EmptyState, ErrorState } from '../../components/StateViews';
import { IconMinus, IconPlus, IconSearch } from '../../components/Icons';

interface DraftLine {
  menuItem: string;
  name: string;
  variantLabel?: string;
  unitPrice: number;
  quantity: number;
}

export function SalesPage() {
  const toast = useToast();
  const [menuItems, setMenuItems] = useState<PublicMenuItem[] | null>(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<DraftLine[]>([]);
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadSales = () => {
    saleService
      .listSales({ limit: 20 })
      .then((res) => setSales(res.sales))
      .catch(() => setError('Unable to load sales history.'));
  };

  useEffect(() => {
    menuService
      .getPublicMenu()
      .then((res) => setMenuItems(res.items))
      .catch(() => setError('Unable to load the menu.'));
    loadSales();
  }, []);

  const filteredMenuItems = useMemo(() => {
    if (!menuItems) return [];
    const query = search.trim().toLowerCase();
    if (!query) return menuItems;
    return menuItems.filter((item) => item.name.toLowerCase().includes(query));
  }, [menuItems, search]);

  const addOne = (item: PublicMenuItem) => {
    setDraft((prev) => {
      const existing = prev.find((l) => l.menuItem === item.id);
      if (existing) {
        return prev.map((l) => (l.menuItem === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      const line: DraftLine = { menuItem: item.id, name: item.name, unitPrice: item.price, quantity: 1 };
      if (item.variantLabel) line.variantLabel = item.variantLabel;
      return [...prev, line];
    });
  };

  const changeQuantity = (menuItem: string, delta: number) => {
    setDraft((prev) =>
      prev
        .map((l) => (l.menuItem === menuItem ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );
  };

  const removeLine = (menuItem: string) => {
    setDraft((prev) => prev.filter((l) => l.menuItem !== menuItem));
  };

  const total = draft.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const itemCount = draft.reduce((sum, l) => sum + l.quantity, 0);

  const submitSale = async () => {
    if (draft.length === 0) return;
    setSubmitting(true);
    try {
      await saleService.createSale({
        items: draft.map((l) => ({ menuItem: l.menuItem, quantity: l.quantity })),
      });
      toast.show('Sale recorded successfully', 'success');
      setDraft([]);
      loadSales();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Failed to record sale', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <ErrorState label={error} />;
  if (!menuItems) return <LoadingState label="Loading menu..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Record Sale</h1>
          <p>Tap items to add them, then submit the sale.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="search-box" style={{ maxWidth: 360 }}>
          <IconSearch />
          <input
            type="search"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search menu items"
          />
        </div>

        {filteredMenuItems.length === 0 ? (
          <EmptyState label="No items match your search." />
        ) : (
          <div className="sale-picker-grid" style={{ marginTop: 14 }}>
            {filteredMenuItems.map((item) => (
              <button key={item.id} type="button" className="sale-picker-card" onClick={() => addOne(item)}>
                <span className="name">
                  {item.name}
                  {item.variantLabel && ` · ${item.variantLabel}`}
                </span>
                <span className="price">₹{item.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}

        {draft.length > 0 && (
          <div className="sale-cart">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Unit Price</th>
                    <th>Qty</th>
                    <th>Line Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {draft.map((line) => (
                    <tr key={line.menuItem}>
                      <td>
                        {line.name}
                        {line.variantLabel && (
                          <span style={{ color: 'var(--color-muted)' }}> · {line.variantLabel}</span>
                        )}
                      </td>
                      <td>₹{line.unitPrice.toFixed(2)}</td>
                      <td>
                        <div className="qty-stepper">
                          <button type="button" onClick={() => changeQuantity(line.menuItem, -1)} aria-label={`Decrease ${line.name} quantity`}>
                            <IconMinus style={{ width: 14, height: 14 }} />
                          </button>
                          <span>{line.quantity}</span>
                          <button type="button" onClick={() => changeQuantity(line.menuItem, 1)} aria-label={`Increase ${line.name} quantity`}>
                            <IconPlus style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      </td>
                      <td>₹{(line.unitPrice * line.quantity).toFixed(2)}</td>
                      <td>
                        <button className="btn btn-sm" onClick={() => removeLine(line.menuItem)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="total-row" style={{ marginTop: 14 }}>
              <div>
                <span className="total-amount">₹{total.toFixed(2)}</span>
                <span style={{ color: 'var(--color-muted)', marginLeft: 8, fontSize: 13 }}>
                  {itemCount} item{itemCount === 1 ? '' : 's'}
                </span>
              </div>
              <button className="btn btn-primary" onClick={submitSale} disabled={submitting}>
                {submitting ? 'Recording...' : 'Record Sale'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Recent Sales</h2>
        {!sales ? (
          <LoadingState />
        ) : sales.length === 0 ? (
          <EmptyState label="No sales recorded yet." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Items</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale._id}>
                    <td>{new Date(sale.createdAt).toLocaleString()}</td>
                    <td>{sale.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}</td>
                    <td>₹{sale.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
