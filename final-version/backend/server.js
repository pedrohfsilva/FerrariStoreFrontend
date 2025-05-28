const express = require('express');
const cors = require('cors');
const path = require('path');

// Configuração do dotenv
require('dotenv').config();

const app = express();

// Middleware JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do CORS
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));

// Diretório de arquivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));

// Importação das rotas
const UserRoutes = require('./routes/UserRoutes');
const ProductRoutes = require('./routes/ProductRoutes');

// Definição das rotas
app.use('/api/users', UserRoutes);
app.use('/api/products', ProductRoutes);

// Rota para verificar se a API está funcionando
app.get('/', (req, res) => {
  res.json({ message: 'API Ferrari - Funcionando!' });
});

// Definição da porta do servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});