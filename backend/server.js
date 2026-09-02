const path = require('path');
// Load master .env from project root, fallback to local backend/.env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { SuiClient } = require('@mysten/sui/client');
const { Transaction } = require('@mysten/sui/transactions');
const { fromBase64, toBase64 } = require('@mysten/sui/utils');
const deployment = require('../contracts/deployment.json');

const app = express();
const PORT = process.env.PORT || 3001;
const SUI_RPC_URL = process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';

app.use(cors());
app.use(express.json());

// ── Move abort code → human readable messages ─────────────────────────────
const MOVE_ABORT_MESSAGES = {
  100: 'Only the verified Client who deposited funds can perform this action.',
  101: 'Only the designated Lead Freelancer can submit deliverable proof.',
  102: 'This action is not valid in the current escrow status. Check that the escrow is in the correct state (e.g. DELIVERED before approving).',
  103: 'Recipient splits must add up to exactly 100% (10,000 basis points).',
  104: 'At least one recipient address is required.',
  105: 'Only the Client or Lead Freelancer (contract parties) can raise or resolve disputes.',
  106: 'Recipient address list and basis-point list must have the same length.',
  107: 'Deposit amount cannot be zero.',
};

function parseMoveAbortMessage(err) {
  const msg = err?.message || String(err);
  const match = msg.match(/abort_code[": ]+(\d+)/i) || msg.match(/MoveAbort[^,]+,\s*(\d+)/);
  if (match) {
    const code = parseInt(match[1], 10);
    return MOVE_ABORT_MESSAGES[code] || `Move error code ${code}`;
  }
  return null;
}

// ── Sui Client ─────────────────────────────────────────────────────────────
const suiClient = new SuiClient({ url: SUI_RPC_URL });

// ── Load Sponsor/Deployer Keypair ─────────────────────────────────────────
function loadSponsorKeypair() {
  if (process.env.SPONSOR_PRIVATE_KEY) {
    const raw = process.env.SPONSOR_PRIVATE_KEY.trim();
    if (raw.startsWith('suiprivkey')) {
      const { decodeSuiPrivateKey } = require('@mysten/sui/cryptography');
      const { secretKey } = decodeSuiPrivateKey(raw);
      return Ed25519Keypair.fromSecretKey(secretKey);
    }
    const decoded = fromBase64(raw);
    return Ed25519Keypair.fromSecretKey(decoded.length === 33 ? decoded.slice(1) : decoded);
  }

  const keystorePath = path.join(process.env.USERPROFILE || '', '.sui', 'sui_config', 'sui.keystore');
  if (fs.existsSync(keystorePath)) {
    const keys = JSON.parse(fs.readFileSync(keystorePath, 'utf8'));
    if (keys.length > 0) {
      const rawKey = keys[0];
      const decoded = fromBase64(rawKey);
      const secretKey = decoded.slice(1, 33);
      return Ed25519Keypair.fromSecretKey(secretKey);
    }
  }

  console.warn('[Warning] No sponsor key found; generating ephemeral keypair.');
  return new Ed25519Keypair();
}

const sponsorKeypair = loadSponsorKeypair();
const sponsorAddress = sponsorKeypair.toSuiAddress();
console.log(`[Relayer] Sponsor / Deployer: ${sponsorAddress}`);
console.log(`[Relayer] Package v2: ${deployment.packageId}`);

// ── Helper: Execute a signed transaction ─────────────────────────────────
async function executeWithSponsor(tx, signerKeypair) {
  // Fetch gas coins for sponsor
  const coins = await suiClient.getCoins({ owner: sponsorAddress, coinType: '0x2::sui::SUI', limit: 5 });
  const gasCoins = (coins?.data || []).map(c => ({
    objectId: c.coinObjectId,
    version: c.version,
    digest: c.digest,
  }));

  tx.setSenderIfNotSet(signerKeypair.toSuiAddress());
  tx.setGasOwner(sponsorAddress);
  if (gasCoins.length > 0) tx.setGasPayment(gasCoins);
  tx.setGasBudgetIfNotSet(100000000); // 0.1 SUI

  const builtBytes = await tx.build({ client: suiClient });

  // Sign as signer (the "user") and as sponsor (gas payer)
  const signerSig = await signerKeypair.signTransaction(builtBytes);
  let sponsorSig;
  if (signerKeypair.toSuiAddress() === sponsorAddress) {
    // Same keypair — only one sig needed
    sponsorSig = signerSig;
  } else {
    sponsorSig = await sponsorKeypair.signTransaction(builtBytes);
  }

  const result = await suiClient.executeTransactionBlock({
    transactionBlock: builtBytes,
    signature: signerKeypair.toSuiAddress() === sponsorAddress
      ? [signerSig.signature]
      : [signerSig.signature, sponsorSig.signature],
    options: { showEffects: true, showObjectChanges: true, showEvents: true },
  });

  return result;
}

// ── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    let gasBalance = '0';
    try {
      const coins = await suiClient.getCoins({ owner: sponsorAddress, coinType: '0x2::sui::SUI' });
      if (coins?.data) {
        const total = coins.data.reduce((acc, c) => acc + BigInt(c.balance), 0n);
        gasBalance = total.toString();
      }
    } catch (e) {}

    res.json({
      status: 'ok',
      sponsorAddress,
      packageId: deployment.packageId,
      packageIdV1: deployment.packageIdV1,
      network: deployment.network,
      gasBalanceMist: gasBalance,
      gasBalanceSui: (Number(gasBalance) / 1e9).toFixed(4),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── Core: Execute Move Function ───────────────────────────────────────────
// This is the main endpoint that wires the frontend to real on-chain calls.
// The sponsor keypair acts as BOTH user AND gas payer for demo-mode personas.
app.post('/api/execute-move', async (req, res) => {
  try {
    const { functionName, typeArgs = [], args = [] } = req.body;

    if (!functionName) {
      return res.status(400).json({ error: 'Missing functionName' });
    }

    const packageId = deployment.packageId;
    const module_ = 'escrow';

    console.log(`[Move] Calling ${module_}::${functionName} with ${args.length} args`);

    const tx = new Transaction();

    // ── Build the Move call ────────────────────────────────────────────
    if (functionName === 'create_and_deposit_entry') {
      // args: [lead_freelancer, title, recipient_addrs[], recipient_bps[], amount_mist]
      const [leadFreelancer, title, recipientAddrs, recipientBps, amountMist] = args;

      // Split SUI from gas coin to use as deposit
      const [depositCoin] = tx.splitCoins(tx.gas, [BigInt(amountMist)]);

      tx.moveCall({
        target: `${packageId}::${module_}::create_and_deposit_entry`,
        typeArguments: typeArgs.length > 0 ? typeArgs : ['0x2::sui::SUI'],
        arguments: [
          tx.pure.address(leadFreelancer),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(title))),
          tx.pure.vector('address', recipientAddrs),
          tx.pure.vector('u64', recipientBps.map(BigInt)),
          depositCoin,
        ],
      });
    } else if (functionName === 'submit_deliverable_entry') {
      const [escrowId, proofUri] = args;
      tx.moveCall({
        target: `${packageId}::${module_}::submit_deliverable_entry`,
        typeArguments: typeArgs.length > 0 ? typeArgs : ['0x2::sui::SUI'],
        arguments: [
          tx.object(escrowId),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(proofUri))),
        ],
      });
    } else if (functionName === 'approve_and_split_payout_entry') {
      const [escrowId] = args;
      tx.moveCall({
        target: `${packageId}::${module_}::approve_and_split_payout_entry`,
        typeArguments: typeArgs.length > 0 ? typeArgs : ['0x2::sui::SUI'],
        arguments: [tx.object(escrowId)],
      });
    } else if (functionName === 'refund_client_entry') {
      const [escrowId] = args;
      tx.moveCall({
        target: `${packageId}::${module_}::refund_client_entry`,
        typeArguments: typeArgs.length > 0 ? typeArgs : ['0x2::sui::SUI'],
        arguments: [tx.object(escrowId)],
      });
    } else if (functionName === 'raise_dispute_entry') {
      const [escrowId] = args;
      tx.moveCall({
        target: `${packageId}::${module_}::raise_dispute_entry`,
        typeArguments: typeArgs.length > 0 ? typeArgs : ['0x2::sui::SUI'],
        arguments: [tx.object(escrowId)],
      });
    } else if (functionName === 'agree_to_release_entry') {
      const [escrowId] = args;
      tx.moveCall({
        target: `${packageId}::${module_}::agree_to_release_entry`,
        typeArguments: typeArgs.length > 0 ? typeArgs : ['0x2::sui::SUI'],
        arguments: [tx.object(escrowId)],
      });
    } else {
      return res.status(400).json({ error: `Unknown function: ${functionName}` });
    }

    // All demo operations use the sponsor keypair as the signer (it IS Alice/deployer)
    const result = await executeWithSponsor(tx, sponsorKeypair);

    const digest = result.digest;
    const status = result.effects?.status?.status;

    if (status !== 'success') {
      const errMsg = result.effects?.status?.error || 'Transaction failed on Sui Testnet';
      return res.status(500).json({ error: errMsg });
    }

    // For create_and_deposit: extract the created shared object ID
    let createdObjectId = null;
    if (result.objectChanges) {
      const shared = result.objectChanges.find(
        c => c.type === 'created' && c.owner === 'Shared'
      );
      if (shared) createdObjectId = shared.objectId;
    }

    console.log(`[Move] ✅ ${functionName} succeeded. Digest: ${digest}`);

    res.json({ digest, createdObjectId, status: 'success' });
  } catch (error) {
    console.error('[Move Error]:', error);

    // Try to parse Move abort code for human-readable message
    const moveMsg = parseMoveAbortMessage(error);
    res.status(500).json({
      error: moveMsg || error.message,
      rawError: error.message,
    });
  }
});

