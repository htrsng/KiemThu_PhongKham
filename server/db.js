const { MongoClient } = require('mongodb');

const uri = "mongodb://thanhtb2005_db_user:gMeJOog1jJcgWXKA@ac-cuy2ewy-shard-00-00.6ogke8z.mongodb.net:27017,ac-cuy2ewy-shard-00-01.6ogke8z.mongodb.net:27017,ac-cuy2ewy-shard-00-02.6ogke8z.mongodb.net:27017/?ssl=true&replicaSet=atlas-qltq8j-shard-0&authSource=admin&appName=Testing";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Kết nối MongoDB thành công!");
  } catch (err) {
    console.error("Kết nối MongoDB thất bại:", err);
  } finally {
    await client.close();
  }
}

run();
