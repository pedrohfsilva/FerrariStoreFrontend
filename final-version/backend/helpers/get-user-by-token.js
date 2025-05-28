const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper para pegar o usuário pelo token
const getUserByToken = async (token) => {
  if (!token) {
    return null;
  }

  try {
    // Verificar se o token é válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecreto');

    // Buscar usuário pelo ID 
    const userId = decoded.id;
    const user = await User.findById(userId);

    return user;
  } catch (error) {
    return null;
  }
};

module.exports = getUserByToken;