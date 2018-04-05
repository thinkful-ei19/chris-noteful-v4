const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user')

router.post('/users', (req, res, next) => {
    const { fullname, username, password } = req.body;

    //Chest for missing fields.
    // const requiredFields = ['username', 'password'];
    // const missingField = requiredFields.find(field => (!field in req.body))

    // if (missingField) {
    //     const err = new Error(`Missing '${missingField}' in request body.`)
    //     err.status = 422;
    //     return next(err);
    // }

    //Check that the username is a minimum of 1 character
    
    if (!req.body.password) {
        const err = new Error('Missing `password` in request body')
        err.status = 422;
        return next(err);
    }
    if (!req.body.username) {
        const err = new Error('Missing `username` in request body')
        err.status = 422;
        return next(err);
    }

    //Check that the fields have no whitespace
    const checkWhiteSpace = function(string) {
        let check = false;
        const whiteSpace = string.split('').forEach((character) => {
            if (character === ' ') {
                check = true;
            }
        })
        if (check === true) {
            const err = new Error(`Please ensure that there are no spaces in the username or password.`)
            err.status = 422;
            return next(err);
        }
    }
    const checkArr = [username, password];

    //Check that entries are strings.
    const notString = function (string) {
        if (typeof string !== 'string') {
            const err = new Error(`Provided information contains an entry that is not a string.`)
            err.status = 422;
            return next(err);
        }
    }

    checkArr.forEach((item) => {
        notString(item);
        checkWhiteSpace(item);
    })

    //Check that the password is a minimum of 8 characters and a maximum of 72 characters
    

    if (!username) {
        const err = new Error('Missing `username` in request body');
        err.status = 400;
        return next(err);
    }
    if (!password) {
        const err = new Error('Missing `password` in request body');
        err.status = 400;
        return next(err);
    } else if (password.length < 8 || password.length > 72) {
        const err = new Error(`Password must be between 8 to 72 characters in length.`)
        err.status = 422;
        return next(err);
    }

    if (username.length < 1) {
        const err = new Error(`Username must be at least one character long.`)
        err.status = 422;
        return next(err);
    }

    User.find()
        .then((results) => {
            let check = false;
            results.forEach((user) => {
                if (user.username === username) {
                    check = true;
                }
            })
            if (check === true) {
                const err = new Error('That username already exists!');
                err.status = 400;
                return next(err);
            } else {

                return User.hashPassword(password)
                    .then(digest => {
                        const newUser = {
                            fullname: fullname.trim(),
                            username: username,
                            password: digest
                        }
                        User.create(newUser)
                            .then((result) => {
                                console.log(newUser);
                                res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
                            })
                            .catch((err) => next(err));
                    })
            }
        })

})

module.exports = router;