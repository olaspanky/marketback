// db.js
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI ||
  'mongodb+srv://olakareemomobolarinwa:5fouoAMTjLZ17WEJ@cluster0.okrpagt.mongodb.net/pbrsite?retryWrites=true&w=majority';

let cachedConn = null;

async function connectDB() {
  if (cachedConn) return cachedConn;

  const conn = await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('MongoDB connected');
  cachedConn = conn;
  return conn;
}

module.exports = { connectDB };