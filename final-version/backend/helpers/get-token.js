// Helper para extrair o token do cabeçalho da requisição
const getToken = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.split(' ')[1];
  
  return token;
};

module.exports = getToken;