require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const conn = process.env.DB_CONNECTION_STRING;
  if (!conn) {
    console.error('DB_CONNECTION_STRING 未设置');
    process.exit(1);
  }
  try {
    await mongoose.connect(conn, { useNewUrlParser: true, useUnifiedTopology: true });
  } catch (err) {
    console.error('连接数据库失败:', err);
    process.exit(2);
  }

  const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  });
  const User = mongoose.model('User', UserSchema);

  try {
    const count = await User.countDocuments();
    const docs = await User.find({}, 'username _id').limit(20).lean();
    const one = await User.findOne({}, 'password').lean();
    const idx = await User.collection.indexes();

    console.log('用户总数:', count);
    console.log('示例用户(最多 20 条，仅显示 username 与 _id):');
    console.log(JSON.stringify(docs, null, 2));

    const isHashed = !!(one && typeof one.password === 'string' && one.password.startsWith('$2'));
    console.log('密码字段是否为 bcrypt 哈希(采样 1 条):', isHashed);

    console.log('users 集合索引配置:');
    console.log(JSON.stringify(idx, null, 2));
  } catch (err) {
    console.error('查询用户失败:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();