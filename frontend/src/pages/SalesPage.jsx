import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Eye, Trash2, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { saleService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getPaymentStatusBadge, getPaymentStatusLabel } from '../utils/helpers';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import SearchInput from '../components/UI/SearchInput';
import Pagination from '../components/UI/Pagination';
import NewSaleForm from '../components/Sales/NewSaleForm';

const getId = (obj) => obj?._id || obj?.id;

export default function SalesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await saleService.getAll({ search, status, page: pagination.page, limit: pagination.limit });
      setSales(res.data.data);
      setPagination(p => ({ ...p, total: res.data.pagination.total }));
    } catch {}
    setLoading(false);
  }, [search, status, pagination.page]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const handleDelete = async () => {
    try {
      await saleService.delete(deleteDialog.id);
      toast.success('Sale deleted!');
      setDeleteDialog({ open: false, id: null });
      fetchSales();
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sales</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage invoices and transactions</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Sale
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPagination(p => ({ ...p, page: 1 })); }} placeholder="Search invoice or customer..." className="flex-1" />
        <select value={status} onChange={e => { setStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }} className="form-input sm:w-44">
          <option value="">All Status</option>
          <option value="PAID">Paid</option>
          <option value="PARTIALLY_PAID">Partial</option>
          <option value="UNPAID">Unpaid</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="table-header">Invoice</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Customer</th>
                    <th className="table-header">Total</th>
                    <th className="table-header">Paid</th>
                    <th className="table-header">Due</th>
                    <th className="table-header">Profit</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sales.length === 0 ? (
                    <tr><td colSpan={9} className="py-12 text-center text-gray-400">
                      <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No sales found</p>
                    </td></tr>
                  ) : sales.map(s => (
                    <tr key={getId(s)} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="table-cell font-medium text-primary-600 dark:text-primary-400">{s.invoice_number}</td>
                      <td className="table-cell">{formatDate(s.sale_date)}</td>
                      <td className="table-cell">{s.customer_name || <span className="text-gray-400">Walk-in</span>}</td>
                      <td className="table-cell font-medium">{formatCurrency(s.total_amount)}</td>
                      <td className="table-cell text-green-600 dark:text-green-400">{formatCurrency(s.amount_paid)}</td>
                      <td className="table-cell">
                        <span className={parseFloat(s.amount_due) > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-400'}>
                          {formatCurrency(s.amount_due)}
                        </span>
                      </td>
                      <td className="table-cell text-green-600 dark:text-green-400">{formatCurrency(s.profit_amount)}</td>
                      <td className="table-cell">
                        <span className={getPaymentStatusBadge(s.payment_status)}>{getPaymentStatusLabel(s.payment_status)}</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate(`/sales/${getId(s)}`)} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30">
                            <Eye className="w-4 h-4" />
                          </button>
                          {user?.role === 'admin' && (
                            <button onClick={() => setDeleteDialog({ open: true, id: getId(s) })} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Sale" size="xl">
        <NewSaleForm onSuccess={() => { setModalOpen(false); fetchSales(); }} onClose={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Sale"
        message="Are you sure? Stock will be restored and customer dues updated."
      />
    </div>
  );
}
