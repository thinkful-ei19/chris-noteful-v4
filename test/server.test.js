'use strict';
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_MONGODB_URI, JWT_SECRET } = require('../config');
const expect = chai.expect;

const User = require('../models/user');
const seedUsers = require('../db/seed/users');


chai.use(chaiHttp);

describe('Server Tests', function () {
    let token;
    let user;

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return User.insertMany(seedUsers)
    .then(results => {
      user = results[0];
      token = jwt.sign({ user }, JWT_SECRET, { subject: user.username });
    })
   
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });
  describe('Reality Check', () => {

    it('true should be true', () => {
      expect(true).to.be.true;
    });
  
    it('2 + 2 should equal 4 (except in 1984)', () => {
      expect(2 + 2).to.equal(4);
    });
  
  });
  
  describe('Environment', () => {
  
    it('NODE_ENV should be "test"', () => {
      expect(process.env.NODE_ENV).to.equal('test');
    });
  
  });
  
  describe('Basic Express setup', () => {
  
    describe('Express static', () => {
  
      it('GET request "/" should return the index page', () => {
        return chai.request(app)
          .get('/')
          .then(function (res) {
            expect(res).to.exist;
            expect(res).to.have.status(200);
            expect(res).to.be.html;
          });
      });
  
    });
  
    describe('404 handler', () => {
  
      it('should respond with 404 when given a bad path', () => {
        return chai.request(app)
          .get('/bad/path')
          .set('Authorization', `Bearer ${token}`)
          .catch(err => err.response)
          .then(res => {
            expect(res).to.have.status(404);
          });
      });
  
    });
  });

})

