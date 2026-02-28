const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialisation de Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

// PORT - Une seule déclaration !
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Route de test
app.get('/', (req, res) => {
  res.json({ message: '🚀 API SMG fonctionne !' });
});

// 📦 ROUTE : Créer un devis
app.post('/api/devis', async (req, res) => {
  try {
    const { client, services, typeProjet, estMembreClub } = req.body;
    
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
    services.forEach(service => {
      if (prixServices[service]) {
        total += prixServices[service];
      }
    });
    
    // Réduction Club SMG (-20%)
    if (estMembreClub) {
      total = total * 0.8;
    }
    
    total = Math.round(total);
    
    // Sauvegarder le devis dans Firestore
    const devisRef = await db.collection('devis').add({
      client: client,
      services: services,
      typeProjet: typeProjet,
      estMembreClub: estMembreClub,
      total: total,
      statut: 'en_attente',
      dateCreation: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ 
      success: true, 
      devisId: devisRef.id,
      total: total
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Écoute du serveur sur 0.0.0.0 (obligatoire pour Railway)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur SMG démarré sur le port ${PORT} (écoute sur 0.0.0.0)`);
});