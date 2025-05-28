const router = require('express').Router();
const ProductController = require('../controllers/ProductController');

// Middlewares
const verifyToken = require('../helpers/verify-token');
const { productUpload } = require('../helpers/image-upload');

// Rotas públicas
router.get('/', ProductController.getAll);
router.get('/featured', ProductController.getFeatured);
router.get('/type/:type', ProductController.getByType);
router.get('/search', ProductController.search);
router.get('/:id', ProductController.getById);

// Rotas privadas (admin)
router.post('/', verifyToken, productUpload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'soundFile', maxCount: 1 }
]), ProductController.create);

router.patch('/:id', verifyToken, productUpload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'soundFile', maxCount: 1 }
]), ProductController.update);

router.delete('/:id', verifyToken, ProductController.delete);
router.patch('/:id/remove-image', verifyToken, ProductController.removeImage);
router.delete('/:id/remove-sound', verifyToken, ProductController.removeSoundFile);

module.exports = router;