const { Client, PrivateKey, ContractCreateFlow } = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

async function main() {
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY);

  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);

  console.log("Reading PayrollVault artifact...");
  const artifactPath = path.join(__dirname, "../artifacts/contracts/PayrollVault.sol/PayrollVault.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Router EVM: 0x0000000000000000000000000000000000004b40
  // WHBAR EVM: 0x0000000000000000000000000000000000003ad2
  // We need to ABI encode the constructor parameters
  const { ethers } = require("ethers");
  const abiCoder = new ethers.AbiCoder();
  const constructorArgs = abiCoder.encode(
    ["address", "address"],
    ["0x0000000000000000000000000000000000004b40", "0x0000000000000000000000000000000000003ad2"],
  );

  // Remove the '0x' from the hex constructor args
  const constructorParams = Buffer.from(constructorArgs.slice(2), "hex");

  console.log("Deploying contract via Hedera SDK...");
  const contractCreate = new ContractCreateFlow()
    .setBytecode(artifact.bytecode)
    .setGas(2000000)
    .setConstructorParameters(constructorParams);

  const txResponse = await contractCreate.execute(client);
  const receipt = await txResponse.getReceipt(client);
  const contractId = receipt.contractId;
  const contractAddress = `0x${contractId.toSolidityAddress()}`;

  console.log(`✅ PayrollVault deployed!`);
  console.log(`Contract ID: ${contractId.toString()}`);
  console.log(`EVM Address: ${contractAddress}`);

  // Write deployment file for scaffold-hbar compatibility
  const deploymentsDir = path.join(__dirname, "../deployments/hederaTestnet");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentData = {
    address: contractAddress,
    abi: artifact.abi,
    transactionHash: txResponse.transactionId.toString(),
  };

  fs.writeFileSync(path.join(deploymentsDir, "PayrollVault.json"), JSON.stringify(deploymentData, null, 2));

  console.log("Wrote deployment artifact to deployments/hederaTestnet/PayrollVault.json");
  process.exit(0);
}

main().catch(console.error);
