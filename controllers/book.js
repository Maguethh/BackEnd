const Book = require("../models/book");
const sharp = require("sharp");
const fs = require("fs");

// Créer un nouveau livre
exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  let path = "./images/" + req.file.filename;
  let newpath = "./images2/" + req.file.filename;

  // Redimensionner et traiter l'image en utilisant sharp
  sharp(path)
    .resize(498, 568)
    .png()
    .toFile(newpath)
    .then((data) => {
      console.log("images ok");

      // Créer un nouvel objet livre avec les données fournies
      const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get("host")}/images2/${
          req.file.filename
        }`,
      });

      // Enregistrer le livre dans la base de données
      book
        .save()
        .then(() => {
          res.status(201).json({ message: "Objet enregistré !" });
        })
        .catch((error) => {
          res.status(400).json({ error });
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Récupérer un livre spécifique
exports.getOneBook = (req, res, next) => {
  Book.findOne({
    _id: req.params.id,
  })
    .then((book) => {
      res.status(200).json(book);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

// Modifier un livre existant
exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete bookObject._userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Non autorisé" });
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Objet modifié !" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

// Supprimer un livre
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Non autorisé" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

// Récupérer tous les livres
exports.getBooks = (req, res, next) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

// Récupérer les meilleurs classements
exports.bestRatings = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => {
      res.send(books);
    })
    .catch((error) => {
      console.error(error);
      res.status(400).json({ error });
    });
};

// Ajouter une note à un livre
exports.rating = (req, res, next) => {
  let currentRating = parseInt(req.body.rating);
  if (currentRating < 1 || currentRating > 5) {
    return res.status(400).json({ error: "La note doit être entre 1 et 5" });
  }

  Book.findOne({
    _id: req.params.id,
  })
    .then((book) => {
      let found = false;
      let total = 0;
      let count = 0;
      for (let rating of book.ratings) {
        if (rating.userId == req.auth.userId) {
          rating.grade = currentRating;
          found = true;
        }
        console.log("ajouter au total " + rating.grade);
        total += parseInt(rating.grade);
        count++;
      }
      if (!found) {
        book.ratings.push({
          userId: req.auth.userId,
          grade: currentRating,
        });
        console.log("ajouter au total " + currentRating);
        total += currentRating;
        count++;
      }
      console.log(total);
      console.log(count);
      book.averageRating = Math.round(total / count);
      return book.save();
    })
    .then((savedBook) => {
      res.status(200).json(savedBook);
    })
    .catch((error) => {
      console.log(error);
      res.status(404).json({
        error: error,
      });
    });
};
