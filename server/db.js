const { MongoClient } = require('mongodb');

const uri = "mongodb://thanhtb2005_db_user:gMeJOog1jJcgWXKA@ac-cuy2ewy-shard-00-00.6ogke8z.mongodb.net:27017,ac-cuy2ewy-shard-00-01.6ogke8z.mongodb.net:27017,ac-cuy2ewy-shard-00-02.6ogke8z.mongodb.net:27017/?ssl=true&replicaSet=atlas-qltq8j-shard-0&authSource=admin&appName=Testing";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Kết nối MongoDB thành công!");

    const db = client.db("test"); // Đổi tên database nếu cần
    const collection = db.collection("demo"); // Đổi tên collection nếu cần

    // TẠO (Create)
    const insertResult = await collection.insertOne({ name: "Nguyen Van A", age: 25 });
    console.log("Thêm thành công:", insertResult.insertedId);

    // ĐỌC (Read)
    const findResult = await collection.find({}).toArray();
    console.log("Dữ liệu hiện có:", findResult);

    // CẬP NHẬT (Update)
    const updateResult = await collection.updateOne(
      { name: "Nguyen Van A" },
      { $set: { age: 26 } }
    );
    console.log("Số bản ghi cập nhật:", updateResult.modifiedCount);

    // XOÁ (Delete)
    const deleteResult = await collection.deleteOne({ name: "Nguyen Van A" });
    console.log("Số bản ghi đã xoá:", deleteResult.deletedCount);

  } catch (err) {
    console.error("Kết nối MongoDB thất bại:", err);
  } finally {
    await client.close();
  }
}

run();
