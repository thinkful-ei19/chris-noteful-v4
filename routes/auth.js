const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken')
const config = require('../config')
//const { JWT_SECRET, JWT_EXPIRY } = require('jsonwebtoken');
const localStrategy = require('../passport/local');

function createAuthToken (user) {
    return jwt.sign({ user }, config.JWT_SECRET, {
      subject: user.username,
      expiresIn: config.JWT_EXPIRY
    });
  }

const options = {session: false, failWithError: true};

const localAuth = passport.authenticate('local', options);

router.post('/login', localAuth, function (req, res) {
    const authToken = createAuthToken(req.user);
    return res.json({ authToken });
});

const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

router.post('/referesh', jwtAuth, (req, res) => {
    const authToken = createAuthToken(req.user);
    res.json({ authToken })
});

module.exports = router;