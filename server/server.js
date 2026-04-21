const express = require('express');
const { MongoClient } = require('mongodb');

const uri = "mongodb://thanhtb2005_db_user:gMeJOog1jJcgWXKA@ac-cuy2ewy-shard-00-00.6ogke8z.mongodb.net:27017,ac-cuy2ewy-shard-00-01.6ogke8z.mongodb.net:27017,ac-cuy2ewy-shard-00-02.6ogke8z.mongodb.net:27017/?ssl=true&replicaSet=atlas-qltq8j-shard-0&authSource=admin&appName=Testing";
const client = new MongoClient(uri);

const app = express();
app.use(express.json());

let collection;

async function main() {
  try {
    await client.connect();
    console.log('Kết nối MongoDB thành công!');
    const db = client.db('test'); // Đổi tên database nếu cần
    collection = db.collection('demo'); // Đổi tên collection nếu cần
  } catch (err) {
    console.error('Kết nối MongoDB thất bại:', err);
    process.exit(1);
  }
}

// Tạo mới
app.post('/demo', async (req, res) => {
  try {
    const result = await collection.insertOne(req.body);
    res.json({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy tất cả
app.get('/demo', async (req, res) => {
  try {
    const docs = await collection.find({}).toArray();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật
app.put('/demo/:name', async (req, res) => {
  try {
    const result = await collection.updateOne(
      { name: req.params.name },
      { $set: req.body }
    );
    res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xoá
app.delete('/demo/:name', async (req, res) => {
  try {
    const result = await collection.deleteOne({ name: req.params.name });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

main().then(() => {
  app.listen(3000, () => {
    console.log('Server đang chạy tại http://localhost:3000');
  });
});
