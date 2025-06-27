require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const analysisRoutes = require('./routes/analysisRoutes');
const bmiRoutes = require('./routes/bmiRoutes');
const path = require('path');
const fs = require('fs');
const vision = require('@google-cloud/vision');

const app = express();

const credentialsPath = path.join(__dirname, 'config', 'google-credentials.json');

// ✅ Reconstruct credentials file from environment variable
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  fs.mkdirSync(path.dirname(credentialsPath), { recursive: true });
  fs.writeFileSync(credentialsPath, process.env.GOOGLE_CREDENTIALS_JSON);
  console.log('✅ Google credentials file written at:', credentialsPath);
} else {
  console.error('❌ GOOGLE_CREDENTIALS_JSON is missing. Vision API will fail.');
}

// ✅ Initialize Google Vision client with key file
const client = new vision.ImageAnnotatorClient({
  keyFilename: credentialsPath
});

connectDB();

const allowedOrigins = [
  'https://ns-client-henna.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', express.static(uploadDir));

app.use('/api/analysis', (req, res, next) => {
  req.visionClient = client;
  next();
}, analysisRoutes);

app.use('/api/bmi', bmiRoutes);

app.get('/', (req, res) => {
  res.send('✅ NutriScan API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📂 Uploads directory: ${uploadDir}`);
});
