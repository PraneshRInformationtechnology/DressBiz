const { pool } = require('../config/database');

const auditLog = (action, tableName) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    if (body && body.success && req.user) {
      try {
        await pool.execute(
          'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
          [
            req.user.id,
            action,
            tableName,
            body.data?.id || null,
            JSON.stringify(body.data || {}),
            req.ip
          ]
        );
      } catch (e) {
        console.error('Audit log error:', e.message);
      }
    }
    return originalJson(body);
  };
  next();
};

module.exports = { auditLog };
