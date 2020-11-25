const express = require('express');
const { Test } = require('../mongodb-interface');

module.exports = (app) => {
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.route('/')

    .get(async (req, res) => {
      const result = await Test.findAll();
      res.send(result);
    })

    .post(async (req, res) => {
      const { body } = req;
      const result = await Test.add(body);
      res.send(result.ops[0]._id);
    });

  app.route('/:conditionName')

    .get(async (req, res) => {
      const { conditionName } = req.params;
      try {
        const result = await Test.find(conditionName);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    })

    .put(async (req, res) => {
      try {
        const { conditionName: id } = req.params;
        const result = await Test.change(id, { $set: { ...req.body } });
        const { ok, nModified } = result;
        if (!ok) {
          res.send('The operation was not completed successfully');
        }
        if (!nModified) {
          res.send('No modification was made to the item');
        } else {
          res.send(`${nModified} element was modified successfully`);
        }
      } catch (error) {
        console.log(error);
      }
    })

    .delete(async (req, res) => {
      try {
        const { conditionName: id } = req.params;
        const { code } = req.body;
        if (id === code) {
          const result = await Test.remove(id);
          res.send(result);
        } else {
          res.send('Id and deletion code don\'t match');
        }
      } catch (error) {
        console.log(error);
      }
    });
};
