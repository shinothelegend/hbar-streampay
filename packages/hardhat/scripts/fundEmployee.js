const { Client, PrivateKey, TransferTransaction, Hbar, AccountId } = require("@hashgraph/sdk");

async function main() {
  const operatorId = "0.0.10469716";
  const operatorKey = PrivateKey.fromString("3030020100300706052b8104000a0422042057d682aa720093afb0bd5a3bfe3dcf639d76bc32bf3d9e617231aa42a6d56c7a");

  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);

  console.log("Funding the employee ECDSA alias...");
  const employeeEvmAddress = "0x29Dd2f9bFC91c432366c5F2cdC4Bff54d23d7550";
  const aliasAccountId = AccountId.fromEvmAddress(0, 0, employeeEvmAddress);

  const tx = new TransferTransaction()
    .addHbarTransfer(operatorId, Hbar.from(-20))
    .addHbarTransfer(aliasAccountId, Hbar.from(20));

  const txResponse = await tx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  console.log(`Funded Employee! Account ID: ${receipt.accountId ? receipt.accountId.toString() : "Hollow"}`);
  process.exit(0);
}

main().catch(console.error);
