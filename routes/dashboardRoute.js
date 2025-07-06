const express = require('express');
const router = express.Router();
const File = require('../Models/File');
const { jwtAuthMiddleware } = require('../middleware/jwt');

// ✅ 1. List user-uploaded files
router.get('/files', jwtAuthMiddleware, async (req, res) => {
  try {
    const files = await File.find({ uploadedBy: req.user.id }).select('-path -__v');
    res.status(200).json({ files });
  } catch (err) {
    console.error('Fetch files error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ❌ 2. Delete a file manually
router.delete('/files/:fileId', jwtAuthMiddleware, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.fileId, uploadedBy: req.user.id });
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Optionally delete from disk
    const fs = require('fs');
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await file.deleteOne();
    res.status(200).json({ message: 'File deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ⚙️ 3. Update expiration settings
router.put('/files/:fileId', jwtAuthMiddleware, async (req, res) => {
  try {
    const { expiresAt, downloadLimit } = req.body;
    const file = await File.findOne({ _id: req.params.fileId, uploadedBy: req.user.id });
    if (!file) return res.status(404).json({ error: 'File not found' });

    if (expiresAt) file.expiresAt = new Date(expiresAt);
    if (downloadLimit !== undefined) file.downloadLimit = downloadLimit;

    await file.save();
    res.status(200).json({ message: 'Expiration settings updated' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
