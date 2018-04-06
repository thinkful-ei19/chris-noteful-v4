'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const Note = require('../models/note');
const User = require('../models/user');
const Tag = require('../models/tag');
const Folder = require('../models/folder');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/notes', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  const userId = req.user.id;

  let filter = {userId: userId};

  /**
   * BONUS CHALLENGE - Search both title and content using $OR Operator
   *   filter.$or = [{ 'title': { $regex: re } }, { 'content': { $regex: re } }];
  */

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.title = { $regex: re };
  }

  if (folderId) {
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }

  Note.find(filter)
    .populate('tags')
    .sort('created')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  console.log(id);
  console.log(userId);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOne({ _id: id, userId })
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);z
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (tags) {
    tags.forEach((tag) => {
      if (!mongoose.Types.ObjectId.isValid(tag)) {
        const err = new Error('The `id` is not valid');
        err.status = 400;
        return next(err);
      }
    });
  }

  const newItem = { title, content, folderId, tags, userId };
  
  //Check to see if folderId and tags are user's own.
  let usersTag = true;
  tags.forEach((item) => {
    Tag.findById(item)
      .then((result) => {
        console.log(`${result.userId} -- ${userId}`)
        if (String(result.userId) !== String(userId)) {
          usersTag = false;
        }
      })
      .catch((err) => {
        next(err)
      })
  })
  let usersFolder = true;
  if (folderId) {
    Folder.findById(folderId)
    .then((result) => {
      console.log(`${result.userId} -- ${userId}`)
      if (String(result.userId) !== String(userId)) {
        usersFolder = false;
      }
    })
    .catch((err) => {
      next(err);
    })
  }

  setTimeout( function() {
    console.log('tag: ' + usersTag);
    console.log('folder: ' + usersFolder)
    if (usersFolder === true && usersTag === true) {
      Note.create(newItem)
      .then(result => {
        res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
      })
      .catch(err => {
        next(err);
      });
    } else {
      const err = new Error('You are attempting to append this new note to folders/tags that are not yours.');
      err.status = 400;
      return next(err);
    }
  }, 1000)
 



});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;

  const updateItem = { title, content, tags, userId};
  console.log(updateItem);

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (mongoose.Types.ObjectId.isValid(folderId)) {
    updateItem.folderId = folderId;
  }

  if (tags) {
    tags.forEach((tag) => {
      if (!mongoose.Types.ObjectId.isValid(tag)) {
        const err = new Error('The `id` is not valid');
        err.status = 400;
        return next(err);
      }
    });
  }


  const options = { new: true };

  let usersTag = true;
  tags.forEach((item) => {
    Tag.findById(item)
      .then((result) => {
        console.log(`${result.userId} -- ${userId}`)
        if (String(result.userId) !== String(userId)) {
          usersTag = false;
        }
      })
      .catch((err) => {
        next(err)
      })
  })
  let usersFolder = true;
  if (folderId) {
    Folder.findById(folderId)
    .then((result) => {
      console.log(`${result.userId} -- ${userId}`)
      if (String(result.userId) !== String(userId)) {
        usersFolder = false;
      }
    })
    .catch((err) => {
      next(err);
    })
  }

  setTimeout( function() {
    console.log('tag: ' + usersTag);
    console.log('folder: ' + usersFolder)
    if (usersFolder === true && usersTag === true) {
      Note.findById(id)
      .then((result) => {
        if (result === null) {
          const err = new Error('The `id` does not exist.');
          err.status = 404;
          return next(err);
        }
        if (String(result.userId) === String(userId)) {
          Note.findByIdAndUpdate(id, updateItem, options)
          .then(result => {
            res.json(result);
          })
          .catch(err => {
            next(err);
          })
        }
        else {
          const err = new Error('This id does not belong to this user.');
          err.status = 400;
          return next(err);
        }
      })
      .catch((err)=> {
        next(err);
      })
    } else {
      const err = new Error('You are attempting to append this new note to folders/tags that are not yours.');
      err.status = 400;
      return next(err);
    }
  }, 1000)
 

  // Note.findByIdAndUpdate(id, updateItem, options)
  // .populate('tags')
  // .then(result => {
  //   if (result) {
  //     res.json(result);
  //   } else {
  //     next();
  //   }
  // })
  // .catch(err => {
  //   next(err);
  // });

});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  Note.findById(id)
    .then((result) => {
      if (String(result.userId) === String(userId)) {
        Note.findByIdAndRemove(id)
        .then(() => {
          res.status(204).end();
        })
        .catch(err => {
          next(err);
        });
      } else {
        const err = new Error('This id does not belong to this user.');
        err.status = 400;
        return next(err);
      }
    })
});

module.exports = router;