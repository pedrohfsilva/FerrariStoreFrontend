const jwt = require('jsonwebtoken');
const getToken = require('./get-token');
const User = require('../models/User');

// Middleware para verificar se o usuário está autenticado
const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Acesso negado!' });
  }
  try {
    const token = getToken(req);
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'supersecreto');
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido!' });
  }
};

// Middleware para validar token e carregar usuário completo do banco
const validateToken = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Acesso negado!' });
  }
  try {
    const token = getToken(req);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecreto');
    
    // Verifica se o usuário existe na base de dados
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado!' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido!' });
  }
};

// Middleware para verificar se o usuário é admin
const checkAdmin = (req, res, next) => {
  const user = req.user;
  
  if (!user || !user.admin) {
    return res.status(403).json({ message: 'Acesso restrito a administradores!' });
  }
  
  next();
};

// Exportar como padrao para compatibilidade com codigo legado
module.exports = verifyToken;

// Exportaçoes nomeadas para novo codigo
module.exports.validateToken = validateToken;
module.exports.checkAdmin = checkAdmin;