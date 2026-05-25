const jwt = require('jsonwebtoken');
const Account = require('../models/Account');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smilecare_secret_key');

    req.user = await Account.findById(decoded.id);
    
    if (!req.user) {
        return res.status(401).json({ error: 'User does not exist' });
    }

    if (req.user.status !== 'active') {
        return res.status(403).json({ error: 'Account is locked or inactive' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
