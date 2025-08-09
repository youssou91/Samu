// get-admin-token.js
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/presence-management';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

async function main() {
  await mongoose.connect(MONGO_URI);

  const email = 'admin@example.com';
  const password = 'admin123';
  let user = await User.findOne({ email });
  if (!user) {
    const hashed = await bcrypt.hash(password, 10);
    user = new User({
      prenom: 'Admin',
      nom: 'Principal',
      email,
      telephone: '0000000000',
      role: 'admin',
      actif: true,
      password: hashed,
      specialite: 'Direction',
      status: 'active'
    });
    await user.save();
    console.log('Utilisateur admin créé.');
  } else {
    console.log('Utilisateur admin déjà existant.');
  }
  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
  console.log('--- Identifiants admin pour test ---');
  console.log('Email   :', email);
  console.log('Password:', password);
  console.log('Token   :', token);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
