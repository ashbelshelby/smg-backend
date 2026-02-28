const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialisation de Firebase SANS fichier JSON (utilisation des credentials par défaut)
try {
  // Pour Railway, on utilise les credentials par défaut
  admin.initializeApp({
    projectId: 'smg-projet'
    // Pas de fichier JSON ici !
  });
  console.log('✅ Firebase initialisé avec succès');
} catch (error) {
  console.error('❌ Erreur initialisation Firebase:', error.message);
}

const db = admin.firestore();

// Route de test simple
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '🚀 API SMG est en ligne !',
    timestamp: new Date().toISOString()
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SMG Backend',
    version: '1.0.0',
    firebase: db ? 'connected' : 'error'
  });
});

// 📦 ROUTE : Créer un devis
app.post('/api/devis', async (req, res) => {
  try {
    const { client, services, typeProjet, estMembreClub } = req.body;

    // Vérification que Firebase est OK
    if (!db) {
      throw new Error('Base de données non disponible');
    }

    // Tableau des prix
    const prixServices = {
      mix: 15000,
      mastering: 10000,
      mixMaster: 20000,
      cover: 10000,
      coverPlus: 15000,
      photoshoot: 20000,
      identiteVisuelle: 25000,
      distributionSingle: 5000,
      distributionEP: 10000,
      distributionAlbum: 10000,
      packReseaux: 10000,
      strategieLancement: 10000,
      lyricVideo: 15000,
      pitchPlaylist: 15000,
      affiliationBBDA: 10000,
      depotBBDA: 15000,
      suiviRevenus: 10000,
      packDroits: 20000,
      audit10: 25000,
      auditComplet: 50000
    };

    let total = 0;
    if (services && Array.isArray(services)) {
      services.forEach(service => {
        if (prixServices[service]) {
          total += prixServices[service];
        }
      });
    }

    // Réduction Club SMG (-20%)
    if (estMembreClub) {
      total = total * 0.8;
    }

    total = Math.round(total);

    // Sauvegarder le devis dans Firestore
    const devisData = {
      client: client || { nom: 'Anonyme', email: '' },
      services: services || [],
      typeProjet: typeProjet || 'single',
      estMembreClub: estMembreClub || false,
      total: total,
      statut: 'en_attente',
      dateCreation: admin.firestore.FieldValue.serverTimestamp()
    };

    const devisRef = await db.collection('devis').add(devisData);

    res.json({
      success: true,
      devisId: devisRef.id,
      total: total
    });

  } catch (error) {
    console.error('❌ Erreur API devis:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Erreur lors de la création du devis'
    });
  }
});

// PORT et HOST
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Démarrage du serveur
app.listen(PORT, HOST, () => {
  console.log(`✅ Serveur SMG démarré avec succès sur ${HOST}:${PORT}`);
  console.log(`📍 Teste la route /health pour vérifier`);
});