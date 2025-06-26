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

// ✅ Initialize Google Vision client with secure credentials
const client = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }
});

// Connect to MongoDB
connectDB();

// ✅ CORS Setup
const allowedOrigins = [
  'https://ns-client-henna.vercel.app',  // Vercel frontend
  'http://localhost:3000'                // Local testing
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

// ✅ Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadDir));

// ✅ Attach Vision client to request object for analysis routes
app.use('/api/analysis', (req, res, next) => {
  req.visionClient = client;
  next();
}, analysisRoutes);

app.use('/api/bmi', bmiRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('✅ NutriScan API is running...');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📂 Uploads directory: ${uploadDir}`);
});
