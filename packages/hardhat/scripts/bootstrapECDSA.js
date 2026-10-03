const { Client, PrivateKey, AccountCreateTransaction, Hbar } = require("@hashgraph/sdk");

async function main() {
  try {
    const operatorId = "0.0.10469716";
    // Using fromString() handles DER and raw prefixes automatically
    const operatorKey = PrivateKey.fromString("3030020100300706052b8104000a0422042057d682aa720093afb0bd5a3bfe3dcf639d76bc32bf3d9e617231aa42a6d56c7a");

    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    console.log("Operator balance...");
    
    // Create new ECDSA account
    const newKey = PrivateKey.generateECDSA();
    console.log("New ECDSA Private Key:", newKey.toStringRaw());

    const transaction = new AccountCreateTransaction()
      .setKey(newKey.publicKey)
      .setInitialBalance(new Hbar(40)) // 40 HBAR should be plenty
      .setMaxAutomaticTokenAssociations(10);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const newAccountId = receipt.accountId;

    console.log("New Account ID:", newAccountId.toString());
    console.log("New Account EVM Address:", `0x${newAccountId.toSolidityAddress()}`);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
