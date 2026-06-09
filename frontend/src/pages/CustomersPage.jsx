import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, User, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../api/services';
import { formatCurrency } from '../utils/helpers';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';
import SearchInput from '../components/UI/SearchInput';
import Pagination from '../components/UI/Pagination';

const getId = (obj) => obj?._id || obj?.id;

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerService.getAll({ search, page: pagination.page, limit: pagination.limit });
      setCustomers(res.data.data);
      setPagination(p => ({ ...p, total: res.data.pagination.total }));
    } catch {}
    setLoading(false);
  }, [search, pagination.page]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openAdd = () => { setEditCustomer(null); reset({}); setModalOpen(true); };
  const openEdit = (c) => {
    setEditCustomer(c);
    ['customer_name', 'phone', 'email', 'address'].forEach(k => setValue(k, c[k]));
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editCustomer) {
        await customerService.update(getId(editCustomer), data);
        toast.success('Customer updated!');
      } else {
        await customerService.create(data);
        toast.success('Customer added!');
      }
      setModalOpen(false);
      fetchCustomers();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customers</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage customer accounts and dues</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <SearchInput value={search} onChange={v => { setSearch(v); setPagination(p => ({ ...p, page: 1 })); }} placeholder="Search by name or phone..." className="max-w-sm" />

      <div className="card overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="table-header">Customer</th>
                    <th className="table-header">Phone</th>
                    <th className="table-header">Total Purchased</th>
                    <th className="table-header">Total Paid</th>
                    <th className="table-header">Outstanding Due</th>
                    <th className="table-header">Invoices</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {customers.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-gray-400">
                      <User className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No customers found</p>
                    </td></tr>
                  ) : customers.map(c => (
                    <tr key={getId(c)} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="table-cell">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{c.customer_name}</div>
                        {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                      </td>
                      <td className="table-cell">{c.phone || '—'}</td>
                      <td className="table-cell">{formatCurrency(c.total_purchased)}</td>
                      <td className="table-cell text-green-600 dark:text-green-400">{formatCurrency(c.total_paid)}</td>
                      <td className="table-cell">
                        <span className={`font-semibold ${parseFloat(c.total_due) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
                          {formatCurrency(c.total_due)}
                        </span>
                      </td>
                      <td className="table-cell">{c.total_invoices}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate(`/customers/${getId(c)}`)} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30" title="View Profile">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Edit">
                            <Edit className="w-4 h-4" />
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editCustomer ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">Customer Name *</label>
            <input className="form-input" {...register('customer_name', { required: 'Required' })} />
            {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name.message}</p>}
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input className="form-input" type="tel" {...register('phone')} />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" {...register('email')} />
          </div>
          <div>
            <label className="form-label">Address</label>
            <textarea className="form-input" rows={2} {...register('address')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Customer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
