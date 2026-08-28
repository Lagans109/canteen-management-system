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

// Same static fields as ItemFormState, plus `quantity` (edited here as a
// plain "what should it be now" number, not a +/- change) and `active`,
// which the create form doesn't need (new items always start active).
// Submitting a changed quantity doesn't call updateInventoryItem — the
// backend rejects quantity on that endpoint — it goes through
// createTransaction as an ADJUSTMENT, same as "Adjust Stock", so the change
// still lands in the audit trail (see submitEditForm).
interface EditFormState {
  name: string;
  unit: string;
  quantity: string;
  minStockThreshold: string;
  costPrice: string;
  supplier: string;
  active: boolean;
}

function toEditForm(item: InventoryItem): EditFormState {
  return {
    name: item.name,
    unit: item.unit,
    quantity: String(item.quantity),
    minStockThreshold: String(item.minStockThreshold),
    costPrice: String(item.costPrice),
    supplier: typeof item.supplier === 'object' && item.supplier ? item.supplier._id : (item.supplier ?? ''),
    active: item.active,
  };
}

const TRANSACTION_TYPES: TransactionType[] = ['PURCHASE', 'SALE', 'ADJUSTMENT', 'WASTE', 'RETURN'];

// Stock management screen, open to OWNER and CASHIER alike. Quantity can be changed either via
// "Adjust Stock" (a +/- transaction) or by setting a new value in "Edit"
// (see submitEditForm) — either way it's always recorded as an
// InventoryTransaction, so the backend audit trail (see recordTransaction)
// stays complete.
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

  // State for the "Edit Item" modal: which item is being edited, and its
  // editable field values (quantity is deliberately excluded — see EditFormState).
  const [editTarget, setEditTarget] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);

  // State for the "Adjust Stock" modal: which item is being adjusted, and
  // the transaction details being entered.
  const [txnTarget, setTxnTarget] = useState<InventoryItem | null>(null);
  const [txnType, setTxnType] = useState<TransactionType>('PURCHASE');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnReason, setTxnReason] = useState('');

  // State for the "History" modal: which item's transaction log is open, and its data once loaded.
  const [historyTarget, setHistoryTarget] = useState<InventoryItem | null>(null);
  const [history, setHistory] = useState<InventoryTransaction[] | null>(null);

  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(async () => {
  try {
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

  const openEdit = (item: InventoryItem) => {
    setEditTarget(item);
    setEditForm(toEditForm(item));
  };

  const submitEditForm = async () => {
    if (!editTarget || !editForm) return;
    try {
      await inventoryService.updateInventoryItem(editTarget._id, {
        name: editForm.name.trim(),
        unit: editForm.unit.trim(),
        minStockThreshold: Number(editForm.minStockThreshold) || 0,
        costPrice: Number(editForm.costPrice) || 0,
        supplier: editForm.supplier || undefined,
        active: editForm.active,
      });

      // Quantity isn't part of the PUT above (the backend rejects it there)
      // — a changed value is instead recorded as an ADJUSTMENT transaction,
      // same as "Adjust Stock", so it still leaves an audit trail.
      const newQuantity = Number(editForm.quantity);
      const quantityChange = Math.round((newQuantity - editTarget.quantity) * 100) / 100;
      if (Number.isFinite(quantityChange) && quantityChange !== 0) {
        await inventoryService.createTransaction(editTarget._id, {
          type: 'ADJUSTMENT',
          quantityChange,
          reason: 'Manual quantity edit (Edit Item)',
        });
      }

      toast.show('Inventory item updated', 'success');
      setEditTarget(null);
      setEditForm(null);
      load();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Failed to update item', 'error');
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
                          <button className="btn btn-sm" onClick={() => openEdit(item)}>
                            Edit
                          </button>
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

      {editTarget && editForm && (
        <div
          className="modal-overlay"
          onClick={() => {
            setEditTarget(null);
            setEditForm(null);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Inventory Item — {editTarget.name}</h2>
            <div className="form-row">
              <div className="field">
                <label>Name</label>
                <input
                  className="input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Unit</label>
                <input
                  className="input"
                  placeholder="kg, pcs, ltr..."
                  value={editForm.unit}
                  onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Quantity</label>
                <input
                  className="input"
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Min Stock Threshold</label>
                <input
                  className="input"
                  type="number"
                  value={editForm.minStockThreshold}
                  onChange={(e) => setEditForm({ ...editForm, minStockThreshold: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Cost Price</label>
                <input
                  className="input"
                  type="number"
                  value={editForm.costPrice}
                  onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Supplier (optional)</label>
                <select
                  className="input"
                  value={editForm.supplier}
                  onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
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
            <div className="form-row">
              <div className="field">
                <label>Status</label>
                <select
                  className="input"
                  value={editForm.active ? 'active' : 'inactive'}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.value === 'active' })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>
              Changing quantity is recorded as an ADJUSTMENT transaction (visible in "History"), same as using "Adjust
              Stock".
            </p>
            <div className="modal-actions">
              <button
                className="btn"
                onClick={() => {
                  setEditTarget(null);
                  setEditForm(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={submitEditForm}
                disabled={!editForm.name.trim() || !editForm.unit.trim()}
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
