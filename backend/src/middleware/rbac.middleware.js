const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Super Administrator has bypass access to all operations
    if (req.user.roles.includes('Super Administrator')) {
      return next();
    }

    const hasPermission = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Access denied: Insufficient permissions' });
    }

    next();
  };
};

module.exports = authorize;
