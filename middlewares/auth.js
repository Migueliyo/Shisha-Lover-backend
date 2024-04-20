import jwt from "jsonwebtoken"

export const authenticationMiddleware = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader) {
    const token = authorizationHeader.split(" ")[1]; // Obtiene el token sin "Bearer "
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: true, message: 'Failed to authenticate token.' });
      }
      req.user = user;
      next();
    });
  } else if (req.method !== 'GET') {
    res.status(401).json({ error: true, message: 'Access denied' });
  } else {
    next();
  }
};

