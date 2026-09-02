const path = require('path');
const { execSync } = require('child_process');

const binDir = path.join(process.env.USERPROFILE, '.sui', 'bin');
const suiExe = path.join(binDir, 'sui.exe');

async function getGasObjects(address) {
  try {
    const res = execSync(`"${suiExe}" client gas --json`, { encoding: 'utf-8' });
    return JSON.parse(res);
  } catch (e) {
    return [];
  }
}

async function requestTestnetFaucet(address) {
  console.log(`[Faucet] Requesting testnet SUI for address: ${address}...`);
  const payload = JSON.stringify({
    FixedAmountRequest: {
      recipient: address
    }
  });

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch('https://faucet.testnet.sui.io/v1/gas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });

      const data = await res.text();
      console.log(`[Faucet] Attempt ${attempt} (Status ${res.status}): ${data}`);

      if (res.ok) {
        console.log('[Faucet] SUI tokens successfully credited!');
        return true;
      }

      if (res.status === 429) {
        // Extract wait seconds if available
        const match = data.match(/Wait for (\d+)s/);
        const waitSec = match ? parseInt(match[1], 10) + 2 : 20;
        console.log(`[Faucet] Rate limit reached. Waiting ${waitSec}s...`);
        await new Promise(r => setTimeout(r, waitSec * 1000));
      } else {
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (err) {
      console.error('[Faucet] Error connecting to faucet:', err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  return false;
}

module.exports = { requestTestnetFaucet, getGasObjects };

if (require.main === module) {
  const addr = process.argv[2] || '0xaf39410b7ef60d0de77312789647ca1a9989784229b275d5a7866e4a610e7771';
  requestTestnetFaucet(addr).then(() => {
    const gas = getGasObjects(addr);
    console.log('[Faucet] Current Gas Objects:\n', gas);
  });
}
