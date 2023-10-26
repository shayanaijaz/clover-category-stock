const crypto = require('crypto');

const generateEncryptionKeys = () => {

    const encryptionKey = crypto.randomBytes(32).toString('hex');
    const iv = crypto.randomBytes(16).toString('hex');

    console.log('Encryption Key (hex):', encryptionKey);
    console.log('Initialization Vector (IV, hex):', iv);
}

// generateEncryptionKeys();

export const encryptToken = (token) => {
    const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(process.env.INIT_VECTOR, 'hex');
        
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  
    let encryptedToken = cipher.update(token, 'utf-8', 'hex');
    encryptedToken += cipher.final('hex');
  
    return encryptedToken;
}

export const decryptToken = (token) => {
    const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(process.env.INIT_VECTOR, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);

    let decryptedToken = decipher.update(token, 'hex', 'utf-8');
    decryptedToken += decipher.final('utf-8');

    return decryptedToken;
}