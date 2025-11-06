const crypto = require('crypto');

// Generate a random secret key
const generateSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

console.log('Generated JWT Secret:');
console.log(generateSecret());
console.log('\nCopy this to your .env file as JWT_SECRET=');