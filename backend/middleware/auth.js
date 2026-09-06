const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'collegewise_super_secret_jwt_key_2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) {
    return next();
  }
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // Ignore invalid token in optional mode
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ success: false, message: `Access denied. Requires ${role} role.` });
    }
    next();
  };
}

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken,
  optionalAuth,
  requireRole
};
