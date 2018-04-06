'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');


const seedUsers = require('../db/seed/users')

const { TEST_MONGODB_URI, JWT_SECRET } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Login', function () {
    let token;
    const username = 'exampleUser';
    const password = 'examplePass';
    const fullname = 'Example User';
    
  
    before(function () {
      return mongoose.connect(TEST_MONGODB_URI)
        .then(() => mongoose.connection.db.dropDatabase());
    });
  
    beforeEach(function() {
        return User.hashPassword(password)
          .then(digest => User.create({
            username,
            password: digest,
            fullname,
          }));
      });
    
      afterEach(function () {
        return User.remove();
        // alternatively you can drop the DB
        // return mongoose.connection.db.dropDatabase();
      });
  
    after(function () {
      return mongoose.disconnect();
    });
    describe('Noteful /api/login', function () {
        it('Should return a valid auth token', function () {


            return chai.request(app)
                .post('/api/login')
                .send({ username, password })
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('object');
                    expect(res.body.authToken).to.be.a('string');
                    console.log(res.body);
                    const payload = jwt.verify(res.body.authToken, JWT_SECRET);
                    console.log(payload);
                    //The ID will change every time, allow the id to equal the test's id.
                    let id = payload.user.id;

                    expect(payload.user).to.not.have.property('password');
                    expect(payload.user).to.deep.equal({ id, username, fullname });
                })
        });
        it('Should reject requests with no credentials', function() {
            return chai.request(app)
                .post('/api/login')
                .send({})
                .catch(err => err.response)
                .then(res => {
                    expect(res).to.have.status(400);
                    expect(res.body.message).to.equal("Bad Request");
                })
        });

        it('Should reject requests with incorrect usernames', function() {
            return chai.request(app)
                .post('/api/login')
                .send({username: "blah1234", password: "blah1234"})
                .catch(err => err.response)
                .then(res => {
                    expect(res).to.have.status(401);
                    expect(res.body.message).to.equal("Unauthorized");
                })
        });

        it('Should reject requests with incorrect passwords', function() {
            return chai.request(app)
                .post('/api/login')
                .send({username: username, password: "blah1234"})
                .catch(err => err.response)
                .then(res => {
                    expect(res).to.have.status(401);
                    expect(res.body.message).to.equal("Unauthorized");
                })
        });

    })
})