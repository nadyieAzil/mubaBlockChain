const { SuiClient } = require('@mysten/sui/client');

async function testEndpoints() {
  const urls = [
    'https://fullnode.testnet.sui.io:443',
    'https://sui-testnet-endpoint.blockvision.org',
    'https://testnet.sui.rpcpool.com'
  ];

  for (const url of urls) {
    try {
      console.log('Testing RPC url:', url);
      const client = new SuiClient({ url });
      const version = await client.getRpcApiVersion();
      console.log('API Version on', url, ':', version);
      const bal = await client.getBalance({ owner: '0xaf39410b7ef60d0de77312789647ca1a9989784229b275d5a7866e4a610e7771' });
      console.log('Balance result on', url, ':', bal);
      return url;
    } catch (e) {
      console.log('Failed on', url, ':', e.message);
    }
  }
}

testEndpoints();
