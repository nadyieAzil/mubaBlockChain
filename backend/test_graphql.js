const { SuiGraphQLClient } = require('@mysten/sui/graphql');
const { graphql } = require('@mysten/sui/graphql/schemas/2024.4');

async function testGraphQL() {
  const gqlClient = new SuiGraphQLClient({
    url: 'https://sui-testnet.mystenlabs.com/graphql',
  });

  const query = graphql(`
    query getAddressBalance($address: SuiAddress!) {
      address(address: $address) {
        balance(type: "0x2::sui::SUI") {
          totalBalance
          coinObjectCount
        }
      }
    }
  `);

  try {
    const result = await gqlClient.query({
      query,
      variables: {
        address: '0xaf39410b7ef60d0de77312789647ca1a9989784229b275d5a7866e4a610e7771',
      },
    });
    console.log('GraphQL query successful! Result:', JSON.stringify(result.data, null, 2));
  } catch (err) {
    console.error('GraphQL query failed:', err.message);
  }
}

testGraphQL();
