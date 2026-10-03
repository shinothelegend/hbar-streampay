import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { HEDERA_TESTNET } from "../config/hedera-testnet";

async function getEvmAddress(hederaId: string): Promise<string> {
  const parts = hederaId.split(".");
  const num = BigInt(parts[2]);
  return "0x" + num.toString(16).padStart(40, "0");
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Resolving Hedera Testnet addresses for SaucerSwap...");

  // Resolve EVM addresses
  const routerEvm = await getEvmAddress(HEDERA_TESTNET.saucerSwapV1Router.hederaId);
  console.log(`Router EVM Address: ${routerEvm}`);

  const whbarTokenEvm = await getEvmAddress(HEDERA_TESTNET.whbarToken.hederaId);
  console.log(`WHBAR EVM Address: ${whbarTokenEvm}`);

  await deploy("PayrollVault", {
    from: deployer,
    args: [routerEvm, whbarTokenEvm],
    log: true,
    autoMine: true, // speed up deployment on local network (hardhat)
  });

  console.log("PayrollVault deployed successfully.");
};

export default func;
func.tags = ["PayrollVault"];
