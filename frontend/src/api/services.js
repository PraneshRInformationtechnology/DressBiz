import api from './axios';

// Auth
export const authService = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Dashboard
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getMonthlySales: () => api.get('/dashboard/monthly-sales'),
  getMonthlyProfit: () => api.get('/dashboard/monthly-profit'),
  getOutstandingTrend: () => api.get('/dashboard/outstanding-trend'),
};

// Products
export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  getCategories: () => api.get('/products/categories'),
};

// Purchases
export const purchaseService = {
  getAll: (params) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  delete: (id) => api.delete(`/purchases/${id}`),
};

// Customers
export const customerService = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getLedger: (id, params) => api.get(`/customers/${id}/ledger`, { params }),
  getSales: (id) => api.get(`/customers/${id}/sales`),
};

// Sales
export const saleService = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  getInvoice: (id) => api.get(`/sales/${id}/invoice`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
};

// Payments
export const paymentService = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  delete: (id) => api.delete(`/payments/${id}`),
};

// Reports
export const reportService = {
  getSales: (params) => api.get('/reports/sales', { params }),
  getInventory: (params) => api.get('/reports/inventory', { params }),
  getDues: (params) => api.get('/reports/dues', { params }),
  getCashFlow: (params) => api.get('/reports/cashflow', { params }),
  getTopProducts: (params) => api.get('/reports/top-products', { params }),
  exportExcel: (type, params) => api.get(`/reports/export/excel/${type}`, { params, responseType: 'blob' }),
  exportPdf: (type, params) => api.get(`/reports/export/pdf/${type}`, { params, responseType: 'blob' }),
};

// Users
export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
};
