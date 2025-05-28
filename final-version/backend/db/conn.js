require('dotenv').config(); // load .env variables
const mongoose = require('mongoose');
mongoose.set("strictQuery", true);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ferrari_db');
  console.log("Conectado ao MongoDB");
}

main().catch((err) => console.log("Erro de conexão com o MongoDB:", err));

module.exports = mongoose;