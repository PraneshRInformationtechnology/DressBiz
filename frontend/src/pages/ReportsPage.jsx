import React, { useState, useEffect } from 'react';
import { BarChart2, FileSpreadsheet, FileText, Download } from 'lucide-react';
import { reportService } from '../api/services';
import { formatCurrency, formatDate, getPaymentStatusBadge, getPaymentStatusLabel, downloadBlob } from '../utils/helpers';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { toast } from 'react-toastify';

const TABS = [
  { id: 'sales', label: 'Sales Report' },
  { id: 'inventory', label: 'Inventory Report' },
  { id: 'dues', label: 'Due Report' },
  { id: 'cashflow', label: 'Cash Flow' },
];

export default function ReportsPage() {
  const [tab, setTab] = useState('sales');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('monthly');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'sales') res = await reportService.getSales({ period, from_date: fromDate, to_date: toDate });
      else if (tab === 'inventory') res = await reportService.getInventory();
      else if (tab === 'dues') res = await reportService.getDues();
      else if (tab === 'cashflow') res = await reportService.getCashFlow({ from_date: fromDate, to_date: toDate });
      setData(res.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, [tab, period]);

  const handleExportExcel = async () => {
    try {
      const type = tab === 'dues' ? 'dues' : tab === 'inventory' ? 'inventory' : 'sales';
      const res = await reportService.exportExcel(type);
      downloadBlob(res.data, `${type}-report.xlsx`);
      toast.success('Excel exported!');
    } catch {}
  };

  const handleExportPdf = async () => {
    try {
      const type = tab === 'dues' ? 'dues' : tab === 'inventory' ? 'inventory' : 'sales';
      const res = await reportService.exportPdf(type);
      downloadBlob(res.data, `${type}-report.pdf`);
      toast.success('PDF exported!');
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Business performance analytics</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2 text-sm">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={handleExportPdf} className="btn-secondary flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {(tab === 'sales' || tab === 'cashflow') && (
        <div className="flex flex-wrap gap-3 items-end card p-4">
          {tab === 'sales' && (
            <div>
              <label className="form-label">Period</label>
              <select value={period} onChange={e => setPeriod(e.target.value)} className="form-input">
                <option value="daily">Today</option>
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          )}
          {(period === 'custom' || tab === 'cashflow') && (
            <>
              <div>
                <label className="form-label">From Date</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">To Date</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="form-input" />
              </div>
            </>
          )}
          <button onClick={fetchReport} className="btn-primary">Apply Filter</button>
        </div>
      )}

      {/* Report Content */}
      <div className="card overflow-hidden">
        {loading ? <LoadingSpinner /> : !data ? null : (
          <>
            {tab === 'sales' && <SalesReport data={data} />}
            {tab === 'inventory' && <InventoryReport data={data} />}
            {tab === 'dues' && <DueReport data={data} />}
            {tab === 'cashflow' && <CashFlowReport data={data} />}
          </>
        )}
      </div>
    </div>
  );
}

