const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');
const { Product } = require('../models/Product');

// Helpers
const createUserToken = require('../helpers/create-user-token');
const getToken = require('../helpers/get-token');
const getUserByToken = require('../helpers/get-user-by-token');

module.exports = class UserController {
  // Registro de usuário
  static async register(req, res) {
    const { name, email, phone, cpf, password, admin = false } = req.body;

    // Validações
    if (!name) {
      return res.status(422).json({ message: 'O nome é obrigatório' });
    }
    if (!email) {
      return res.status(422).json({ message: 'O email é obrigatório' });
    }
    if (!phone) {
      return res.status(422).json({ message: 'O telefone é obrigatório' });
    }
    if (!cpf) {
      return res.status(422).json({ message: 'O CPF é obrigatório' });
    }
    if (!password) {
      return res.status(422).json({ message: 'A senha é obrigatória' });
    }

    // Verificar se o usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(422).json({ message: 'Email já cadastrado, utilize outro email' });
    }

    // Verificar se CPF já existe
    const cpfExists = await User.findOne({ cpf });
    if (cpfExists) {
      return res.status(422).json({ message: 'CPF já cadastrado' });
    }

    // Criar senha hash
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Criar usuário com um carrinho vazio explicitamente definido
    const user = new User({
      name,
      email,
      phone,
      cpf,
      password: passwordHash,
      admin,
      cart: [], // Inicializado explicitamente como array vazio para evitar problemas de schema
      orders: [] // Inicializado explicitamente como array vazio
    });

    try {
      const newUser = await user.save();
      await createUserToken(newUser, req, res);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: error.message });
    }
  }

  // Login de usuário
  static async login(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(422).json({ message: 'O email é obrigatório' });
    }
    if (!password) {
      return res.status(422).json({ message: 'A senha é obrigatória' });
    }

    // Verificar se o usuário existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se a senha está correta
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.status(422).json({ message: 'Senha inválida' });
    }

    await createUserToken(user, req, res);
  }

   // Verificar usuario atual
   static async checkUser(req, res) {
    let currentUser = null;

    try {
      if (req.headers.authorization) {
        const token = getToken(req);
        
        // Envolve a verificaçao do JWT em um try-catch para evitar erros nao tratados
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecreto');
          currentUser = await User.findById(decoded.id).select('-password');
        } catch (error) {
          console.error("Erro na verificação do JWT:", error.message);
          // Token invalido
        }
      }
      
      // Sempre envia uma resposta 200, com o usuário ou null
      res.status(200).json(currentUser);
    } catch (error) {
      console.error("Erro em checkUser:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  // Pegar usuário por ID
  static async getUserById(req, res) {
    const id = req.params.id;

    try {
      const user = await User.findById(id).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Editar usuario
  static async editUser(req, res) {
    let userId = null;

    // Verificar se o ID do usuario esta no parametro da URL
    if (req.params.id) {
      userId = req.params.id;
    } else {
      // Pega o ID do usuario pelo token
      const token = getToken(req);
      const userFromToken = await getUserByToken(token);
      if (userFromToken) {
        userId = userFromToken._id;
      }
    }

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não identificado' });
    }

    try {
      // Procura o usuario pelo ID
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Verifica se o usuario do token tem permissao para editar este usuario
      const token = getToken(req);
      const userFromToken = await getUserByToken(token);

      // So permite editar o usuario se eh o mesmo usuario ou se o usuario eh um admin
      if (userId !== userFromToken._id.toString() && !userFromToken.admin) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      const { name, email, phone, cpf, password, confirmPassword, admin } = req.body;

      // Validações e atualizaçoes
      if (name) {
        user.name = name;
      }

      if (email && email !== user.email) {
        const userExists = await User.findOne({ email });
        if (userExists && userExists._id.toString() !== userId) {
          return res.status(422).json({ message: 'Email já está em uso' });
        }
        user.email = email;
      }

      if (phone) {
        user.phone = phone;
      }

      if (cpf && cpf !== user.cpf) {
        const cpfExists = await User.findOne({ cpf });
        if (cpfExists && cpfExists._id.toString() !== userId) {
          return res.status(422).json({ message: 'CPF já está em uso' });
        }
        user.cpf = cpf;
      }

      // Atualizar campo admin apenas se o usuário que está fazendo a alteração for admin
      if (typeof admin === 'boolean' && userFromToken.admin) {
        user.admin = admin;
      }

      // Verificar se o usuário enviou imagem
      if (req.file) {
        user.image = req.file.filename;
      }

      // Atualizar senha se fornecida
      if (password) {
        if (!confirmPassword) {
          return res.status(422).json({ message: 'A confirmação de senha é obrigatória' });
        }
        if (password !== confirmPassword) {
          return res.status(422).json({ message: 'A senha e a confirmação precisam ser iguais' });
        }

        // Criar senha hash
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        user.password = passwordHash;
      }

      await user.save();
      res.status(200).json({ message: 'Usuário atualizado com sucesso' });
    } catch (error) {
      console.error('Error in editUser:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Alterar senha
  static async changePassword(req, res) {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(422).json({ message: 'A senha atual é obrigatória' });
    }

    if (!newPassword) {
      return res.status(422).json({ message: 'A nova senha é obrigatória' });
    }

    try {
      // Verificar se id e valido
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(422).json({ message: 'ID inválido' });
      }

      // Procurar usuario
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Verifica se a senha atual eh a correta
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(422).json({ message: 'Senha atual incorreta' });
      }

      // Aplicar hash na nova senha
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      // Atualiza a senha
      user.password = passwordHash;
      await user.save();

      res.status(200).json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      console.error('Error in changePassword:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Pegar o endereço
  static async getAddress(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      if (!user) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      res.status(200).json({ address: user.address });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Adicionar ou atualizar endereço
  static async updateAddress(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      if (!user) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      const { street, number, complement, neighborhood, city, state, zipCode } = req.body;

      // Validaçoes
      if (!street) {
        return res.status(422).json({ message: 'A rua é obrigatória' });
      }
      if (!number) {
        return res.status(422).json({ message: 'O número é obrigatório' });
      }
      if (!neighborhood) {
        return res.status(422).json({ message: 'O bairro é obrigatório' });
      }
      if (!city) {
        return res.status(422).json({ message: 'A cidade é obrigatória' });
      }
      if (!state) {
        return res.status(422).json({ message: 'O estado é obrigatório' });
      }
      if (!zipCode) {
        return res.status(422).json({ message: 'O CEP é obrigatório' });
      }

      // Criar ou atualizar endereço
      user.address = {
        street,
        number,
        complement: complement || '',
        neighborhood,
        city,
        state,
        zipCode
      };

      await user.save();

      res.status(200).json({ 
        message: 'Endereço atualizado com sucesso',
        address: user.address
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Pegar o metodo de pagamento
  static async getPaymentMethod(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      if (!user) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      res.status(200).json({ paymentMethod: user.paymentMethod });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Adicionar ou atualizar metodo de pagamento
  static async updatePaymentMethod(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      if (!user) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      const { type, cardNumber, cardHolderName, expirationDate, cvv } = req.body;

      // Validaçoes
      if (!type) {
        return res.status(422).json({ message: 'O tipo de cartão é obrigatório' });
      }

      if (!['credit', 'debit'].includes(type)) {
        return res.status(422).json({ message: 'Tipo de cartão inválido' });
      }

      if (!cardNumber) {
        return res.status(422).json({ message: 'O número do cartão é obrigatório' });
      }
      
      if (!cardHolderName) {
        return res.status(422).json({ message: 'O nome no cartão é obrigatório' });
      }
      
      if (!expirationDate) {
        return res.status(422).json({ message: 'A data de validade é obrigatória' });
      }
      
      if (!cvv) {
        return res.status(422).json({ message: 'O código de segurança é obrigatório' });
      }

      // Criar ou atualizar forma de pagamento
      user.paymentMethod = {
        type,
        cardNumber,
        cardHolderName,
        expirationDate,
        cvv
      };

      await user.save();

      // Retorna o metodo de pagamento sem o CVV para garantir segurança
      const securePaymentMethod = {
        ...user.paymentMethod.toObject(),
        cvv: undefined
      };

      res.status(200).json({
        message: 'Método de pagamento atualizado com sucesso',
        paymentMethod: securePaymentMethod
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Adicionar ao carrinho
  static async addToCart(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      if (!user) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      const { productId, quantity = 1, color, size } = req.body;

      // Valida o produto
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      // Cria um item no carrinho
      const cartItem = {
        product: product._id,
        quantity: quantity,
      };

      // Verifica se o mesmo produto com os mesmos atributos ja esta no carrinho
      const existingItemIndex = user.cart.findIndex(item => 
        item.product.toString() === productId
      );

      if (existingItemIndex !== -1) {
        // Atualiza a quantidade em vez de adicionar um novo item, caso o item ja estava no carrinho
        user.cart[existingItemIndex].quantity += quantity;
      } else {
        // Adiciona o novo item ao carrinho
        user.cart.push(cartItem);
      }

      await user.save();

      // Preencher os detalhes do produto no carrinho para enviar na resposta
      await user.populate('cart.product');

      res.status(200).json({
        message: 'Produto adicionado ao carrinho',
        cart: user.cart
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Atualizar item do carrinho
  static async updateCartItem(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);
      const { itemId } = req.params;
      const { quantity } = req.body;

      if (!user) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      // Procura o item no carrinho
      const itemIndex = user.cart.findIndex(item => item._id.toString() === itemId);

      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item não encontrado no carrinho' });
      }

      // Atualiza a quantidade
      if (quantity <= 0) {
        // Remove o item se a quantidade eh 0 ou menos
        user.cart.splice(itemIndex, 1);
      } else {
        user.cart[itemIndex].quantity = quantity;
      }

      await user.save();
      
      // Preencher os detalhes do produto no carrinho para enviar na resposta
      await user.populate('cart.product');

      res.status(200).json({
        message: 'Carrinho atualizado com sucesso',
        cart: user.cart
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Remover do carrinho
  static async removeFromCart(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);
      const { itemId } = req.params;

      if (!user) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      // Encontrar o item no carrinho
      const itemIndex = user.cart.findIndex(item => item._id.toString() === itemId);
      
      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item não encontrado no carrinho' });
      }

      // Remove item
      user.cart.splice(itemIndex, 1);
      await user.save();

      res.status(200).json({
        message: 'Item removido do carrinho',
        cart: user.cart
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Pegar carrinho
  static async getCart(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      if (!user) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      await user.populate('cart.product');
      
      // Filtrar itens onde o produto é nulo (produtos deletados) e limpar o carrinho
      const validCartItems = user.cart.filter(item => item.product !== null);
      
      // Se encontramos itens invalidos, atualizar o carrinho do usuario para remover eles
      if (validCartItems.length !== user.cart.length) {
        user.cart = validCartItems;
        await user.save();
      }

      res.status(200).json({ cart: user.cart });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Esvaziar carrinho
  static async clearCart(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      if (!user) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      user.cart = [];
      await user.save();

      res.status(200).json({
        message: 'Carrinho esvaziado com sucesso',
        cart: user.cart
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Criar um pedido
  static async createOrder(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      if (!user) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      // Validar se o usuario tem itens no carrinho
      if (!user.cart || user.cart.length === 0) {
        return res.status(422).json({ message: 'Carrinho vazio. Adicione produtos antes de finalizar o pedido.' });
      }

      // Validar endereço
      if (!user.address) {
        return res.status(422).json({ message: 'Você precisa cadastrar um endereço antes de finalizar o pedido.' });
      }

      // Validar metodo de pagamento
      if (!user.paymentMethod) {
        return res.status(422).json({ message: 'Você precisa cadastrar um método de pagamento antes de finalizar o pedido.' });
      }

      // Preencher os detalhes dos produtos para criação do pedido
      await user.populate('cart.product');

      // Criar array de itens do pedido seguindo a estrutura do OrderItemSchema 
      const orderItems = user.cart.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      }));

      // Calcular o preço total do pedido
      const totalPrice = user.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

      // Criar pedido seguindo a estrutura do OrderSchema
      const newOrder = {
        orderItem: orderItems,
        totalPrice: totalPrice,
        paymentMethod: {
          type: user.paymentMethod.type,
          cardNumber: user.paymentMethod.cardNumber,
          cardHolderName: user.paymentMethod.cardHolderName,
          expirationDate: user.paymentMethod.expirationDate,
          cvv: user.paymentMethod.cvv
        },
        shippingAddress: {
          street: user.address.street,
          number: user.address.number,
          complement: user.address.complement || '',
          neighborhood: user.address.neighborhood,
          city: user.address.city,
          state: user.address.state,
          zipCode: user.address.zipCode
        }
      };

      user.orders.push(newOrder);

      // Atualizar o estoque do produto
      for (const item of user.cart) {
        const product = await Product.findById(item.product._id);
        if (product) {
          // Atualizar a contagem do estoque
          product.stock = Math.max(0, product.stock - item.quantity);
          product.sold += item.quantity;
          await product.save();
        }
      }

      // Esvaziar carrinho
      user.cart = [];
      await user.save();

      res.status(201).json({ 
        message: 'Pedido criado com sucesso',
        order: user.orders[user.orders.length - 1]
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // Pega todos os pedidos do usuario
  static async getOrders(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      if (!user) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      // Carrega detalhes dos produtos para cada item em todos os pedidos
      const populatedOrders = [];
      
      for (const order of user.orders) {
        const populatedOrder = { ...order.toObject() };
        
        // Incluir todos os itens do pedido, marcando produtos excluídos como indisponíveis
        const allOrderItems = [];
        
        for (let i = 0; i < populatedOrder.orderItem.length; i++) {
          const product = await Product.findById(populatedOrder.orderItem[i].product);
          if (product) {
            allOrderItems.push({
              ...populatedOrder.orderItem[i],
              productDetails: {
                name: product.name,
                price: product.price,
                images: product.images
              }
            });
          } else {
            // Produto foi removido, mostrar como indisponivel
            allOrderItems.push({
              ...populatedOrder.orderItem[i],
              productDetails: {
                name: 'Produto não disponível',
                price: 0,
                images: [],
                unavailable: true
              }
            });
          }
        }
        
        // Incluir o pedido mesmo que alguns produtos estejam indisponiveis
        populatedOrder.orderItem = allOrderItems;
        populatedOrders.push(populatedOrder);
      }

      res.status(200).json({ orders: populatedOrders });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Pega os detalhes do pedido
  static async getOrderById(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);
      const { orderId } = req.params;

      if (!user) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      // Busca o pedido
      const order = user.orders.find(order => order._id.toString() === orderId);

      if (!order) {
        return res.status(404).json({ message: 'Pedido não encontrado' });
      }

      // Carregar detalhes dos produtos para cada item do pedido, incluindo produtos indisponiveis
      const populatedOrder = { ...order.toObject() };
      const allOrderItems = [];
      
      for (let i = 0; i < populatedOrder.orderItem.length; i++) {
        const product = await Product.findById(populatedOrder.orderItem[i].product);
        if (product) {
          allOrderItems.push({
            ...populatedOrder.orderItem[i],
            productDetails: {
              name: product.name,
              price: product.price,
              images: product.images
            }
          });
        } else {
          // Se o produto foi deletado, mostra como indisponivel
          allOrderItems.push({
            ...populatedOrder.orderItem[i],
            productDetails: {
              name: 'Produto não disponível',
              price: 0,
              images: [],
              unavailable: true
            }
          });
        }
      }
      
      populatedOrder.orderItem = allOrderItems;

      res.status(200).json({ order: populatedOrder });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Listar todos usuários (admin)
  static async getAllUsers(req, res) {
    try {
      const token = getToken(req);
      const currentUser = await getUserByToken(token);

      if (!currentUser.admin) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      const users = await User.find().select('-password');
      res.status(200).json({ users });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Excluir usuário (admin)
  static async deleteUser(req, res) {
    try {
      const id = req.params.id;
      const token = getToken(req);
      const currentUser = await getUserByToken(token);

      if (!currentUser.admin) {
        return res.status(401).json({ message: 'Acesso negado' });
      }

      // Verificar se id e valido
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(422).json({ message: 'ID inválido' });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      await User.findByIdAndDelete(id);
      res.status(200).json({ message: 'Usuário removido com sucesso' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};