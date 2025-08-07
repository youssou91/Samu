const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const express = require('express');

// Créer une application Express simple pour le test
const app = express();
app.use(express.json());

// Route de test simple
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Test réussi!' });
});

// Configuration des tests
let mongoServer;

beforeAll(async () => {
  // Démarrer un serveur MongoDB en mémoire
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Test simple', () => {
  it('devrait retourner une réponse de test', async () => {
    const res = await request(app).get('/api/test');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Test réussi!');
  });
});
