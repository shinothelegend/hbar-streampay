const { Client, PrivateKey, TopicCreateTransaction } = require("@hashgraph/sdk");
require("dotenv").config({ path: "packages/hardhat/.env" });

async function main() {
  const operatorId = process.env.HEDERA_TESTNET_OPERATOR_ID || process.env.HEDERA_OPERATOR_ID;
  const operatorKeyStr = process.env.HEDERA_TESTNET_OPERATOR_KEY || process.env.HEDERA_OPERATOR_KEY;

  if (!operatorId || !operatorKeyStr) {
    console.error("Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY in .env");
    process.exit(1);
  }

  const operatorKey = PrivateKey.fromString(operatorKeyStr);
  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);

  console.log("Creating new HCS Topic for StreamPay receipts...");

  try {
    const transaction = new TopicCreateTransaction()
      .setTopicMemo("StreamPay Salary Receipts")
      .setSubmitKey(operatorKey);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId;

    console.log(`✅ Topic Created successfully!`);
    console.log(`Topic ID: ${topicId.toString()}`);
    console.log(`\nAdd this to your nextjs/.env.local:`);
    console.log(`NEXT_PUBLIC_HCS_RECEIPT_TOPIC_ID=${topicId.toString()}`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to create topic:", error);
    process.exit(1);
  }
}

main();
