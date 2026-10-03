const { Client, PrivateKey, TransferTransaction, Hbar } = require("@hashgraph/sdk");

async function main() {
  const accountId = "0.0.10840712";
  const ecdsaKeyStr = "45f69fc3cfc5f6cbb382507a0c37ea161f95db95a63f008245eb94c2c2e6aa92";
  
  const key = PrivateKey.fromStringECDSA(ecdsaKeyStr);
  const client = Client.forTestnet();
  client.setOperator(accountId, key);

  console.log("Sending 1 tinybar to self to trigger Hashio EVM indexing...");
  
  const tx = new TransferTransaction()
    .addHbarTransfer(accountId, Hbar.fromTinybars(-1))
    .addHbarTransfer("0.0.3", Hbar.fromTinybars(1))
    .freezeWith(client);
    
  const txResponse = await tx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  
  console.log(`Transaction Status: ${receipt.status.toString()}`);
  console.log("Wait ~10 seconds for mirror node propagation before deploying.");
  process.exit(0);
}

main().catch(console.error);
