const Book = require("../models/book");
const sharp = require("sharp");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  let path = "./images/" + req.file.filename;
  let newpath = "./images2/" + req.file.filename;
  sharp(path)
    .resize(498, 568)
    .png()
    .toFile(newpath)
    .then((data) => {
      console.log("images ok");
      const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get("host")}/images2/${
          req.file.filename
        }`,
      });

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
        res.status(401).json({ message: "Not authorized" });
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Objet modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
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

exports.rating = (req, res, next) => {
  let currentRating = parseInt(req.body.rating);
  if (currentRating < 0 || currentRating > 5) {
    // renvoyer une erreur appropriée
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
        console.log("adding to the total " + rating.grade);
        total += parseInt(rating.grade);
        count++;
      }
      if (!found) {
        book.ratings.push({
          userId: req.auth.userId,
          grade: currentRating,
        });
        console.log("adding to the total " + currentRating);
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
