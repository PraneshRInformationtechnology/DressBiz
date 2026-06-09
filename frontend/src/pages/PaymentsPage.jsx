import React, { useEffect, useState, useCallback } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { paymentService, customerService, saleService } from '../api/services';
import { formatCurrency, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';
import SearchInput from '../components/UI/SearchInput';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerSales, setCustomerSales] = useState([]);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: { payment_date: new Date().toISOString().slice(0, 10) }
  });

  const selectedCustomer = watch('customer_id');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentService.getAll({ limit: 100 });
      setPayments(res.data.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => {
    customerService.getAll({ limit: 200 }).then(r => setCustomers(r.data.data));
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      saleService.getAll({ customer_id: selectedCustomer, status: 'PARTIALLY_PAID', limit: 100 })
        .then(r => setCustomerSales(r.data.data))
        .catch(() => setCustomerSales([]));
    } else {
      setCustomerSales([]);
    }
  }, [selectedCustomer]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await paymentService.create({
        ...data,
        customer_id:     data.customer_id,
        sale_id:         data.sale_id,
        amount_received: parseFloat(data.amount_received),
      });
      toast.success('Payment recorded!');
      setModalOpen(false);
      reset();
      fetchPayments();
    } catch {}
    setSaving(false);
  };

  const methodColors = { CASH: 'badge-green', UPI: 'badge-blue', BANK_TRANSFER: 'badge-yellow' };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payments</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track customer payment collections</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Invoice</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Method</th>
                  <th className="table-header">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {payments.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-400"><CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No payments found</p></td></tr>
                ) : payments.map(p => (
                  <tr key={p._id || p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="table-cell">{formatDate(p.payment_date)}</td>
                    <td className="table-cell font-medium">{p.customer_name}</td>
                    <td className="table-cell text-primary-600 dark:text-primary-400">{p.invoice_number}</td>
                    <td className="table-cell text-green-600 dark:text-green-400 font-semibold">{formatCurrency(p.amount_received)}</td>
                    <td className="table-cell"><span className={methodColors[p.payment_method] || 'badge-blue'}>{p.payment_method}</span></td>
                    <td className="table-cell text-gray-400 text-xs">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">Customer *</label>
            <select className="form-input" {...register('customer_id', { required: 'Required' })}>
              <option value="">Select customer...</option>
              {customers.filter(c => parseFloat(c.total_due) > 0).map(c => (
                <option key={c._id || c.id} value={c._id || c.id}>{c.customer_name} — Due: {formatCurrency(c.total_due)}</option>
              ))}
            </select>
            {errors.customer_id && <p className="text-red-500 text-xs mt-1">{errors.customer_id.message}</p>}
          </div>

          {customerSales.length > 0 && (
            <div>
              <label className="form-label">Invoice *</label>
              <select className="form-input" {...register('sale_id', { required: 'Required' })}>
                <option value="">Select invoice...</option>
                {customerSales.map(s => (
                  <option key={s._id || s.id} value={s._id || s.id}>{s.invoice_number} — Due: {formatCurrency(s.amount_due)}</option>
                ))}
              </select>
              {errors.sale_id && <p className="text-red-500 text-xs mt-1">{errors.sale_id.message}</p>}
            </div>
          )}

          <div>
            <label className="form-label">Amount (₹) *</label>
            <input type="number" step="0.01" min={0.01} className="form-input" {...register('amount_received', { required: 'Required', min: 0.01 })} />
            {errors.amount_received && <p className="text-red-500 text-xs mt-1">{errors.amount_received.message}</p>}
          </div>
          <div>
            <label className="form-label">Payment Method</label>
            <select className="form-input" {...register('payment_method')}>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="form-label">Payment Date</label>
            <input type="date" className="form-input" {...register('payment_date')} />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <input className="form-input" {...register('notes')} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Record Payment'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
