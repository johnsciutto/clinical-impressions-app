const { MongoClient, ObjectId } = require('mongodb');
const Joi = require('joi');

const {
  DB_URL,
  DB_NAME,
  TEST_COLLECTION,
  COND_COLLECTION,
} = process.env;

const conditionSchema = Joi.object({
  name: Joi.string().required(),
  alias: Joi.string(),
  description: Joi.string().required(),
  positive_tests: Joi.array(),
});

const testSchema = Joi.object({
  name: Joi.string().required(),
  indicates: Joi.array().required(),
  description: Joi.array().required(),
});

const initiateDBConnection = async (collectionName) => {
  const client = new MongoClient(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const database = client.db(DB_NAME);
  const collection = database.collection(collectionName);
  return { client, collection };
};

const isValidId = (id) => {
  const regEx = /^[0-9a-fA-F]{24}$/;
  return regEx.test(id);
};

const createInstance = (collectionName) => {
  const Schema = collectionName === COND_COLLECTION ? conditionSchema : testSchema;

  return ({

    async add(obj) {
      try {
        const { error } = Schema.validate(obj);
        if (error) {
          throw error;
        }
        const { client, collection } = await initiateDBConnection(collectionName);
        const result = await collection.insertOne(obj);
        await client.close();
        return result;
      } catch (error) {
        console.log(error);
      }
    },

    async findAll() {
      try {
        const { client, collection } = await initiateDBConnection(collectionName);
        const cursor = await collection.find();
        const results = await cursor.toArray();
        await cursor.close();
        await client.close();
        return results;
      } catch (error) {
        console.log(error);
      }
    },

    async find(name) {
      try {
        const { client, collection } = await initiateDBConnection(collectionName);
        let result;
        if (!isValidId(name)) {
          result = await collection.findOne({ $text: { $search: name } });
        } else {
          result = await collection.findOne({ _id: ObjectId(name) });
        }
        await client.close();
        return result;
      } catch (error) {
        console.log(error);
      }
    },

    async change(id, changes) {
      try {
        if (!isValidId(id)) throw new Error('Given argument is not a valid ID');
        const { client, collection } = await initiateDBConnection(collectionName);
        const { result } = await collection.updateOne({ _id: ObjectId(id) }, changes);
        await client.close();
        return result;
      } catch (error) {
        console.log(error);
      }
    },

    async remove(id) {
      try {
        const { client, collection } = await initiateDBConnection(collectionName);
        const result = await collection.deleteOne({ _id: ObjectId(id) });
        await client.close();
        if (result.deletedCount === 1) {
          return {
            ok: true,
            msg: 'Successfully deleted one document',
          };
        }
        return {
          ok: false,
          msg: 'No document deleted',
        };
      } catch (error) {
        console.log(error);
      }
    },
  });
};

const ConditionCollection = createInstance(COND_COLLECTION);
const TestCollection = createInstance(TEST_COLLECTION);

module.exports = { Condition: ConditionCollection, Test: TestCollection };
