// utils/decryptFile.js
const crypto = require('crypto');
const fs = require('fs');

const algorithm = 'aes-256-cbc';
const SECRET_KEY = process.env.SECRET_KEY;
const IV_LENGTH = 16;

function decryptFile(encryptedPath, outputPath) {
  return new Promise((resolve, reject) => {
    const key = Buffer.from(SECRET_KEY, 'hex');

    const input = fs.createReadStream(encryptedPath, { start: 0 });

    // Read the IV from the beginning of the encrypted file
    let iv;
    input.once('readable', () => {
      iv = input.read(IV_LENGTH);
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      const output = fs.createWriteStream(outputPath);
      input.pipe(decipher).pipe(output);

      output.on('finish', () => resolve(true));
      output.on('error', reject);
    });

    input.on('error', reject);
  });
}

module.exports = { decryptFile };
