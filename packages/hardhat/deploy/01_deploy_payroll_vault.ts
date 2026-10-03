import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { HEDERA_TESTNET } from "../config/hedera-testnet";

async function getEvmAddress(hederaId: string): Promise<string> {
  const url = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${hederaId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch EVM address for ${hederaId}`);
  }
  const data = await response.json();
  return data.evm_address;
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
