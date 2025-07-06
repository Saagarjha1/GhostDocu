const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { encryptFile } = require('../utils/encryptFile');
const { decryptFile } = require('../utils/decryptFile');
const AccessLog = require('../Models/AccessLog');
const File = require('../Models/File');
const bcrypt = require('bcrypt');
const { jwtAuthMiddleware } = require('../middleware/jwt');
const crypto = require('crypto');
const fs = require('fs');
const requestIp = require('request-ip');
const geoip = require('geoip-lite');

// 📂 Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// 📤 Upload & encrypt file
router.post('/upload', jwtAuthMiddleware, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const token = crypto.randomBytes(16).toString('hex');
    const encryptedPath = path.join(file.destination, 'enc-' + file.filename);

    await encryptFile(file.path, encryptedPath);
    fs.unlinkSync(file.path); // Delete original unencrypted file

    let hashedPassword = null;
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(req.body.password, salt);
    }

    const fileDoc = new File({
      filename: 'enc-' + file.filename,
      originalname: file.originalname,
      token,
      path: encryptedPath,
      password: hashedPassword,
      uploadedBy: req.user.id,
    });

    await fileDoc.save();
    res.status(201).json({ message: 'File uploaded & encrypted', token });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// 🔓 Download & decrypt file
router.get('/:token', async (req, res) => {
  try {
    const fileDoc = await File.findOne({ token: req.params.token });
    if (!fileDoc) return res.status(404).json({ error: 'File not found' });

    const decryptedDir = path.join(__dirname, '..', 'decrypted');
    if (!fs.existsSync(decryptedDir)) fs.mkdirSync(decryptedDir);

    const decryptedPath = path.join(decryptedDir, 'dec-' + Date.now() + '-' + fileDoc.originalname);
    await decryptFile(fileDoc.path, decryptedPath);

    // 🌍 Get IP and geolocation
    const clientIp = requestIp.getClientIp(req) || req.ip;
    const geo = geoip.lookup(clientIp);

    await AccessLog.create({
      fileId: fileDoc._id,
      ip: clientIp,
      userAgent: req.headers['user-agent'],
      accessedBy: req.user ? req.user.id : null,
      location: geo
        ? {
            country: geo.country,
            region: geo.region,
            city: geo.city,
          }
        : {},
    });

    res.download(decryptedPath, fileDoc.originalname, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlinkSync(decryptedPath); // Cleanup
    });
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'File access failed' });
  }
});

// 📜 Get access logs
router.get('/:token/logs', jwtAuthMiddleware, async (req, res) => {
  try {
    const file = await File.findOne({ token: req.params.token });
    if (!file) return res.status(404).json({ error: 'File not found' });

    if (file.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const logs = await AccessLog.find({ fileId: file._id }).populate('accessedBy', 'email');
    res.status(200).json({ logs });
  } catch (err) {
    console.error('Log fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔐 Verify password
router.post('/:token/verify', async (req, res) => {
  try {
    const file = await File.findOne({ token: req.params.token });
    if (!file) return res.status(404).json({ error: 'File not found' });

    if (!file.password) return res.status(200).json({ verified: true });

    const { password } = req.body;
    const isMatch = await bcrypt.compare(password, file.password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect password' });

    res.status(200).json({ verified: true });
  } catch (err) {
    console.error('Password verify error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
