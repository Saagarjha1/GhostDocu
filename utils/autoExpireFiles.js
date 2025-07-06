// cron/cleanupExpiredFiles.js
const cron = require('node-cron');
const File = require('../Models/File');
const fs = require('fs');
const path = require('path');

// Auto-expire files daily
const cleanupExpiredFiles = () => {
  // 🕛 Every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('🧹 [Cron Job] Running cleanup job...');
    const now = new Date();

    try {
      // Get files with expiresInDays set
      const files = await File.find({ expiresInDays: { $exists: true } });

      for (const file of files) {
        const fileAgeInDays = (now - file.createdAt) / (1000 * 60 * 60 * 24);

        if (fileAgeInDays >= file.expiresInDays) {
          // Delete file from disk
          const filePath = path.resolve(file.path); // normalize path
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted file from disk: ${filePath}`);
          }

          // Delete from MongoDB
          await File.deleteOne({ _id: file._id });
          console.log(`❌ Removed file from DB: ${file._id}`);
        }
      }
    } catch (error) {
      console.error('⚠️ Error during cron cleanup:', error);
    }
  });
};

module.exports = cleanupExpiredFiles;