function SalesReport({ data }) {
  const { sales = [], summary = {} } = data;
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="text-center"><p className="text-xs text-gray-500">Total Revenue</p><p className="text-xl font-bold text-primary-600">{formatCurrency(summary.total_revenue)}</p></div>
        <div className="text-center"><p className="text-xs text-gray-500">Total Profit</p><p className="text-xl font-bold text-green-600">{formatCurrency(summary.total_profit)}</p></div>
        <div className="text-center"><p className="text-xs text-gray-500">Total Due</p><p className="text-xl font-bold text-red-600">{formatCurrency(summary.total_due)}</p></div>
        <div className="text-center"><p className="text-xs text-gray-500">Invoices</p><p className="text-xl font-bold">{summary.total_invoices}</p></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="table-header">Invoice</th><th className="table-header">Date</th><th className="table-header">Customer</th>
              <th className="table-header">Total</th><th className="table-header">Paid</th><th className="table-header">Due</th>
              <th className="table-header">Profit</th><th className="table-header">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sales.map(s => (
              <tr key={s.invoice_number}>
                <td className="table-cell font-medium text-primary-600">{s.invoice_number}</td>
                <td className="table-cell">{formatDate(s.sale_date)}</td>
                <td className="table-cell">{s.customer_name || 'Walk-in'}</td>
                <td className="table-cell">{formatCurrency(s.total_amount)}</td>
                <td className="table-cell text-green-600">{formatCurrency(s.amount_paid)}</td>
                <td className="table-cell text-red-600">{formatCurrency(s.amount_due)}</td>
                <td className="table-cell text-green-600">{formatCurrency(s.profit_amount)}</td>
                <td className="table-cell"><span className={getPaymentStatusBadge(s.payment_status)}>{getPaymentStatusLabel(s.payment_status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InventoryReport({ data }) {
  const { products = [], summary = {} } = data;
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="text-center"><p className="text-xs text-gray-500">Total Products</p><p className="text-xl font-bold">{summary.total_products}</p></div>
        <div className="text-center"><p className="text-xs text-gray-500">Total Units</p><p className="text-xl font-bold">{summary.total_units}</p></div>
        <div className="text-center"><p className="text-xs text-gray-500">Inventory Value</p><p className="text-xl font-bold text-primary-600">{formatCurrency(summary.total_value)}</p></div>
        <div className="text-center"><p className="text-xs text-gray-500">Low Stock</p><p className="text-xl font-bold text-red-600">{summary.low_stock_count}</p></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="table-header">Product</th><th className="table-header">Category</th>
              <th className="table-header">Size</th><th className="table-header">Stock</th>
              <th className="table-header">Buy Price</th><th className="table-header">Sell Price</th>
              <th className="table-header">Value</th><th className="table-header">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {products.map(p => (
              <tr key={p._id || p.id}>
                <td className="table-cell font-medium">{p.product_name}</td>
                <td className="table-cell">{p.category}</td>
                <td className="table-cell">{p.size || '—'}</td>
                <td className="table-cell"><span className={p.is_low_stock ? 'text-red-600 font-semibold' : ''}>{p.stock_quantity}</span></td>
                <td className="table-cell">{formatCurrency(p.purchase_price)}</td>
                <td className="table-cell">{formatCurrency(p.selling_price)}</td>
                <td className="table-cell font-medium">{formatCurrency(p.stock_value)}</td>
                <td className="table-cell"><span className={p.is_low_stock ? 'badge-red' : 'badge-green'}>{p.is_low_stock ? 'Low Stock' : 'OK'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DueReport({ data }) {
  const { customers = [], summary = {} } = data;
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="text-center"><p className="text-xs text-gray-500">Customers with Dues</p><p className="text-xl font-bold">{summary.customers_with_dues}</p></div>
        <div className="text-center"><p className="text-xs text-gray-500">Total Outstanding</p><p className="text-xl font-bold text-red-600">{formatCurrency(summary.total_outstanding)}</p></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="table-header">Customer</th><th className="table-header">Phone</th>
              <th className="table-header">Total Purchased</th><th className="table-header">Total Paid</th>
              <th className="table-header">Outstanding Due</th><th className="table-header">Last Sale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {customers.map(c => (
              <tr key={c._id || c.id}>
                <td className="table-cell font-medium">{c.customer_name}</td>
                <td className="table-cell">{c.phone || '—'}</td>
                <td className="table-cell">{formatCurrency(c.total_purchased)}</td>
                <td className="table-cell text-green-600">{formatCurrency(c.total_paid)}</td>
                <td className="table-cell text-red-600 font-bold">{formatCurrency(c.total_due)}</td>
                <td className="table-cell">{formatDate(c.last_sale_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CashFlowReport({ data }) {
  const { byMethod = [], pendingCollection = 0 } = data;
  const total = byMethod.reduce((sum, m) => sum + parseFloat(m.total), 0);
  const methodColors = { CASH: 'text-green-600', UPI: 'text-blue-600', BANK_TRANSFER: 'text-purple-600' };
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {byMethod.map(m => (
          <div key={m.payment_method} className="card p-4 text-center">
            <p className="text-xs text-gray-500">{m.payment_method.replace('_', ' ')}</p>
            <p className={`text-xl font-bold ${methodColors[m.payment_method] || ''}`}>{formatCurrency(m.total)}</p>
            <p className="text-xs text-gray-400">{m.count} payments</p>
          </div>
        ))}
        <div className="card p-4 text-center bg-orange-50 dark:bg-orange-900/20">
          <p className="text-xs text-gray-500">Pending Collection</p>
          <p className="text-xl font-bold text-orange-600">{formatCurrency(pendingCollection)}</p>
        </div>
      </div>
      <div className="card p-4">
        <div className="flex justify-between text-sm font-semibold border-t border-gray-200 dark:border-gray-800 pt-3">
          <span>Total Collected</span>
          <span className="text-green-600">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
