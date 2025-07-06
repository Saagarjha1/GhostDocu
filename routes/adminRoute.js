const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const File = require('../Models/File');
const fs = require('fs');
const { jwtAuthMiddleware } = require('../middleware/jwt');
const rbac = require('../middleware/rbac');

// 📋 GET all users (Admin Only)
router.get('/users', jwtAuthMiddleware, rbac(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 📦 GET all uploaded files (Admin Only)
router.get('/files', jwtAuthMiddleware, rbac(['admin']), async (req, res) => {
  try {
    const files = await File.find().select('-__v');
    res.status(200).json({ files });
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// 🗑️ DELETE a file by ID (Admin Only)
router.delete('/files/:fileId', jwtAuthMiddleware, rbac(['admin']), async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Remove from disk if exists
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await file.deleteOne();
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// ⚙️ UPDATE file expiration settings (Admin Only)
router.put('/files/:fileId', jwtAuthMiddleware, rbac(['admin']), async (req, res) => {
  try {
    const { expiresAt, downloadLimit } = req.body;

    const file = await File.findById(req.params.fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    if (expiresAt) file.expiresAt = new Date(expiresAt);
    if (downloadLimit !== undefined) file.downloadLimit = downloadLimit;

    await file.save();
    res.status(200).json({ message: 'File updated successfully' });
  } catch (err) {
    console.error('Error updating file:', err);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

module.exports = router;
