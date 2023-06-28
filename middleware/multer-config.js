const multer = require("multer");

// Types MIME autorisés et leurs extensions correspondantes
const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
};

// Configuration du stockage des fichiers avec Multer
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images"); // Définir le dossier de destination des fichiers
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(" ").join("_"); // Nom du fichier original avec les espaces remplacés par des underscores
    const extension = MIME_TYPES[file.mimetype]; // Extension du fichier basée sur le type MIME
    callback(null, name + Date.now() + "." + extension); // Nom du fichier complet avec un horodatage pour éviter les doublons
  },
});

// Exporter le middleware Multer configuré
module.exports = multer({ storage: storage }).single("image");
