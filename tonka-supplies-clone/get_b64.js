const fs = require('fs');
const b64 = fs.readFileSync('assets/logo.png', { encoding: 'base64' });
fs.writeFileSync('base64_logo.txt', b64);
