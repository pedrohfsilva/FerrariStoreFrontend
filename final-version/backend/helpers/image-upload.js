const multer = require('multer');
const path = require('path');

// Destino para as imagens
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "";
    
    if (req.baseUrl.includes("users")) {
      folder = "users";
    } else if (req.baseUrl.includes("products")) {
      folder = "products";
    }
    
    cb(null, `public/images/${folder}`);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + String(Math.floor(Math.random() * 1000)) + path.extname(file.originalname));
  },
});

// Destino para os arquivos de áudio
const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/sounds/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + String(Math.floor(Math.random() * 1000)) + path.extname(file.originalname));
  },
});

// Validação de tipos de arquivo para imagens
const imageUpload = multer({
  storage: imageStorage,
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("Por favor, envie apenas jpg, jpeg ou png!"));
    }
    cb(undefined, true);
  },
});

// Validação de tipos de arquivo para áudio
const audioUpload = multer({
  storage: audioStorage,
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(mp3|wav|ogg|m4a)$/)) {
      return cb(new Error("Por favor, envie apenas mp3, wav, ogg ou m4a!"));
    }
    cb(undefined, true);
  },
});

// Upload combinado para produtos (imagens + áudio)
const productUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === 'images') {
        cb(null, 'public/images/products');
      } else if (file.fieldname === 'soundFile') {
        cb(null, 'public/sounds/');
      } else {
        cb(new Error('Campo de arquivo inválido'));
      }
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + String(Math.floor(Math.random() * 1000)) + path.extname(file.originalname));
    },
  }),
  fileFilter(req, file, cb) {
    if (file.fieldname === 'images') {
      if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
        return cb(new Error("Por favor, envie apenas jpg, jpeg ou png para imagens!"));
      }
    } else if (file.fieldname === 'soundFile') {
      if (!file.originalname.match(/\.(mp3|wav|ogg|m4a)$/)) {
        return cb(new Error("Por favor, envie apenas mp3, wav, ogg ou m4a para áudio!"));
      }
    }
    cb(undefined, true);
  },
});

module.exports = { imageUpload, audioUpload, productUpload };