import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Eye, Trash2, ShoppingCart } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { purchaseService, productService } from '../api/services';
import { formatCurrency, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import SearchInput from '../components/UI/SearchInput';
import Pagination from '../components/UI/Pagination';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ product_id: '', quantity: 1, purchase_price: 0 }]);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { purchase_date: new Date().toISOString().slice(0, 10) }
  });

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchaseService.getAll({ search, page: pagination.page, limit: pagination.limit });
      setPurchases(res.data.data);
      setPagination(p => ({ ...p, total: res.data.pagination.total }));
    } catch {}
    setLoading(false);
  }, [search, pagination.page]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);
  useEffect(() => { productService.getAll({ limit: 500 }).then(r => setProducts(r.data.data)); }, []);

  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    setItems(updated);
  };

  const onSubmit = async (data) => {
    if (!items.every(i => i.product_id && i.quantity > 0)) {
      toast.error('All items must have a product and quantity.');
      return;
    }
    setSaving(true);
    try {
      await purchaseService.create({
        ...data,
        items: items.map(i => ({ product_id: i.product_id, quantity: parseInt(i.quantity), purchase_price: parseFloat(i.purchase_price) }))
      });
      toast.success('Purchase recorded!');
      setModalOpen(false);
      reset();
      setItems([{ product_id: '', quantity: 1, purchase_price: 0 }]);
      fetchPurchases();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await purchaseService.delete(deleteDialog.id);
      toast.success('Purchase deleted!');
      setDeleteDialog({ open: false, id: null });
      fetchPurchases();
    } catch {}
  };

  const handleView = async (id) => {
    const res = await purchaseService.getById(id);
    setViewModal(res.data.data);
  };

  const totalAmount = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.purchase_price) || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Purchases</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track stock purchases from suppliers</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Record Purchase
        </button>
      </div>

      <SearchInput value={search} onChange={v => { setSearch(v); setPagination(p => ({ ...p, page: 1 })); }} placeholder="Search supplier..." className="max-w-sm" />

      <div className="card overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="table-header">Supplier</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Total Amount</th>
                    <th className="table-header">Created By</th>
                    <th className="table-header">Notes</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {purchases.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-gray-400"><ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No purchases found</p></td></tr>
                  ) : purchases.map(p => (
                    <tr key={p._id || p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="table-cell font-medium">{p.supplier_name}</td>
                      <td className="table-cell">{formatDate(p.purchase_date)}</td>
                      <td className="table-cell font-semibold">{formatCurrency(p.total_amount)}</td>
                      <td className="table-cell">{p.created_by?.name || '—'}</td>
                      <td className="table-cell text-gray-400 text-xs">{p.notes || '—'}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleView(p._id || p.id)} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteDialog({ open: true, id: p._id || p.id })} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pagination} onPageChange={p => setPagination(prev => ({ ...prev, page: p }))} />
          </>
        )}
      </div>

      {/* New Purchase Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Purchase" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Supplier Name *</label>
              <input className="form-input" {...register('supplier_name', { required: 'Required' })} />
              {errors.supplier_name && <p className="text-red-500 text-xs mt-1">{errors.supplier_name.message}</p>}
            </div>
            <div>
              <label className="form-label">Purchase Date *</label>
              <input type="date" className="form-input" {...register('purchase_date', { required: 'Required' })} />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="form-label mb-0">Items</label>
              <button type="button" onClick={() => setItems([...items, { product_id: '', quantity: 1, purchase_price: 0 }])} className="btn-secondary text-xs py-1 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-end mb-2">
                <div className="flex-1">
                  <select className="form-input" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                    <option value="">Select product...</option>
                    {products.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.product_name} (Stock: {p.stock_quantity})</option>)}
                  </select>
                </div>
                <input type="number" min={1} placeholder="Qty" className="form-input w-20" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                <input type="number" step="0.01" placeholder="Price" className="form-input w-28" value={item.purchase_price} onChange={e => updateItem(i, 'purchase_price', e.target.value)} />
                <span className="w-24 text-sm font-medium py-2 text-right">{formatCurrency((item.quantity || 0) * (item.purchase_price || 0))}</span>
                {items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
              </div>
            ))}
            <div className="text-right text-sm font-semibold mt-2">Total: {formatCurrency(totalAmount)}</div>
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} {...register('notes')} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Purchase'}</button>
          </div>
        </form>
      </Modal>

      {/* View Purchase Modal */}
      {viewModal && (
        <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={`Purchase — ${viewModal.supplier_name}`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Date:</span> <span className="font-medium">{formatDate(viewModal.purchase_date)}</span></div>
              <div><span className="text-gray-500">Total:</span> <span className="font-bold">{formatCurrency(viewModal.total_amount)}</span></div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800"><tr><th className="table-header">Product</th><th className="table-header">Qty</th><th className="table-header">Price</th><th className="table-header">Total</th></tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {viewModal.items?.map((item, i) => (
                  <tr key={item._id || item.id || i}><td className="table-cell">{item.product_name}</td><td className="table-cell">{item.quantity}</td><td className="table-cell">{formatCurrency(item.purchase_price)}</td><td className="table-cell font-medium">{formatCurrency(item.quantity * item.purchase_price)}</td></tr>
                ))}
              </tbody>
            </table>
            {viewModal.notes && <p className="text-sm text-gray-500">{viewModal.notes}</p>}
          </div>
        </Modal>
      )}

      <ConfirmDialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })} onConfirm={handleDelete} title="Delete Purchase" message="Are you sure? Stock added by this purchase will be reversed." />
    </div>
  );
}
