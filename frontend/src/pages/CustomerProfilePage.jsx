import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Receipt, TrendingUp, CreditCard } from 'lucide-react';
import { customerService } from '../api/services';
import { formatCurrency, formatDate, getPaymentStatusBadge, getPaymentStatusLabel } from '../utils/helpers';
import LoadingSpinner from '../components/UI/LoadingSpinner';

export default function CustomerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('sales');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, salesRes, ledgerRes] = await Promise.all([
          customerService.getById(id),
          customerService.getSales(id),
          customerService.getLedger(id),
        ]);
        setCustomer(custRes.data.data);
        setSales(salesRes.data.data);
        setLedger(ledgerRes.data.data);
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!customer) return <div className="text-center py-12 text-gray-400">Customer not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/customers')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customer.customer_name}</h2>
          <p className="text-sm text-gray-500">Customer Profile</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Total Purchased</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(customer.total_purchased)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Total Paid</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(customer.total_paid)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Outstanding Due</p>
          <p className={`text-xl font-bold ${parseFloat(customer.total_due) > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatCurrency(customer.total_due)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 mb-1">Total Invoices</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{customer.total_invoices}</p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          {customer.phone && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Phone className="w-4 h-4" />{customer.phone}</div>}
          {customer.email && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Mail className="w-4 h-4" />{customer.email}</div>}
          {customer.address && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><MapPin className="w-4 h-4" />{customer.address}</div>}
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          {[
            { id: 'sales', label: 'Sales History', icon: Receipt },
            { id: 'ledger', label: 'Ledger', icon: CreditCard },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="table-header">Invoice</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Paid</th>
                  <th className="table-header">Due</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sales.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-400">No sales found</td></tr>
                ) : sales.map(s => (
                  <tr key={s._id || s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => navigate(`/sales/${s._id || s.id}`)}>
                    <td className="table-cell font-medium text-primary-600">{s.invoice_number}</td>
                    <td className="table-cell">{formatDate(s.sale_date)}</td>
                    <td className="table-cell">{formatCurrency(s.total_amount)}</td>
                    <td className="table-cell text-green-600">{formatCurrency(s.amount_paid)}</td>
                    <td className="table-cell text-red-600">{formatCurrency(s.amount_due)}</td>
                    <td className="table-cell"><span className={getPaymentStatusBadge(s.payment_status)}>{getPaymentStatusLabel(s.payment_status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'ledger' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Reference</th>
                  <th className="table-header">Debit</th>
                  <th className="table-header">Credit</th>
                  <th className="table-header">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {ledger.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-400">No ledger entries</td></tr>
                ) : ledger.map(e => (
                  <tr key={e._id || e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="table-cell">{formatDate(e.entry_date)}</td>
                    <td className="table-cell">
                      <span className={e.transaction_type === 'SALE' ? 'badge-red' : 'badge-green'}>
                        {e.transaction_type}
                      </span>
                    </td>
                    <td className="table-cell text-primary-600">{e.reference_number}</td>
                    <td className="table-cell text-red-600">{parseFloat(e.debit) > 0 ? formatCurrency(e.debit) : '—'}</td>
                    <td className="table-cell text-green-600">{parseFloat(e.credit) > 0 ? formatCurrency(e.credit) : '—'}</td>
                    <td className="table-cell font-semibold">{formatCurrency(e.running_balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
