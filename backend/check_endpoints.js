async function checkUrls() {
  const endpoints = [
    'https://sui-testnet.mystenlabs.com/graphql',
    'https://testnet.sui.io/graphql',
    'https://fullnode.testnet.sui.io:443',
    'https://sui-testnet.nodeinfra.com',
    'https://sui-testnet-rpc.allthatnode.com',
    'https://sui-testnet.public.blastapi.io'
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'sui_getChainIdentifier', params: [] })
      });
      const data = await res.text();
      console.log(`Endpoint: ${url} -> Status ${res.status}:`, data.slice(0, 120));
    } catch (e) {
      console.log(`Endpoint: ${url} -> Error:`, e.message);
    }
  }
}

checkUrls();
