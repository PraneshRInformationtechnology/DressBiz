import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, AlertTriangle, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { productService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import SearchInput from '../components/UI/SearchInput';
import Pagination from '../components/UI/Pagination';

const CATEGORIES = ['Saree', 'Kurti', 'Salwar', 'Lehenga', 'Dupatta', 'Blouse', 'Shirt', 'T-Shirt', 'Pant', 'Dress', 'Other'];

// MongoDB returns _id; helper to get id from either field
const getId = (obj) => obj?._id || obj?.id;

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [editProduct, setEditProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.getAll({ search, category, page: pagination.page, limit: pagination.limit });
      setProducts(res.data.data);
      setPagination(p => ({ ...p, total: res.data.pagination.total }));
    } catch {}
    setLoading(false);
  }, [search, category, pagination.page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openAdd = () => { setEditProduct(null); reset({}); setModalOpen(true); };
  const openEdit = (p) => {
    setEditProduct(p);
    ['product_name','category','brand','size','color','purchase_price','selling_price','stock_quantity','minimum_stock_level','description']
      .forEach(k => setValue(k, p[k]));
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editProduct) {
        await productService.update(getId(editProduct), data);
        toast.success('Product updated!');
      } else {
        await productService.create(data);
        toast.success('Product created!');
      }
      setModalOpen(false);
      fetchProducts();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await productService.delete(deleteDialog.id);
      toast.success('Product deleted!');
      setDeleteDialog({ open: false, id: null });
      fetchProducts();
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Products</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your dress inventory</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPagination(p => ({ ...p, page: 1 })); }} placeholder="Search products..." className="flex-1" />
        <select value={category} onChange={e => { setCategory(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} className="form-input sm:w-48">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="table-header">Product</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Size/Color</th>
                    <th className="table-header">Buy Price</th>
                    <th className="table-header">Sell Price</th>
                    <th className="table-header">Stock</th>
                    <th className="table-header">Status</th>
                    {user?.role === 'admin' && <th className="table-header">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {products.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-center text-gray-400">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No products found</p>
                    </td></tr>
                  ) : products.map(p => (
                    <tr key={getId(p)} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="table-cell">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{p.product_name}</div>
                        {p.brand && <div className="text-xs text-gray-400">{p.brand}</div>}
                      </td>
                      <td className="table-cell">{p.category}</td>
                      <td className="table-cell">
                        {p.size  && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded mr-1">{p.size}</span>}
                        {p.color && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{p.color}</span>}
                      </td>
                      <td className="table-cell">{formatCurrency(p.purchase_price)}</td>
                      <td className="table-cell font-medium">{formatCurrency(p.selling_price)}</td>
                      <td className="table-cell">
                        <span className={`font-semibold ${p.is_low_stock ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                          {p.stock_quantity}
                        </span>
                      </td>
                      <td className="table-cell">
                        {p.is_low_stock
                          ? <span className="badge-red flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3" />Low Stock</span>
                          : <span className="badge-green">In Stock</span>}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteDialog({ open: true, id: getId(p) })} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pagination} onPageChange={p => setPagination(prev => ({ ...prev, page: p }))} />
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="form-label">Product Name *</label>
            <input className="form-input" {...register('product_name', { required: 'Required' })} />
            {errors.product_name && <p className="text-red-500 text-xs mt-1">{errors.product_name.message}</p>}
          </div>
          <div>
            <label className="form-label">Category *</label>
            <select className="form-input" {...register('category', { required: 'Required' })}>
              <option value="">Select...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
          </div>
          <div>
            <label className="form-label">Brand</label>
            <input className="form-input" {...register('brand')} />
          </div>
          <div>
            <label className="form-label">Size</label>
            <input className="form-input" placeholder="S, M, L, XL..." {...register('size')} />
          </div>
          <div>
            <label className="form-label">Color</label>
            <input className="form-input" {...register('color')} />
          </div>
          <div>
            <label className="form-label">Purchase Price (₹) *</label>
            <input type="number" step="0.01" className="form-input" {...register('purchase_price', { required: 'Required', min: 0 })} />
            {errors.purchase_price && <p className="text-red-500 text-xs mt-1">{errors.purchase_price.message}</p>}
          </div>
          <div>
            <label className="form-label">Selling Price (₹) *</label>
            <input type="number" step="0.01" className="form-input" {...register('selling_price', { required: 'Required', min: 0 })} />
            {errors.selling_price && <p className="text-red-500 text-xs mt-1">{errors.selling_price.message}</p>}
          </div>
          <div>
            <label className="form-label">Stock Quantity</label>
            <input type="number" className="form-input" defaultValue={0} {...register('stock_quantity', { min: 0 })} />
          </div>
          <div>
            <label className="form-label">Min Stock Level</label>
            <input type="number" className="form-input" defaultValue={5} {...register('minimum_stock_level', { min: 0 })} />
          </div>
          <div className="col-span-2">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={2} {...register('description')} />
          </div>
          <div className="col-span-2 flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product?"
      />
    </div>
  );
}
