const express = require('express');
const factory = require('../controllers/handlerFactory');

// Generate a router for a given Mongoose Model
exports.createResourceRouter = (Model) => {
  const router = express.Router();

  router.route('/')
    .get(factory.getAll(Model))
    .post(factory.createOne(Model));

  router.route('/:id')
    .get(factory.getOne(Model))
    .put(factory.updateOne(Model))
    .patch(factory.updateOne(Model))
    .delete(factory.deleteOne(Model));

  return router;
};
