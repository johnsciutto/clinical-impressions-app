const { MongoClient, ObjectId } = require('mongodb');
const Joi = require('joi');

const {
  DB_URL,
  DB_NAME,
  TEST_COLLECTION,
  COND_COLLECTION,
} = process.env;

class DatabaseInterface {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.Schema = this.createSchema();
  }

  static isValidId(id) {
    const regEx = /^[0-9a-fA-F]{24}$/;
    return regEx.test(id);
  }

  createSchema() {
    if (this.collectionName === COND_COLLECTION) {
      return Joi.object({
        name: Joi.string().required(),
        alias: Joi.string(),
        description: Joi.string().required(),
        positive_tests: Joi.array(),
      });
    }
    return Joi.object({
      name: Joi.string().required(),
      positive: Joi.string().required(),
      description: Joi.string().required(),
    });
  }

  async initiateDBConnection() {
    const client = new MongoClient(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const database = client.db(DB_NAME);
    const collection = database.collection(this.collectionName);
    return { client, collection };
  }

  async add(obj) {
    try {
      const { error } = this.Schema.validate(obj);
      if (error) {
        throw error;
      }
      const { client, collection } = await this.initiateDBConnection();
      const result = await collection.insertOne(obj);
      await client.close();
      return result;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async findAll() {
    try {
      const { client, collection } = await this.initiateDBConnection();
      const cursor = await collection.find();
      const results = await cursor.toArray();
      await cursor.close();
      await client.close();
      return results;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async find(name) {
    try {
      const { client, collection } = await this.initiateDBConnection();
      let result;
      if (!DatabaseInterface.isValidId(name)) {
        result = await collection.findOne({ $text: { $search: name } });
      } else {
        result = await collection.findOne({ _id: ObjectId(name) });
      }
      await client.close();
      return result;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async change(id, changes) {
    try {
      if (!DatabaseInterface.isValidId(id)) throw new Error('Given argument is not a valid ID');
      const { client, collection } = await this.initiateDBConnection();
      const { result } = await collection.updateOne({ _id: ObjectId(id) }, changes);
      await client.close();
      return result;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async remove(id) {
    try {
      const { client, collection } = await this.initiateDBConnection();
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
      return error;
    }
  }
}

const Condition = new DatabaseInterface(COND_COLLECTION);
const Test = new DatabaseInterface(TEST_COLLECTION);

module.exports = { Condition, Test };
