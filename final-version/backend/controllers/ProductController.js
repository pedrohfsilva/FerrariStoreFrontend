const { Product } = require('../models/Product');
const mongoose = require('mongoose');
const getToken = require('../helpers/get-token');
const getUserByToken = require('../helpers/get-user-by-token');
const fs = require('fs');
const path = require('path');

module.exports = class ProductController {
  // Criar um novo produto
  static async create(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      if (!user || !user.admin) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      const { 
        name, 
        price, 
        description, 
        type, 
        featured = false,
        stock = 0,
      } = req.body;

      // Validações
      if (!name) {
        return res.status(422).json({ message: 'O nome é obrigatório' });
      }
      if (!price) {
        return res.status(422).json({ message: 'O preço é obrigatório' });
      }
      if (!description) {
        return res.status(422).json({ message: 'A descrição é obrigatória' });
      }
      if (!type) {
        return res.status(422).json({ message: 'O tipo é obrigatório' });
      }
      
      if (!['car', 'helmet', 'formula1'].includes(type)) {
        return res.status(422).json({ message: 'Tipo de produto inválido' });
      }

      // Verificar se o nome já existe
      const productExists = await Product.findOne({ name });
      if (productExists) {
        return res.status(422).json({ message: 'Já existe um produto com este nome' });
      }

      // Obter imagens do produto
      let images = [];
      let soundFile = null;
      
      if (req.files) {
        // req.files pode ser um objeto ou array dependendo de como o multer está configurado
        if (Array.isArray(req.files)) {
          // Se for array, usar forEach como antes
          req.files.forEach(file => {
            if (file.fieldname === 'images') {
              images.push(file.filename);
            } else if (file.fieldname === 'soundFile') {
              soundFile = file.filename;
            }
          });
        } else if (typeof req.files === 'object') {
          // Se for objeto, acessar propriedades específicas
          if (req.files.images) {
            req.files.images.forEach(file => {
              images.push(file.filename);
            });
          }
          if (req.files.soundFile && req.files.soundFile[0]) {
            soundFile = req.files.soundFile[0].filename;
          }
        }
      }

      if (images.length === 0) {
        return res.status(422).json({ message: 'As imagens são obrigatórias' });
      }

      // Criar o produto
      const productData = {
        name,
        price,
        description,
        type,
        images,
        featured,
        stock,
        sold: 0,
      };

      // Adicionar soundFile apenas se fornecido
      if (soundFile) {
        productData.soundFile = soundFile;
      }

      const product = new Product(productData);

      await product.save();
      res.status(201).json({ 
        message: 'Produto criado com sucesso', 
        product 
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Obter todos os produtos
  static async getAll(req, res) {
    try {
      const products = await Product.find().sort('-createdAt');
      res.status(200).json({ products });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Obter produtos em destaque
  static async getFeatured(req, res) {
    try {
      const products = await Product.find({ featured: true }).sort('-createdAt');
      res.status(200).json({ products });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Obter produtos por tipo
  static async getByType(req, res) {
    try {
      const { type } = req.params;
      
      if (!['car', 'helmet', 'formula1'].includes(type)) {
        return res.status(422).json({ message: 'Tipo de produto inválido' });
      }

      const products = await Product.find({ type }).sort('-createdAt');
      res.status(200).json({ products });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Obter produto por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(422).json({ message: 'ID inválido' });
      }

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      res.status(200).json({ product });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Buscar produtos
  static async search(req, res) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(422).json({ message: 'Termo de busca não informado' });
      }

      const products = await Product.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      }).sort('-createdAt');

      res.status(200).json({ products });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Atualizar produto
  static async update(req, res) {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(422).json({ message: 'ID inválido' });
      }

      const token = getToken(req);
      const user = await getUserByToken(token);

      if (!user || !user.admin) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      const { 
        name, 
        price, 
        description, 
        type, 
        featured,
        stock
      } = req.body;

      // Checa se o tipo esta mudando para Capacetes e se o produto tem arquivo de som
      const isChangingToHelmet = type === 'helmet' && product.type !== 'helmet' && product.soundFile;

      // Atualizar campos se fornecidos
      if (name && name !== product.name) {
        const nameExists = await Product.findOne({ name, _id: { $ne: id } });
        if (nameExists) {
          return res.status(422).json({ message: 'Já existe um produto com este nome' });
        }
        product.name = name;
      }

      if (price !== undefined) product.price = price;
      if (description) product.description = description;
      if (type) {
        if (!['car', 'helmet', 'formula1'].includes(type)) {
          return res.status(422).json({ message: 'Tipo de produto inválido' });
        }
        product.type = type;

        // Se esta mudando para Capacetes, automaticamente remove o arquivo de som
        if (type === 'helmet' && product.soundFile) {
          try {
            const oldSoundPath = path.join(__dirname, '../../public/sounds', product.soundFile);
            if (fs.existsSync(oldSoundPath)) {
              fs.unlinkSync(oldSoundPath);
            }
          } catch (error) {
            console.error('Error removing sound file when changing to helmet:', error);
          }
          product.soundFile = undefined;
        }
      }
      if (featured !== undefined) product.featured = featured;
      if (stock !== undefined) product.stock = stock;

      // Processar novos arquivos se enviados
      if (req.files) {
        // req.files pode ser um objeto ou array dependendo de como o multer está configurado
        if (Array.isArray(req.files)) {
          // Se for array, usar forEach como antes
          req.files.forEach(file => {
            if (file.fieldname === 'images') {
              product.images.push(file.filename);
            } else if (file.fieldname === 'soundFile' && product.type !== 'helmet') {
              // So permite audio para produtos que nao sao capacetes
              // (capacetes nao podem ter som de motor)
              // Remover arquivo de áudio anterior se existir
              if (product.soundFile) {
                try {
                  const oldSoundPath = path.join(__dirname, '../../public/sounds', product.soundFile);
                  if (fs.existsSync(oldSoundPath)) {
                    fs.unlinkSync(oldSoundPath);
                  }
                } catch (error) {
                  console.error('Error removing old sound file:', error);
                }
              }
              product.soundFile = file.filename;
            }
          });
        } else if (typeof req.files === 'object') {
          // Se for objeto, acessar propriedades específicas
          if (req.files.images) {
            req.files.images.forEach(file => {
              product.images.push(file.filename);
            });
          }
          if (req.files.soundFile && req.files.soundFile[0] && product.type !== 'helmet') {
            // So permite audio para produtos que nao sao capacetes
            // Remover arquivo de áudio anterior se existir
            if (product.soundFile) {
              try {
                const oldSoundPath = path.join(__dirname, '../../public/sounds', product.soundFile);
                if (fs.existsSync(oldSoundPath)) {
                  fs.unlinkSync(oldSoundPath);
                }
              } catch (error) {
                console.error('Error removing old sound file:', error);
              }
            }
            product.soundFile = req.files.soundFile[0].filename;
          }
        }
      }

      await product.save();

      // Adiciona uma mensage sobre a remoção do arquivo de audio se ele foi automaticamente removido
      let message = 'Produto atualizado com sucesso';
      if (isChangingToHelmet) {
        message += '. Arquivo de áudio removido automaticamente (capacetes não possuem som)';
      }

      res.status(200).json({ message, product });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Remover imagem do produto
  static async removeImage(req, res) {
    try {
      const { id } = req.params;
      const { filename } = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(422).json({ message: 'ID inválido' });
      }

      if (!filename) {
        return res.status(422).json({ message: 'Nome do arquivo não informado' });
      }

      const token = getToken(req);
      const user = await getUserByToken(token);

      if (!user || !user.admin) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      // Verificar se a imagem existe
      if (!product.images.includes(filename)) {
        return res.status(404).json({ message: 'Imagem não encontrada' });
      }

      // Remover imagem do array
      product.images = product.images.filter(image => image !== filename);

      // Verificar se ainda há pelo menos uma imagem
      if (product.images.length === 0) {
        return res.status(422).json({ message: 'O produto deve ter pelo menos uma imagem' });
      }

      // Salvar produto
      await product.save();

      // Tenta remover o arquivo do filesystem
      try {
        const imagePath = path.join(__dirname, '../../public/images/products', filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error('Error removing image file:', error);
        // Continua a executar mesmo que a remoçao do arquivo falhe
      }

      res.status(200).json({ message: 'Imagem removida com sucesso', product });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Remover arquivo de áudio do produto
  static async removeSoundFile(req, res) {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(422).json({ message: 'ID inválido' });
      }

      const token = getToken(req);
      const user = await getUserByToken(token);

      if (!user || !user.admin) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      if (!product.soundFile) {
        return res.status(404).json({ message: 'Produto não possui arquivo de áudio' });
      }

      const soundFileName = product.soundFile;

      // Remover soundFile do produto
      product.soundFile = undefined;
      await product.save();

      // Tentar remover o arquivo do sistema de arquivos
      try {
        const soundPath = path.join(__dirname, '../../public/sounds', soundFileName);
        if (fs.existsSync(soundPath)) {
          fs.unlinkSync(soundPath);
        }
      } catch (error) {
        console.error('Error removing sound file:', error);
      }

      res.status(200).json({ message: 'Arquivo de áudio removido com sucesso', product });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Excluir produto
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(422).json({ message: 'ID inválido' });
      }

      const token = getToken(req);
      const user = await getUserByToken(token);

      if (!user || !user.admin) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      // Remove esse produto para todos os carrinhos dos usuários antes de deletar
      const User = require('../models/User');
      await User.updateMany(
        { 'cart.product': id },
        { $pull: { cart: { product: id } } }
      );

      // Deleta o produto
      await Product.findByIdAndDelete(id);

      // Tenta remover as imagens do produto do sistema
      try {
        for (const filename of product.images) {
          const imagePath = path.join(__dirname, '../../public/images/products', filename);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      } catch (error) {
        console.error('Error removing image files:', error);
        // Continua a executar mesmo que a remoçao das imagens falhe
      }

      // Tenta remover o arquivo de audio do sistema
      if (product.soundFile) {
        try {
          const soundPath = path.join(__dirname, '../../public/sounds', product.soundFile);
          if (fs.existsSync(soundPath)) {
            fs.unlinkSync(soundPath);
          }
        } catch (error) {
          console.error('Error removing sound file:', error);
        }
      }

      res.status(200).json({ message: 'Produto removido com sucesso' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};