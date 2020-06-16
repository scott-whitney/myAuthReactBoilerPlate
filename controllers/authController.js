const { isEmail, isLength } = require('validator');
const jwt = require('jwt-simple');
const { secret } = require('../config');
const connection = require('../config/connection');
const {
  findUserByEmail,
  createUser,
} = require('./../models/user/userOrm');

function tokenForUser(user) {
  // 1st argument is the information we want to encode
  // 2nd argument is the secret we are going to use to encrypt it
  // By convention all json web tokens have a sub property
  // by sub we mean subject. As in who does this token belong to?
  // iat or issued at time is another convention by  jwt
  const timeStamp = new Date().getTime();
  // This subject will become the payload in our strategy
  // eslint-disable-next-line no-underscore-dangle
  return jwt.encode({ sub: user.id, iat: timeStamp }, process.env.SECRET || secret);
}

module.exports = {
  signUp: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({ error: 'You must provide email and password' });
    }

    if (!isEmail(email)) {
      return res.status(403).json({ error: 'You must provide a valid email address' });
    }

    if (!isLength(password, { min: 6 })) {
      return res.status(403).json({ error: 'Your password must be at least 6 characters long' });
    }

    try {
      // See if a user with the given email exists
      const existingUser = await findUserByEmail(email);
      if (existingUser) { return res.status(401).json({ error: 'User already exists' }); }
      const user = await createUser(email, password);
      return res.json({ token: tokenForUser(user) });
    } catch (e) {
      return res.status(403).json({ e });
    }
  },
  signIn: (req, res) => res.json({ token: tokenForUser(req.user) }),
};
