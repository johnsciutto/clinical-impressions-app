const express = require('express');
const { ObjectID } = require('mongodb');
const { Condition, Test } = require('./db');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.route('/condition')
  .get(async (req, res) => {
    // get all conditions
    const result = await Condition.findAll();
    res.send(result);
  })
  .post(async (req, res) => {
    const { body } = req;
    const positiveTestsArray = body.positive_tests.split(';');
    const result = await Condition.add({
      ...body,
      positive_tests: positiveTestsArray,
    });

    res.send(result.ops[0]._id);
  });

app.route('/condition/:conditionName')
  .get(async (req, res) => {
    const { conditionName } = req.params;
    try {
      const result = await Condition.find(conditionName);
      res.send(result);
    } catch (error) {
      console.log(error);
    }
  })
  .put(async (req, res) => {
    try {
      const { conditionName: id } = req.params;
      const result = await Condition.change(id, { $set: { ...req.body } });
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
        const result = await Condition.remove(id);
        res.send(result);
      } else {
        res.send('Id and deletion code don\'t match');
      }
    } catch (error) {
      console.log(error);
    }
  });

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
