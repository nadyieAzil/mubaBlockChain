const fs = require('fs');
const path = require('path');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { Transaction } = require('@mysten/sui/transactions');
const { fromBase64, toBase64 } = require('@mysten/sui/utils');

function getSponsorKeypair() {
  if (process.env.SPONSOR_PRIVATE_KEY) {
    const raw = process.env.SPONSOR_PRIVATE_KEY.trim();
    if (raw.startsWith('suiprivkey')) {
      const { decodeSuiPrivateKey } = require('@mysten/sui/cryptography');
      const { secretKey } = decodeSuiPrivateKey(raw);
      return Ed25519Keypair.fromSecretKey(secretKey);
    }
    const secretKey = fromBase64(raw);
    return Ed25519Keypair.fromSecretKey(secretKey.slice(1)); // strip 1-byte scheme flag if present
  }

  // Fallback to local ~/.sui/sui_config/sui.keystore
  const keystorePath = path.join(process.env.USERPROFILE, '.sui', 'sui_config', 'sui.keystore');
  if (fs.existsSync(keystorePath)) {
    const keys = JSON.parse(fs.readFileSync(keystorePath, 'utf8'));
    if (keys.length > 0) {
      const rawKey = keys[0];
      const decoded = fromBase64(rawKey);
      // Sui keystore keys start with 1 byte scheme (0 = ed25519) + 32 bytes secret key
      const secretKey = decoded.slice(1, 33);
      return Ed25519Keypair.fromSecretKey(secretKey);
    }
  }

  // Generate ephemeral dev keypair if none exists
  console.warn('[Sponsor] No keypair found in keystore or env; generating new ephemeral keypair.');
  return new Ed25519Keypair();
}

const keypair = getSponsorKeypair();
const address = keypair.toSuiAddress();
console.log('Sponsor Address:', address);

const client = new SuiClient({ url: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443' });
client.getBalance({ owner: address }).then(bal => {
  console.log('Sponsor SUI Balance:', bal.totalBalance, 'Mist (', Number(bal.totalBalance) / 1e9, 'SUI)');
}).catch(err => {
  console.error('Balance check error:', err.message);
});
