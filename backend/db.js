const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI, {
  family: 4,
  tls: true,
});

let db;

async function connectDB() {
  await client.connect();

  db = client.db();

  console.log("MongoDB Atlas Connected Successfully!");

  return db;
}

function getDB() {
  if (!db) {
    throw new Error("Database is not connected.");
  }

  return db;
}

module.exports = {
  connectDB,
  getDB,
};
