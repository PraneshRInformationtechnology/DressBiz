import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { IndianRupee, TrendingUp, Users, Package, AlertTriangle, ShoppingBag, CreditCard } from 'lucide-react';
import StatCard from '../components/UI/StatCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { dashboardService, reportService } from '../api/services';
import { formatCurrency } from '../utils/helpers';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [monthlyProfit, setMonthlyProfit] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, salesRes, profitRes, topRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getMonthlySales(),
          dashboardService.getMonthlyProfit(),
          reportService.getTopProducts({ limit: 5 }),
        ]);
        setStats(statsRes.data.data);
        setMonthlySales(salesRes.data.data);
        setMonthlyProfit(profitRes.data.data);
        setTopProducts(topRes.data.data);
      } catch {}
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <LoadingSpinner />;

  const statCards = [
    { title: 'Total Revenue', value: formatCurrency(stats?.totalRevenue), icon: IndianRupee, color: 'blue' },
    { title: 'Total Profit', value: formatCurrency(stats?.totalProfit), icon: TrendingUp, color: 'green' },
    { title: 'Outstanding Dues', value: formatCurrency(stats?.totalOutstandingDues), icon: CreditCard, color: 'red' },
    { title: 'Inventory Value', value: formatCurrency(stats?.totalInventoryValue), icon: Package, color: 'purple' },
    { title: 'Total Customers', value: stats?.totalCustomers || 0, icon: Users, color: 'teal' },
    { title: "Today's Sales", value: formatCurrency(stats?.todaySales?.amount), subtitle: `${stats?.todaySales?.count || 0} invoices`, icon: ShoppingBag, color: 'orange' },
    { title: 'Monthly Sales', value: formatCurrency(stats?.monthlySales?.amount), subtitle: `${stats?.monthlySales?.count || 0} invoices`, icon: IndianRupee, color: 'blue' },
    { title: 'Low Stock Items', value: stats?.lowStockCount || 0, icon: AlertTriangle, color: 'orange' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
              {p.name}: {formatCurrency(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Business overview at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Trend */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Sales Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlySales}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" fill="url(#salesGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Profit Trend */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Profit Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyProfit}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="product_name" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="total_sold" name="Units Sold" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
