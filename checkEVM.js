const getEvm = async (id) => {
  let res = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${id}`);
  if(res.ok) {
    let data = await res.json();
    return data.evm_address;
  }
  res = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/contracts/${id}`);
  if (res.ok) {
    let data = await res.json();
    return data.evm_address;
  }
  res = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/tokens/${id}`);
  if (res.ok) {
    let data = await res.json();
    // Tokens often have their contract_id as evm_address if native HTS token
    // or just return the padded address
    return "0x" + BigInt(id.split('.')[2]).toString(16).padStart(40, '0');
  }
  return null;
};

async function run() {
  console.log('Router (0.0.19264) EVM:', await getEvm('0.0.19264'));
  console.log('WHBAR (0.0.15058) EVM:', await getEvm('0.0.15058'));
  console.log('USDC (0.0.5449) EVM:', await getEvm('0.0.5449'));
}
run();