// ── Sponsor Transaction (legacy endpoint for PTB flow) ────────────────────
app.post('/api/sponsor-transaction', async (req, res) => {
  try {
    const { txBytes, sender } = req.body;
    if (!txBytes || !sender) {
      return res.status(400).json({ error: 'Missing txBytes or sender' });
    }

    const bytes = typeof txBytes === 'string' ? fromBase64(txBytes) : new Uint8Array(txBytes);
    const tx = Transaction.from(bytes);
    tx.setSenderIfNotSet(sender);
    tx.setGasOwner(sponsorAddress);

    let gasCoins = [];
    try {
      const coins = await suiClient.getCoins({ owner: sponsorAddress, coinType: '0x2::sui::SUI', limit: 5 });
      if (coins?.data?.length > 0) {
        gasCoins = coins.data.map(c => ({ objectId: c.coinObjectId, version: c.version, digest: c.digest }));
      }
    } catch (e) {}

    if (gasCoins.length > 0) tx.setGasPayment(gasCoins);
    tx.setGasBudgetIfNotSet(100000000);

    const builtBytes = await tx.build({ client: suiClient });
    const sponsorSignature = await sponsorKeypair.signTransaction(builtBytes);

    res.json({
      sponsorAddress,
      sponsorSignature: sponsorSignature.signature,
      txBytes: toBase64(builtBytes),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Faucet Helper ─────────────────────────────────────────────────────────
app.post('/api/faucet', async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Missing recipient address' });

    console.log(`[Faucet] Requesting testnet SUI for: ${address}`);
    const faucetRes = await fetch('https://faucet.testnet.sui.io/v1/gas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ FixedAmountRequest: { recipient: address } }),
    });

    const data = await faucetRes.text();
    res.json({ success: faucetRes.ok, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get Object State (for sync) ───────────────────────────────────────────
app.get('/api/object/:objectId', async (req, res) => {
  try {
    const { objectId } = req.params;
    const obj = await suiClient.getObject({ id: objectId, options: { showContent: true, showType: true } });
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 SuiPact Gas Relayer + Move Executor on http://localhost:${PORT}`);
  console.log(`   Sponsor: ${sponsorAddress}`);
  console.log(`   Package v2: ${deployment.packageId}`);
});
