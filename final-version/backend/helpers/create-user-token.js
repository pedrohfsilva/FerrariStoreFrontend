const jwt = require('jsonwebtoken');

const createUserToken = async (user, req, res) => {
  // Criar token
  const token = jwt.sign(
    {
      id: user._id,
      name: user.name,
      admin: user.admin || false,
    }, 
    process.env.JWT_SECRET || 'supersecreto',
    {
      expiresIn: '7d', // Token expira em 7 dias
    }
  );

  // Retornar token e dados do usuário
  res.status(200).json({
    message: 'Autenticação realizada com sucesso',
    token: token,
    userId: user._id,
    admin: user.admin || false,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      admin: user.admin || false
    }
  });
};

module.exports = createUserToken;