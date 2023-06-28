const jwt = require("jsonwebtoken");

// Middleware d'authentification
module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // Récupérer le token d'authentification du header
    const decodedToken = jwt.verify(token, process.env.TOKEN_KEY); // Vérifier et décoder le token
    const userId = decodedToken.userId; // Extraire l'ID de l'utilisateur du token décodé
    req.auth = {
      userId: userId, // Ajouter l'ID de l'utilisateur à l'objet 'auth' de la requête
    };
    next(); // Passer au middleware suivant
  } catch (error) {
    res.status(401).json({ error }); // En cas d'erreur, renvoyer une réponse d'erreur avec le statut 401
  }
};
