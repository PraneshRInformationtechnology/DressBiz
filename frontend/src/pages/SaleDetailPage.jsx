import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Printer } from 'lucide-react';
import { saleService, paymentService } from '../api/services';
import { formatCurrency, formatDate, getPaymentStatusBadge, getPaymentStatusLabel } from '../utils/helpers';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

const getId = (obj) => obj?._id || obj?.id;

export default function SaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchSale = async () => {
    try {
      const res = await saleService.getById(id);
      setSale(res.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchSale(); }, [id]);

  const handlePayment = async (data) => {
    setSaving(true);
    try {
      // customer_id may be a populated object or a plain string id
      const customerId = typeof sale.customer_id === 'object'
        ? getId(sale.customer_id)
        : sale.customer_id;

      await paymentService.create({
        customer_id:     customerId,
        sale_id:         id,          // URL param — already a MongoDB ObjectId string
        amount_received: parseFloat(data.amount_received),
        payment_method:  data.payment_method,
        payment_date:    data.payment_date,
        notes:           data.notes,
      });
      toast.success('Payment recorded!');
      setPaymentModal(false);
      reset();
      fetchSale();
    } catch {}
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;
  if (!sale)   return <div className="text-center py-12 text-gray-400">Sale not found</div>;

  const remainingDue = parseFloat(sale.total_amount) - parseFloat(sale.amount_paid);

  // customer info — handle both populated object and plain string
  const customerName    = sale.customer_id?.customer_name || sale.customer_name;
  const customerPhone   = sale.customer_id?.phone;
  const customerAddress = sale.customer_id?.address;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sale.invoice_number}</h2>
            <p className="text-sm text-gray-500">{formatDate(sale.sale_date)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
          {sale.customer_id && remainingDue > 0 && (
            <button onClick={() => setPaymentModal(true)} className="btn-primary flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Collect Payment
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div><p className="text-xs text-gray-500">Total Amount</p><p className="text-xl font-bold">{formatCurrency(sale.total_amount)}</p></div>
            <div><p className="text-xs text-gray-500">Amount Paid</p><p className="text-xl font-bold text-green-600">{formatCurrency(sale.amount_paid)}</p></div>
            <div><p className="text-xs text-gray-500">Amount Due</p>
              <p className={`text-xl font-bold ${remainingDue > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {formatCurrency(remainingDue)}
              </p>
            </div>
            <div><p className="text-xs text-gray-500">Profit</p><p className="text-xl font-bold text-green-600">{formatCurrency(sale.profit_amount)}</p></div>
          </div>
          <span className={`${getPaymentStatusBadge(sale.payment_status)} text-sm px-3 py-1`}>
            {getPaymentStatusLabel(sale.payment_status)}
          </span>
        </div>
      </div>

      {/* Customer */}
      {customerName && (
        <div className="card p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Customer Details</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p><span className="font-medium">Name:</span> {customerName}</p>
            {customerPhone   && <p><span className="font-medium">Phone:</span> {customerPhone}</p>}
            {customerAddress && <p><span className="font-medium">Address:</span> {customerAddress}</p>}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Sale Items</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="table-header">Product</th>
              <th className="table-header">Qty</th>
              <th className="table-header">Price</th>
              <th className="table-header">Total</th>
              <th className="table-header">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sale.items?.map((item, i) => (
              <tr key={getId(item) || i}>
                <td className="table-cell">
                  <div className="font-medium">{item.product_name}</div>
                  {item.category && <div className="text-xs text-gray-400">{item.category}</div>}
                </td>
                <td className="table-cell">{item.quantity}</td>
                <td className="table-cell">{formatCurrency(item.selling_price)}</td>
                <td className="table-cell font-medium">{formatCurrency(item.quantity * item.selling_price)}</td>
                <td className="table-cell text-green-600">{formatCurrency(item.item_profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment History */}
      {sale.payments?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Payment History</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Method</th>
                <th className="table-header">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {sale.payments.map((p, i) => (
                <tr key={getId(p) || i}>
                  <td className="table-cell">{formatDate(p.payment_date)}</td>
                  <td className="table-cell text-green-600 font-medium">{formatCurrency(p.amount_received)}</td>
                  <td className="table-cell"><span className="badge-blue">{p.payment_method}</span></td>
                  <td className="table-cell text-gray-400">{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Collect Payment Modal */}
      <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="Record Payment" size="sm">
        <form onSubmit={handleSubmit(handlePayment)} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Outstanding: <strong>{formatCurrency(remainingDue)}</strong>
            </p>
          </div>
          <div>
            <label className="form-label">Amount (₹) *</label>
            <input type="number" step="0.01" min={0.01} max={remainingDue} className="form-input"
              {...register('amount_received', { required: 'Required', min: 0.01, max: remainingDue })} />
            {errors.amount_received && <p className="text-red-500 text-xs mt-1">{errors.amount_received.message}</p>}
          </div>
          <div>
            <label className="form-label">Payment Method *</label>
            <select className="form-input" {...register('payment_method', { required: 'Required' })}>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="form-label">Date</label>
            <input type="date" className="form-input" defaultValue={new Date().toISOString().slice(0, 10)} {...register('payment_date')} />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <input className="form-input" {...register('notes')} placeholder="Optional..." />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setPaymentModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Record Payment'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
