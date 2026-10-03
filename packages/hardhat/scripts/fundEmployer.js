const { Client, PrivateKey, TransferTransaction, Hbar, AccountId } = require("@hashgraph/sdk");

async function main() {
  const operatorId = "0.0.10469716";
  const operatorKey = PrivateKey.fromString(
    "3030020100300706052b8104000a0422042057d682aa720093afb0bd5a3bfe3dcf639d76bc32bf3d9e617231aa42a6d56c7a",
  );

  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);

  console.log("Funding the employer ECDSA alias...");
  const evmAddress = "0x158788c1eF292614DA4D71D632e72A0e09154254";
  const aliasAccountId = AccountId.fromEvmAddress(0, 0, evmAddress);

  const tx = new TransferTransaction()
    .addHbarTransfer(operatorId, Hbar.from(-100))
    .addHbarTransfer(aliasAccountId, Hbar.from(100));

  const txResponse = await tx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  console.log(`Funded! Account ID: ${receipt.accountId ? receipt.accountId.toString() : "Hollow"}`);
  process.exit(0);
}

main().catch(console.error);
