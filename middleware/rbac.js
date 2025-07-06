// middleware/rbac.js
const rbac = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user || !user.role) {
        return res.status(401).json({ error: 'Unauthorized: No user or role' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient role' });
      }

      next();
    } catch (err) {
      console.error('RBAC middleware error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  };
};

module.exports = rbac;
