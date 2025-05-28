const router = require('express').Router();
const UserController = require('../controllers/UserController');
// Middlewares
const verifyToken = require('../helpers/verify-token');
const { imageUpload } = require('../helpers/image-upload');
const { validateToken, checkAdmin } = require('../helpers/verify-token');

// Rotas públicas
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/check', UserController.checkUser);
router.get('/checkuser', UserController.checkUser); // For frontend compatibility

// Admin user registration route - requires admin privileges
router.post('/admin/register', validateToken, checkAdmin, UserController.register);

// Single address routes
router.get('/address', verifyToken, UserController.getAddress);
router.put('/address', verifyToken, UserController.updateAddress);

// Single payment method routes
router.get('/payment-method', verifyToken, UserController.getPaymentMethod);
router.put('/payment-method', verifyToken, UserController.updatePaymentMethod);

// Cart routes
router.get('/cart', verifyToken, UserController.getCart);
router.post('/cart', verifyToken, UserController.addToCart);
router.delete('/cart/clear', verifyToken, UserController.clearCart);
router.put('/cart/:itemId', verifyToken, UserController.updateCartItem);
router.delete('/cart/:itemId', verifyToken, UserController.removeFromCart);

// Order routes
router.get('/orders', verifyToken, UserController.getOrders);
router.get('/orders/:orderId', verifyToken, UserController.getOrderById);
router.post('/orders', verifyToken, UserController.createOrder);

// Rotas privadas - note these are now AFTER the specific routes
router.get('/:id', verifyToken, UserController.getUserById);
router.patch('/edit', verifyToken, imageUpload.single('image'), UserController.editUser);
router.put('/:id', verifyToken, UserController.editUser);
router.put('/:id/change-password', verifyToken, UserController.changePassword);

// Rotas de administrador
router.get('/', verifyToken, UserController.getAllUsers);
router.delete('/:id', verifyToken, UserController.deleteUser);

module.exports = router;