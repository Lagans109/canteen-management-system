import Pagination from '@mui/material/Pagination';
import { useCallback, useEffect, useState } from 'react';
import * as inventoryService from '../../services/inventoryService';
import * as supplierService from '../../services/supplierService';
import type {
  InventoryItem,
  InventoryTransaction,
  Supplier,
  TransactionType,
} from '../../types';
import { useToast } from '../../components/Toast';
import { ApiError } from '../../lib/apiClient';
import { LoadingState, ErrorState, EmptyState } from '../../components/StateViews';
import { IconPlus } from '../../components/Icons';interface ItemFormState {
  name: string;
  unit: string;
  quantity: string;
  minStockThreshold: string;
  costPrice: string;
  supplier: string;
}

const emptyItemForm: ItemFormState = {
  name: '',
  unit: '',
  quantity: '0',
  minStockThreshold: '0',
  costPrice: '0',
  supplier: '',
};

const TRANSACTION_TYPES: TransactionType[] = ['PURCHASE', 'SALE', 'ADJUSTMENT', 'WASTE', 'RETURN'];

// OWNER-only stock management screen. Item quantity is never edited
// directly on this page — every change goes through the "Adjust Stock"
// transaction flow below, so the backend can keep an audit trail (see
// InventoryTransaction / recordTransaction on the backend).
export function InventoryPage() {
  const toast = useToast();
  // Both fetched together on mount (see `load` below); items and
  // suppliers are needed together because the item table shows each
  // item's linked supplier name and the "Add Item" form offers a supplier dropdown.
  const [items, setItems] = useState<InventoryItem[] | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState<ItemFormState>(emptyItemForm);

  // State for the "Adjust Stock" modal: which item is being adjusted, and
  // the transaction details being entered.
  const [txnTarget, setTxnTarget] = useState<InventoryItem | null>(null);
  const [txnType, setTxnType] = useState<TransactionType>('PURCHASE');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnReason, setTxnReason] = useState('');

  // State for the "History" modal: which item's transaction log is open, and its data once loaded.
  const [historyTarget, setHistoryTarget] = useState<InventoryItem | null>(null);
  const [history, setHistory] = useState<InventoryTransaction[] | null>(null);

   // Loading state
  const [loading,setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    const [inventoryRes, suppliersRes] = await Promise.all([
      inventoryService.listInventoryItems(page, rowsPerPage),
      supplierService.listSuppliers(),
    ]);

    setItems(inventoryRes.items);
    setTotalItems(inventoryRes.total);
    setTotalPages(inventoryRes.totalPages);

    setSuppliers(suppliersRes.suppliers);
  } catch (err) {
    setError(
      err instanceof ApiError
        ? err.message
        : 'Unable to load inventory data.',
    );
  } finally {
    setLoading(false);
  }
}, [page, rowsPerPage]);
  useEffect(() => {
    load();
  }, [load]);

  const submitItemForm = async () => {
    try {
      await inventoryService.createInventoryItem({
        name: itemForm.name.trim(),
        unit: itemForm.unit.trim(),
        quantity: Number(itemForm.quantity) || 0,
        minStockThreshold: Number(itemForm.minStockThreshold) || 0,
        costPrice: Number(itemForm.costPrice) || 0,
        supplier: itemForm.supplier || undefined,
        active: true,
      });
      toast.show('Inventory item created', 'success');
      setShowItemForm(false);
      setItemForm(emptyItemForm);
      load();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Failed to create item', 'error');
    }
  };

  const openTxn = (item: InventoryItem) => {
    setTxnTarget(item);
    setTxnType('PURCHASE');
    setTxnAmount('');
    setTxnReason('');
  };

  // Submits a stock transaction. SALE/WASTE always reduce stock
  // (quantityChange is forced negative here), PURCHASE/RETURN always
  // increase it (forced positive), while ADJUSTMENT is a manual
  // correction where the entered amount's sign is used as-is (it can go
  // either direction). The backend still re-validates the resulting
  // quantity never goes negative (see applyQuantityChange).
  const submitTxn = async () => {
    if (!txnTarget) return;
    const amount = Number(txnAmount);
    if (!amount) return;
    const signed = ['SALE', 'WASTE'].includes(txnType) ? -Math.abs(amount) : Math.abs(amount);
    try {
      await inventoryService.createTransaction(txnTarget._id, {
        type: txnType,
        quantityChange: txnType === 'ADJUSTMENT' ? amount : signed,
        reason: txnReason.trim() || undefined,
      });
      toast.show('Stock updated', 'success');
      setTxnTarget(null);
      load();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Failed to update stock', 'error');
    }
  };

  const openHistory = async (item: InventoryItem) => {
    setHistoryTarget(item);
    const res = await inventoryService.listItemTransactions(item._id);
    setHistory(res.transactions);
  };

  if (error) return <ErrorState label={error} />;
  if (!items || !suppliers) return <LoadingState label="Loading inventory..." />;

  // Low-stock count is recalculated from the loaded items on every render
  // (cheap, no need for useMemo) — must match the same rule the backend
  // uses for listLowStockItems (quantity <= minStockThreshold).
  const lowStockCount = items.filter((i) => i.quantity <= i.minStockThreshold).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>
            {totalItems} item{totalItems === 1 ? '' : 's'} tracked
            {lowStockCount > 0 && (
              <>
                {' '}
                &middot; <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>{lowStockCount} low on stock</span>
              </>
            )}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowItemForm(true)}>
          <IconPlus style={{ width: 15, height: 15 }} />
          Add Item
        </button>
      </div>

      <div className="card">
        {items.length === 0 ? (
          <EmptyState label="No inventory items yet." />
        ) :(
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Threshold</th>
                  <th>Cost Price</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const low = item.quantity <= item.minStockThreshold;
                  return (
                    <tr key={item._id}>
                      <td>
                        {low && <span className="low-stock-dot" aria-hidden="true" />}
                        {item.name}
                      </td>
                      <td>
                        {item.quantity} {item.unit}
                        {low && (
                          <span className="badge badge-danger" style={{ marginLeft: 6 }}>
                            Low
                          </span>
                        )}
                      </td>
                      <td>{item.minStockThreshold}</td>
                      <td>₹{item.costPrice.toFixed(2)}</td>
                      <td>{typeof item.supplier === 'object' && item.supplier ? item.supplier.name : '-'}</td>
                      <td>
                        <span className={`badge ${item.active ? 'badge-success' : 'badge-muted'}`}>
                          {item.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-sm" onClick={() => openTxn(item)}>
                            Adjust Stock
                          </button>
                          <button className="btn btn-sm" onClick={() => openHistory(item)}>
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MUI Pagination */}
{totalPages > 1 && (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      marginTop: 24,
      marginBottom: 24,
    }}
  >
    <Pagination
      count={totalPages}
      page={page}
      onChange={(_, value) => setPage(value)}
      color="primary"
      shape="rounded"
      showFirstButton
      showLastButton
    />
  </div>
)}

      {showItemForm && (
        <div className="modal-overlay" onClick={() => setShowItemForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Inventory Item</h2>
            <div className="form-row">
              <div className="field">
                <label>Name</label>
                <input
                  className="input"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Unit</label>
                <input
                  className="input"
                  placeholder="kg, pcs, ltr..."
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Opening Quantity</label>
                <input
                  className="input"
                  type="number"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Min Stock Threshold</label>
                <input
                  className="input"
                  type="number"
                  value={itemForm.minStockThreshold}
                  onChange={(e) => setItemForm({ ...itemForm, minStockThreshold: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Cost Price</label>
                <input
                  className="input"
                  type="number"
                  value={itemForm.costPrice}
                  onChange={(e) => setItemForm({ ...itemForm, costPrice: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Supplier (optional)</label>
                <select
                  className="input"
                  value={itemForm.supplier}
                  onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })}
                >
                  <option value="">None</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowItemForm(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={submitItemForm}
                disabled={!itemForm.name.trim() || !itemForm.unit.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {txnTarget && (
        <div className="modal-overlay" onClick={() => setTxnTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Adjust Stock — {txnTarget.name}</h2>
            <div className="field">
              <label>Transaction Type</label>
              <select className="input" value={txnType} onChange={(e) => setTxnType(e.target.value as TransactionType)}>
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{txnType === 'ADJUSTMENT' ? 'Quantity Change (+/-)' : 'Quantity'}</label>
              <input
                className="input"
                type="number"
                value={txnAmount}
                onChange={(e) => setTxnAmount(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Reason (optional)</label>
              <input className="input" value={txnReason} onChange={(e) => setTxnReason(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setTxnTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submitTxn} disabled={!txnAmount}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {historyTarget && (
        <div className="modal-overlay" onClick={() => setHistoryTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>History — {historyTarget.name}</h2>
            {!history ? (
              <LoadingState />
            ) : history.length === 0 ? (
              <EmptyState label="No transactions yet." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Change</th>
                      <th>Before</th>
                      <th>After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((t) => (
                      <tr key={t._id}>
                        <td>{new Date(t.createdAt).toLocaleString()}</td>
                        <td>
                          <span className="badge badge-muted">{t.type}</span>
                        </td>
                        <td style={{ color: t.quantityChange < 0 ? 'var(--color-danger)' : 'var(--color-accent)', fontWeight: 700 }}>
                          {t.quantityChange > 0 ? '+' : ''}
                          {t.quantityChange}
                        </td>
                        <td>{t.quantityBefore}</td>
                        <td>{t.quantityAfter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn" onClick={() => setHistoryTarget(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
