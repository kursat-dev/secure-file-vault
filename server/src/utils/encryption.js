import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Encrypt data with a specific key
const encrypt = (buffer, key) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return { encrypted, iv, authTag };
};

// Decrypt data with a specific key
const decrypt = (encryptedBuffer, key, iv, authTag) => {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
};

export const encryptFile = (fileBuffer, masterKeyHex) => {
    // Generate a random DEK (Data Encryption Key) for this file
    const fileKey = crypto.randomBytes(32);

    // Encrypt the file content with the DEK
    const { encrypted: encryptedContent, iv: fileIv, authTag: fileAuthTag } = encrypt(fileBuffer, fileKey);

    // Encrypt the DEK with the Master Key
    const masterKey = Buffer.from(masterKeyHex, 'hex');
    const { encrypted: encryptedKey, iv: keyIv, authTag: keyAuthTag } = encrypt(fileKey, masterKey);

    // Return everything needed to decrypt, plus the encrypted key wrappers
    // We need to store: fileIv, fileAuthTag, encryptedKey, keyIv, keyAuthTag
    // To simplify storage in DB, we can combine keyIv+keyAuthTag+encryptedKey into one string or store separately.
    // The prisma schema has `encryptedKey`, `iv`, `authTag`.
    // `iv` and `authTag` in schema likely refer to the FILE encryption.
    // We need to store the DEK encryption metadata too.
    // Let's pack the DEK metadata into the `encryptedKey` field in format: iv:authTag:encryptedKey (hex encoded)

    const packedEncryptedKey = `${keyIv.toString('hex')}:${keyAuthTag.toString('hex')}:${encryptedKey.toString('hex')}`;

    return {
        encryptedContent,
        iv: fileIv.toString('hex'),
        authTag: fileAuthTag.toString('hex'),
        encryptedKey: packedEncryptedKey
    };
};

export const decryptFile = (encryptedContent, fileIvHex, fileAuthTagHex, packedEncryptedKey, masterKeyHex) => {
    const masterKey = Buffer.from(masterKeyHex, 'hex');

    // Unpack encrypted key
    const [keyIvHex, keyAuthTagHex, encryptedKeyHex] = packedEncryptedKey.split(':');

    const keyIv = Buffer.from(keyIvHex, 'hex');
    const keyAuthTag = Buffer.from(keyAuthTagHex, 'hex');
    const encryptedKey = Buffer.from(encryptedKeyHex, 'hex');

    // Decrypt the DEK
    const fileKey = decrypt(encryptedKey, masterKey, keyIv, keyAuthTag);

    // Decrypt the file content
    const fileIv = Buffer.from(fileIvHex, 'hex');
    const fileAuthTag = Buffer.from(fileAuthTagHex, 'hex');

    return decrypt(encryptedContent, fileKey, fileIv, fileAuthTag);
};
