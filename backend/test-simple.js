const assert = require('assert');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { genererRapportPerformance } = require('./src/controllers/rapportsController2');

// Fonction de test simple
async function testPerformanceRapport() {
  console.log('Début du test de génération de rapport de performance...');
  
  try {
    // Démarrer un serveur MongoDB en mémoire
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Se connecter à la base de données
    await mongoose.connect(mongoUri);
    console.log('Connecté à MongoDB en mémoire');
    
    // Ici, vous pouvez ajouter des données de test si nécessaire
    // Par exemple, créer des rendez-vous de test
    
    // Tester la fonction de génération de rapport
    const resultat = await genererRapportPerformance();
    
    // Vérifier que le résultat est conforme aux attentes
    console.log('Résultat du test:', resultat);
    assert(resultat.success === true, 'Le rapport de performance devrait être généré avec succès');
    
    console.log('✅ Test réussi !');
  } catch (erreur) {
    console.error('❌ Erreur lors du test:', erreur);
    process.exit(1);
  } finally {
    // Nettoyer
    await mongoose.disconnect();
    await mongoServer.stop();
    process.exit(0);
  }
}

// Exécuter le test
testPerformanceRapport();
