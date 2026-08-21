import { useEffect, useState } from 'react';
import * as menuService from '../../services/menuService';
import type { Category, MenuItem } from '../../types';
import { useToast } from '../../components/Toast';
import { ApiError } from '../../lib/apiClient';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { LoadingState, ErrorState, EmptyState } from '../../components/StateViews';
import { IconPlus } from '../../components/Icons';


interface ItemFormState {
  _id?: string;
  name: string;
  description: string;
  price: string;
  variantLabel: string;
  category: string;
  active: boolean;
  available: boolean;
  displayOrder: string;
  imageUrl: string;
}

const emptyItemForm: ItemFormState = {
  name: '',
  description: '',
  price: '',
  variantLabel: '',
  category: '',
  active: true,
  available: true,
  displayOrder: '0',
  imageUrl: '',
};

// OWNER-only admin screen for managing categories and menu items. Every
// mutation (create/update/delete) re-fetches the full lists afterward via
// `load()` rather than patching local state manually, keeping this page's
// data always in sync with the database.
export function MenuManagementPage() {
  const toast = useToast();
  // Both start as `null` (not []) so LoadingState can be shown until the
  // very first fetch completes.
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [categoryName, setCategoryName] = useState('');
  // Non-null while the add/edit item modal is open; holds the form's
  // current field values (as strings, converted to numbers on submit).
  const [itemForm, setItemForm] = useState<ItemFormState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);


  // Fetches categories and items together (in parallel) — called on mount
  // and again after every create/update/delete so the table reflects the
  // latest data. NOTE: getAllMenuItems() is called with no page/limit
  // arguments here, so it relies on the backend's current behavior of
  // always returning every menu item in one response.
  const load = async () => {
    try {
      const [cats, its] = await Promise.all([menuService.getCategories(), menuService.getAllMenuItems()]);
      setCategories(cats.categories);
      setItems(its.items);
    } catch {
      setError('Unable to load menu data.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categoryName_ = (id: string) => categories?.find((c) => c._id === id)?.name ?? 'Unknown';

  const handleAddCategory = async () => {
    if (!categoryName.trim()) return;
    try {
      await menuService.createCategory({ name: categoryName.trim(), displayOrder: 0, active: true });
      setCategoryName('');
      toast.show('Category added', 'success');
      load();
    } catch (err) {
      // ApiError's message comes straight from the backend (e.g. Zod
      // validation text or a duplicate-name error); anything else falls
      // back to a generic message.
      toast.show(err instanceof ApiError ? err.message : 'Failed to add category', 'error');
    }
  };

  const toggleCategoryActive = async (category: Category) => {
    await menuService.updateCategory(category._id, { active: !category.active });
    load();
  };

  const openCreateItem = () => setItemForm(emptyItemForm);
  const openEditItem = (item: MenuItem) =>
    setItemForm({
      _id: item._id,
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      variantLabel: item.variantLabel ?? '',
      category: typeof item.category === 'string' ? item.category : item.category._id,
      active: item.active,
      available: item.available,
      displayOrder: String(item.displayOrder),
      imageUrl: item.imageUrl ?? '',
    });

  // Submits the item form: creates a new item if there's no `_id`,
  // otherwise updates the existing one. Numeric fields are parsed from
  // their string form-state representation before being sent.
  const submitItemForm = async () => {
    if (!itemForm) return;
    const input = {
      name: itemForm.name.trim(),
      description: itemForm.description.trim() || undefined,
      price: Number(itemForm.price),
      variantLabel: itemForm.variantLabel.trim() || undefined,
      category: itemForm.category,
      active: itemForm.active,
      available: itemForm.available,
      displayOrder: Number(itemForm.displayOrder) || 0,
      imageUrl: itemForm.imageUrl.trim() || undefined,
    };
    try {
      if (itemForm._id) {
        await menuService.updateMenuItem(itemForm._id, input);
        toast.show('Item updated', 'success');
      } else {
        await menuService.createMenuItem(input);
        toast.show('Item created', 'success');
      }
      setItemForm(null);
      load();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Failed to save item', 'error');
    }
  };

  const toggleItemActive = async (item: MenuItem) => {
    await menuService.updateMenuItem(item._id, { active: !item.active });
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await menuService.deleteMenuItem(deleteTarget.id);
      toast.show('Item deleted', 'success');
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Failed to delete item', 'error');
    } finally {
      setDeleteTarget(null);
      load();
    }
  };

  if (error) return <ErrorState label={error} />;
  if (!categories || !items) return <LoadingState label="Loading menu data..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Menu Management</h1>
          <p>Manage categories and items shown on the public menu.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 className="section-title">Categories</h2>
        <div className="form-row" style={{ marginBottom: 4, alignItems: 'flex-end' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="category-name">New Category</label>
            <input
              id="category-name"
              className="input"
              placeholder="e.g. Beverages"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={handleAddCategory} style={{ height: 38 }}>
            <IconPlus style={{ width: 15, height: 15 }} />
            Add
          </button>
        </div>
        {categories.length === 0 ? (
          <EmptyState label="No categories yet." />
        ) : (
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat._id}>
                    <td>{cat.name}</td>
                    <td>
                      <span className={`badge ${cat.active ? 'badge-success' : 'badge-muted'}`}>
                        {cat.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm" onClick={() => toggleCategoryActive(cat)}>
                        {cat.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="page-header" style={{ marginBottom: 12 }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            Items
          </h2>
          <button className="btn btn-primary btn-sm" onClick={openCreateItem}>
            <IconPlus style={{ width: 14, height: 14 }} />
            Add Item
          </button>
        </div>
        {items.length === 0 ? (
          <EmptyState label="No menu items yet. Add your first item to get started." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Variant</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Available</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.variantLabel ?? '-'}</td>
                    <td>{typeof item.category === 'string' ? categoryName_(item.category) : item.category.name}</td>
                    <td>₹{item.price.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${item.active ? 'badge-success' : 'badge-muted'}`}>
                        {item.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.available ? 'badge-success' : 'badge-warning'}`}>
                        {item.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-sm" onClick={() => openEditItem(item)}>
                          Edit
                        </button>
                        <button className="btn btn-sm" onClick={() => toggleItemActive(item)}>
                          {item.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => setDeleteTarget({ id: item._id, name: item.name })}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* MUI Pagination 
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
            )}*/}
          </div>
        )}
      </div>

      {itemForm && (
        <div className="modal-overlay" onClick={() => setItemForm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{itemForm._id ? 'Edit Item' : 'Add Item'}</h2>
            <div className="field">
              <label>Name</label>
              <input
                className="input"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                className="input"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Price</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Variant / Size (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. 1 L, 250 ml"
                  value={itemForm.variantLabel}
                  onChange={(e) => setItemForm({ ...itemForm, variantLabel: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Category</label>
                <select
                  className="input"
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Display Order</label>
                <input
                  className="input"
                  type="number"
                  value={itemForm.displayOrder}
                  onChange={(e) => setItemForm({ ...itemForm, displayOrder: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Image URL (optional)</label>
                <input
                  className="input"
                  value={itemForm.imageUrl}
                  onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={itemForm.active}
                  onChange={(e) => setItemForm({ ...itemForm, active: e.target.checked })}
                />
                Active
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={itemForm.available}
                  onChange={(e) => setItemForm({ ...itemForm, available: e.target.checked })}
                />
                Available
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setItemForm(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={submitItemForm}
                disabled={!itemForm.name.trim() || !itemForm.price || !itemForm.category}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Menu Item"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
