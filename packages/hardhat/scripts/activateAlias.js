const { Client, PrivateKey, TransferTransaction, Hbar, AccountId } = require("@hashgraph/sdk");

async function main() {
  const operatorId = "0.0.10469716";
  const operatorKey = PrivateKey.fromString("3030020100300706052b8104000a0422042057d682aa720093afb0bd5a3bfe3dcf639d76bc32bf3d9e617231aa42a6d56c7a");

  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);

  console.log("Transferring 10 HBAR to the ECDSA alias address to activate it for EVM...");
  // Ethers derived address: 0x158788c1eF292614DA4D71D632e72A0e09154254
  const evmAddress = "0x158788c1eF292614DA4D71D632e72A0e09154254";
  const aliasAccountId = AccountId.fromEvmAddress(0, 0, evmAddress);

  const tx = new TransferTransaction()
    .addHbarTransfer(operatorId, Hbar.from(-10))
    .addHbarTransfer(aliasAccountId, Hbar.from(10));

  const txResponse = await tx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  
  console.log(`Success! Sent to alias account ID: ${receipt.accountId ? receipt.accountId.toString() : "Hollow Account created"}`);
  process.exit(0);
}

main().catch(console.error);
