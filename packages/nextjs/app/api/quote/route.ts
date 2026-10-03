import { NextResponse } from "next/server";
import { createPublicClient, http, parseUnits } from "viem";
import { hederaTestnet } from "viem/chains";

const routerAbi = [
  {
    "inputs": [
      {"name": "amountIn", "type": "uint256"},
      {"name": "path", "type": "address[]"}
    ],
    "name": "getAmountsOut",
    "outputs": [{"name": "amounts", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const amountIn = searchParams.get("amountIn");
  const path = searchParams.get("path")?.split(",");

  if (!amountIn || !path || path.length < 2) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const routerAddress = "0x0000000000000000000000000000000000004b40"; // 0.0.19264 testnet V1 router

  try {
    const client = createPublicClient({
      chain: hederaTestnet,
      transport: http(process.env.HEDERA_RPC_URL || "https://testnet.hashio.io/api")
    });

    const amountsOut = await client.readContract({
      address: routerAddress,
      abi: routerAbi,
      functionName: "getAmountsOut",
      args: [BigInt(amountIn), path as `0x${string}`[]]
    });

    return NextResponse.json({ amountsOut: amountsOut.map(a => a.toString()) });
  } catch (error: any) {
    console.error("Quote error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
