import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';
import { saleService, customerService, productService } from '../../api/services';
import { formatCurrency } from '../../utils/helpers';

export default function NewSaleForm({ onSuccess, onClose }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ product_id: '', quantity: 1, selling_price: 0 }]);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { sale_date: new Date().toISOString().slice(0, 10), amount_paid: 0 }
  });

  useEffect(() => {
    Promise.all([
      customerService.getAll({ limit: 200 }),
      productService.getAll({ limit: 500 }),
    ]).then(([custRes, prodRes]) => {
      setCustomers(custRes.data.data);
      setProducts(prodRes.data.data);
    });
  }, []);

  const amountPaid = watch('amount_paid') || 0;

  const totalAmount = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.selling_price) || 0);
  }, 0);
  const amountDue = Math.max(0, totalAmount - parseFloat(amountPaid));

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    // Auto-fill selling price when product is selected
    if (field === 'product_id') {
      const product = products.find(p => (p._id || p.id) === value);
      if (product) updated[index].selling_price = product.selling_price;
    }
    setItems(updated);
  };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, selling_price: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const onSubmit = async (data) => {
    if (!items.every(i => i.product_id && i.quantity > 0)) {
      toast.error('All items must have a product and quantity.');
      return;
    }
    setSaving(true);
    try {
      await saleService.create({
        ...data,
        // Send MongoDB _id strings as-is — NO parseInt
        items: items.map(i => ({
          product_id:    i.product_id,
          quantity:      parseInt(i.quantity),
          selling_price: parseFloat(i.selling_price)
        })),
        amount_paid: parseFloat(data.amount_paid) || 0,
        customer_id: data.customer_id || null,
      });
      toast.success('Sale created!');
      onSuccess();
    } catch {}
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Customer</label>
          <select className="form-input" {...register('customer_id')}>
            <option value="">Walk-in Customer</option>
            {customers.map(c => (
              <option key={c._id || c.id} value={c._id || c.id}>
                {c.customer_name} {c.phone ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Sale Date *</label>
          <input type="date" className="form-input" {...register('sale_date', { required: true })} />
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="form-label mb-0">Sale Items *</label>
          <button type="button" onClick={addItem} className="btn-secondary text-xs flex items-center gap-1 py-1">
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <select
                  className="form-input"
                  value={item.product_id}
                  onChange={e => updateItem(i, 'product_id', e.target.value)}
                >
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.product_name} {p.size ? `[${p.size}]` : ''} — Stock: {p.stock_quantity}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-20">
                <input
                  type="number"
                  min={1}
                  placeholder="Qty"
                  className="form-input"
                  value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)}
                />
              </div>
              <div className="w-28">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  className="form-input"
                  value={item.selling_price}
                  onChange={e => updateItem(i, 'selling_price', e.target.value)}
                />
              </div>
              <div className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300 py-2 text-right">
                {formatCurrency((item.quantity || 0) * (item.selling_price || 0))}
              </div>
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total Amount</span>
          <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <label className="form-label mb-0 text-sm">Amount Paid (₹)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            max={totalAmount}
            className="form-input w-40 text-right"
            {...register('amount_paid', { min: 0, max: totalAmount })}
          />
        </div>
        <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
          <span className="text-gray-500">Amount Due</span>
          <span className={`font-bold ${amountDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(amountDue)}
          </span>
        </div>
      </div>

      <div>
        <label className="form-label">Notes</label>
        <textarea className="form-input" rows={2} {...register('notes')} placeholder="Optional notes..." />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving || totalAmount === 0}>
          {saving ? 'Creating...' : 'Create Sale'}
        </button>
      </div>
    </form>
  );
}
