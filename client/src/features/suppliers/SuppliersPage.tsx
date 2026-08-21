import { useEffect, useState } from 'react';
import * as supplierService from '../../services/supplierService';
import type { Supplier } from '../../types';
import { useToast } from '../../components/Toast';
import { ApiError } from '../../lib/apiClient';
import { LoadingState, ErrorState, EmptyState } from '../../components/StateViews';
import { IconPlus } from '../../components/Icons';

interface FormState {
  _id?: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  active: boolean;
}

const emptyForm: FormState = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  active: true,
};

// OWNER-only vendor management screen — a straightforward CRUD page (no
// search/filter/pagination, since supplier lists are expected to stay
// small; see supplierService.ts/supplier.controller.ts for the backend side).
export function SuppliersPage() {
  const toast = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Non-null while the add/edit modal is open, holding the form's field values.
  const [form, setForm] = useState<FormState | null>(null);

  const load = () => {
    supplierService
      .listSuppliers()
      .then((res) => setSuppliers(res.suppliers))
      .catch(() => setError('Unable to load suppliers.'));
  };

  useEffect(load, []);

  const openCreate = () => setForm(emptyForm);
  const openEdit = (s: Supplier) =>
    setForm({
      _id: s._id,
      name: s.name,
      contactPerson: s.contactPerson ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      address: s.address ?? '',
      notes: s.notes ?? '',
      active: s.active,
    });

  // Creates a new supplier if the form has no `_id`, otherwise updates the
  // existing one. Optional text fields are sent as `undefined` (not empty
  // strings) when blank, so they don't overwrite existing values with empty text.
  const submit = async () => {
    if (!form) return;
    const input = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
      active: form.active,
    };
    try {
      if (form._id) {
        await supplierService.updateSupplier(form._id, input);
        toast.show('Supplier updated', 'success');
      } else {
        await supplierService.createSupplier(input);
        toast.show('Supplier created', 'success');
      }
      setForm(null);
      load();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Failed to save supplier', 'error');
    }
  };

  const toggleActive = async (s: Supplier) => {
    await supplierService.updateSupplier(s._id, { active: !s.active });
    load();
  };

  if (error) return <ErrorState label={error} />;
  if (!suppliers) return <LoadingState label="Loading suppliers..." />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Suppliers</h1>
          <p>Manage vendors used for inventory purchases.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <IconPlus style={{ width: 15, height: 15 }} />
          Add Supplier
        </button>
      </div>

      <div className="card">
        {suppliers.length === 0 ? (
          <EmptyState label="No suppliers yet." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s._id}>
                    <td>{s.name}</td>
                    <td>{s.contactPerson ?? '-'}</td>
                    <td>{s.phone ?? '-'}</td>
                    <td>{s.email ?? '-'}</td>
                    <td>
                      <span className={`badge ${s.active ? 'badge-success' : 'badge-muted'}`}>
                        {s.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-sm" onClick={() => openEdit(s)}>
                          Edit
                        </button>
                        <button className="btn btn-sm" onClick={() => toggleActive(s)}>
                          {s.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{form._id ? 'Edit Supplier' : 'Add Supplier'}</h2>
            <div className="field">
              <label>Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Contact Person</label>
                <input
                  className="input"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Phone</label>
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Address</label>
              <textarea
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setForm(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submit} disabled={!form.name.trim()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
