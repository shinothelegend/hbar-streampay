// Sources: docs.saucerswap.finance contract deployments page + Hedera mirror node.
export const HEDERA_TESTNET = {
  saucerSwapV1Router: { hederaId: "0.0.19264" }, // SaucerSwapV1RouterV3
  saucerSwapV1Factory: { hederaId: "0.0.9959" },
  whbarContract: { hederaId: "0.0.15057" },
  whbarToken: { hederaId: "0.0.15058" }, // the HTS token used in swap paths
  whbarHelper: { hederaId: "0.0.5286055" }, // safe wrap/unwrap helper
  usdc: { hederaId: "0.0.5449" }, // the USDC that SaucerSwap testnet pools trade
} as const;
