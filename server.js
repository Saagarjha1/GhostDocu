const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

dotenv.config();

// Route Imports
const authRoutes = require('./routes/authRoute');
const fileRoutes = require('./routes/FileRoute');
const dashboardRoutes = require('./routes/dashboardRoute');
const adminRoutes = require('./routes/adminRoute');

// Initialize express app
const app = express();

// // 🚨 Security Middleware
// app.use(helmet());                  // Set secure HTTP headers
// app.use(xss());                     // Sanitize user input from XSS
// app.use(mongoSanitize());          // Prevent NoSQL injections
// app.use(cors());                   // Enable CORS
// app.use(morgan('dev'));            // Logger

// // 📉 Rate Limiting for auth routes
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 min
//   max: 20,                  // limit each IP to 20 requests per windowMs
//   message: 'Too many requests. Try again later.',
// });
// app.use('/api/auth', authLimiter);

// // ⛔ Optional: Enforce HTTPS in production
// if (process.env.NODE_ENV === 'production') {
//   app.use((req, res, next) => {
//     if (req.headers['x-forwarded-proto'] !== 'https') {
//       return res.redirect(`https://${req.headers.host}${req.url}`);
//     }
//     next();
//   });
// }

// 📦 Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔗 Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// 🌐 Root Route
app.get('/', (req, res) => {
  res.send('📄 GhostDocu Backend is running securely!');
});

// 🔁 Start Cron Jobs
const autoExpireFiles = require('./utils/autoExpireFiles');
autoExpireFiles(); // Run daily cleanup

// 🔌 Connect to DB & Start Server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
  });
