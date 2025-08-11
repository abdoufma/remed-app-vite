import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import base32 from 'hi-base32';

const key = randomBytes(16);
console.log('Secret key (hex):', key.toString('hex'));

function createLicense(name, expiryMonth, freeItems, licenseType) {
  // pack to 20 bytes: name(16) + expiry(2) + freeItems(1) + licenseType(1)
  const nameBytes = Buffer.alloc(16);
  nameBytes.write(name, 0, 'utf8');
  const expiryBuf = Buffer.alloc(2);
  expiryBuf.writeUInt16BE(expiryMonth);
  const freeItemsByte = Buffer.from([freeItems]);
  const licenseTypeByte = Buffer.from([licenseType]);

  const data = Buffer.concat([nameBytes, expiryBuf, freeItemsByte, licenseTypeByte]);
  if (data.length !== 20) throw new Error('Wrong packed size');

  const iv = Buffer.alloc(16, 0); // fixed IV just to keep things reproducible
  const cipher = createCipheriv('aes-128-ctr', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]); // 20 bytes

  const license = base32.encode(encrypted).replace(/=+$/, '').toUpperCase();
  if (license.length !== 32) throw new Error('Unexpected license length');

  return license;
}

function decodeLicense(licenseStr) {
  const encrypted = Buffer.from(base32.decode.asBytes(licenseStr));
  console.log('Encrypted length:', encrypted.length);
  if (encrypted.length !== 20) throw new Error('Encrypted length wrong');

  const iv = Buffer.alloc(16, 0);
  const decipher = createDecipheriv('aes-128-ctr', key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  const name = decrypted.subarray(0, 16).toString('utf8').replace(/\0+$/, '');
  const expiryMonth = decrypted.readUInt16BE(16);
  const freeItems = decrypted.readUInt8(18);
  const licenseType = decrypted.readUInt8(19);

  console.log('✅ Decoded:', { name, expiryMonth, freeItems, licenseType });
}

// demo
const license = createLicense('BenbadaAbdesslam', 2508, 255, 2);
console.log('\nGenerated license:', license, '(length:', license.length, ')');
decodeLicense(license);


const license2 = createLicense('BenbadaAbdeslam', 2508, 258, 2);
console.log('\nGenerated license:', license2, '(length:', license2.length, ')');
decodeLicense(license2);

console.log("Licenses", license === license2 ? "match" : "do NOT match");
