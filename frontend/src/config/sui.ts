export const SUI_CONFIG = {
  network: process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet',
  rpcUrl: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
  graphqlUrl: process.env.NEXT_PUBLIC_SUI_GRAPHQL_URL || 'https://sui-testnet.mystenlabs.com/graphql',
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '0x8c57edf140ac229fb7e11652e8d9dcded7fd63dda683adfd7fd9c5bed1db5a18',
  packageIdV1: process.env.NEXT_PUBLIC_PACKAGE_ID_V1 || '0x86edb7211b5b15566739b5a0ae689a669c590a7b0580cbf967c8fd1bc828f1a1',
  moduleName: 'escrow',
  upgradeCapId: process.env.NEXT_PUBLIC_UPGRADE_CAP_ID || '0x377bfe72994ed7f9816118ba012f200b0aacee9c5a2c8b39a949ed7e679fbb11',
  publishTxDigest: process.env.NEXT_PUBLIC_PUBLISH_TX_DIGEST || '3teRC52TQvDgh9YAVmmoDJvQqMtgUzzpnJgA5QqtQTYf',
  upgradeTxDigest: process.env.NEXT_PUBLIC_UPGRADE_TX_DIGEST || '9yJyrnivjB7LfTgQUobfooZoXezAuTkRp2g761VX537p',
  sponsorAddress: process.env.NEXT_PUBLIC_SPONSOR_ADDRESS || '0xaf39410b7ef60d0de77312789647ca1a9989784229b275d5a7866e4a610e7771',
  relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:3001',
  testnetUsdcType: process.env.NEXT_PUBLIC_TESTNET_USDC_TYPE || '0xa1ec7fc00a6f40db9693ad1415d880f9879785369065b2370007891866ad34a2::wusdc::WUSDC',
  basisPointsTotal: 10000,
};

export const STATUS_CODES = {
  LOCKED: 0,
  DELIVERED: 1,
  RELEASED: 2,
  REFUNDED: 3,
  DISPUTED: 4,
} as const;

export const STATUS_LABELS: Record<number, { label: string; color: string; bg: string; border: string }> = {
  0: { label: 'Locked in Escrow', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  1: { label: 'Deliverable Submitted', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  2: { label: 'Released & Settled', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  3: { label: 'Refunded to Client', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
  4: { label: 'In Dispute', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
};

export function getSuiScanTxUrl(digest: string) {
  return `https://suiscan.xyz/testnet/tx/${digest}`;
}

export function getSuiScanObjectUrl(objectId: string) {
  return `https://suiscan.xyz/testnet/object/${objectId}`;
}

export function getSuiVisionPackageUrl(packageId: string = SUI_CONFIG.packageId) {
  return `https://testnet.suivision.xyz/package/${packageId}`;
}

export function getSuiScanAddressUrl(address: string) {
  return `https://suiscan.xyz/testnet/account/${address}`;
}
