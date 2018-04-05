'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_MONGODB_URI } = require('../config'); ('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    // noop
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('/api/users', function () {
    describe('POST', function () {
      it('Should create a new user', function () {
        const testUser = { username, password, fullname };

        let res;
        return chai.request(app).post('/api/users').send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'username', 'fullname');

            expect(res.body.id).to.exist;
            expect(res.body.username).to.equal(testUser.username);
            expect(res.body.fullname).to.equal(testUser.fullname);

            return User.findOne({ username });
          })
          .then(user => {
            expect(user).to.exist;
            expect(user.id).to.equal(res.body.id);
            expect(user.fullname).to.equal(testUser.fullname);
            return user.validatePassword(password);
          })
          .then(isValid => {
            expect(isValid).to.be.true;
          });
      });
      it('Should reject users with missing username', function () {
        const testUser = { password, fullname };
        return chai.request(app).post('/api/users').send(testUser)
            .catch(err => err.response)
            .then(res => {
                expect(res).to.have.status(422);
                expect(res.body.message).to.eq('Missing `username` in request body');
          });
      });

      /**
       * COMPLETE ALL THE FOLLOWING TESTS
       */
      it('Should reject users with missing password', function () {
          const testUser =  { username, fullname };
          return chai.request(app).post('/api/users').send(testUser)
            .catch(err => err.response)
            .then(res => {
                expect(res).to.have.status(422);
                expect(res.body.message).to.eq('Missing `password` in request body')
            })
      });
      it('Should reject users with non-string username', function () {
          const testUser = {
              password: "testit",
              username: 12345678,
              fullname: 'Example Test'
          }
          return chai.request(app).post('/api/users').send(testUser)
            .catch(err => err.response)
            .then(res => {
                expect(res).to.have.status(422);
                expect(res.body.message).to.eq('Provided information contains an entry that is not a string.')
            })
      });
      it('Should reject users with non-string password', function() {
          const testUser = {
              password: 12345678,
              username: "testit",
              fullname: 'Example Test'
          }
          return chai.request(app).post('/api/users').send(testUser)
            .catch(err => err.response)
            .then(res => {
                expect(res).to.have.status(422);
                expect(res.body.message).to.eq('Provided information contains an entry that is not a string.')
            })
      });
      it('Should reject users with non-trimmed username', function() {
          const testUser =  {
            username: "Blah Blah",
            password: "yesyesyes",
            fullname: "Fido Fido"      
          }
          return chai.request(app).post('/api/users').send(testUser)
            .catch(err => err.response)
            .then(res => {
              expect(res).to.have.status(422);
              expect(res.body.message).to.eq('Please ensure that there are no spaces in the username or password.')
            })
      });
      it('Should reject users with non-trimmed password', function () {
          const testUser = {
            username: "yesyesyes",
            password: "blah blah",
            fullname: "fido fido"
          }
          return chai.request(app).post('/api/users').send(testUser)
            .catch(err => err.response)
            .then(res => {
              expect(res).to.have.status(422);
              expect(res.body.message).to.eq('Please ensure that there are no spaces in the username or password.')
            })
      });
      it('Should reject users with empty username', function () {
        const testUser = {
          username: "",
          password: "blah blah",
          fullname: "fido fido"
        }
        return chai.request(app).post('/api/users').send(testUser)
            .catch(err => err.response)
            .then(res => {
              expect(res).to.have.status(422);
              expect(res.body.message).to.eq('Missing `username` in request body')
            })
      });
      it('Should reject users with password less than 8 characters', function () {
        const testUser = {
          username: "blah1234",
          password: "basd",
          fullname: "fido fido"
        }
        return chai.request(app).post('/api/users').send(testUser)
            .catch(err => err.response)
            .then(res => {
              expect(res).to.have.status(422);
              expect(res.body.message).to.eq('Password must be between 8 to 72 characters in length.')
            })
      });
      it('Should reject users with password greater than 72 characters', function() {
        const testUser = {
          username: "blah",
          password: "123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890",
          fullname: "fido fido"
        }
        return chai.request(app).post('/api/users').send(testUser)
            .catch(err => err.response)
            .then(res => {
              expect(res).to.have.status(422);
              expect(res.body.message).to.eq('Password must be between 8 to 72 characters in length.')
            })
      });
      it('Should reject users with duplicate username', function () {
        const testUser = {
          username: "user0000",
          password: "user1234",
          fullname: "fido fido"
        }

        // chai.request(app).post('/api/users').send(testUser)
        //   .catch(err => err.response)
        //   .then(res => {
        //     expect(res).to.have.status(201);
        //   })

        return chai.request(app).post('/api/users').send(testUser)
            .catch(err => err.response)
            .then(res => {
              return chai.request(app).post('/api/users').send(testUser)
              .catch(err => err.response)
                .then((res) => {
                  expect(res).to.have.status(400);
                  expect(res.body.message).to.eq('That username already exists!');
                })
            })
      });
      it('Should trim fullname', function () {
        const testUser = { 
          username: username,
          password: password,
          fullname: "     fido Fido   "
        };

        let res;
        return chai.request(app).post('/api/users').send(testUser)
          .then(_res => {
            res = _res;
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'username', 'fullname');

            expect(res.body.id).to.exist;
            expect(res.body.username).to.equal(testUser.username);
            expect(res.body.fullname).to.equal(testUser.fullname.trim());

            return User.findOne({ username });
          })
          .then(user => {
            expect(user).to.exist;
            expect(user.id).to.equal(res.body.id);
            expect(user.fullname).to.equal(testUser.fullname.trim());
            return user.validatePassword(password);
          })
          .then(isValid => {
            expect(isValid).to.be.true;
          });
      });
    });

    //No GET endpoint exists for users- and there shouldn't be a GET request.

    // describe('GET', function () {
    //   it('Should return an empty array initially', function () {
    //     return chai.request(app).get('/api/users')
    //       .then(res => {
    //         expect(res).to.have.status(200);
    //         expect(res.body).to.be.an('array');
    //         expect(res.body).to.have.length(0);
    //       });
    //   });
    //   it('Should return an array of users', function () {
    //     const testUser0 = {
    //       username: `${username}`,
    //       password: `${password}`,
    //       fullname: ` ${fullname} `
    //     };
    //     const testUser1 = {
    //       username: `${username}1`,
    //       password: `${password}1`,
    //       fullname: `${fullname}1`
    //     };
    //     const testUser2 = {
    //       username: `${username}2`,
    //       password: `${password}2`,
    //       fullname: `${fullname}2`
    //     };

    //     /**
    //      * CREATE THE REQUEST AND MAKE ASSERTIONS
    //      */
    //   });
    // });
  });
});