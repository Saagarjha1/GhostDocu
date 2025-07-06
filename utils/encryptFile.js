// utils/encryptFile.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const algorithm = 'aes-256-cbc';
const SECRET_KEY = process.env.SECRET_KEY; // Must be 32 bytes for AES-256
const IV_LENGTH = 16;

// 🔒 Encrypts a file and saves it to `encryptedPath`
function encryptFile(inputPath, encryptedPath) {
  return new Promise((resolve, reject) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(SECRET_KEY, 'hex'); // Ensure SECRET_KEY is 64 hex chars (32 bytes)

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(encryptedPath);

    // Write IV at the beginning of the encrypted file
    output.write(iv);

    input.pipe(cipher).pipe(output);

    output.on('finish', () => resolve(true));
    output.on('error', reject);
    input.on('error', reject);
  });
}

module.exports = { encryptFile };
