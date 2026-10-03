"use client";

import { useState } from "react";
import { usePayrollVaultWrite } from "../../hooks/usePayrollVault";
import { useReadContract, useAccount } from "wagmi";
import toast from "react-hot-toast";

const ROUTER_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" }
    ],
    "name": "getAmountsOut",
    "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  }
];

export const ClaimStreamButton = ({ planId, claimable }: { planId: bigint, claimable?: bigint }) => {
  const [swapToHBAR, setSwapToHBAR] = useState(false);
  
  const { claim, isPending, isConfirming } = usePayrollVaultWrite();

  const USDC = "0x0000000000000000000000000000000000001549";
  const WHBAR = "0x0000000000000000000000000000000000003ad2";
  const ROUTER = "0x0000000000000000000000000000000000004b40";

  const amountIn = claimable || 0n;

  const { data: amountsOut } = useReadContract({
    address: ROUTER,
    abi: ROUTER_ABI,
    functionName: "getAmountsOut",
    args: [amountIn, [USDC, WHBAR]],
    query: { enabled: swapToHBAR && amountIn > 0n }
  });

  const handleClaim = async () => {
    try {
      let minOut = 0n;
      if (swapToHBAR && amountsOut && amountsOut.length === 2) {
        // 1% slippage
        minOut = (amountsOut[1] as bigint) * 99n / 100n;
      }
      const tx = await claim(planId, swapToHBAR, minOut);

      toast.promise(Promise.resolve(tx), {
        loading: "Claiming salary...",
        success: "Salary claimed successfully!",
        error: "Failed to claim salary",
      });

      if (tx) {
        fetch("/api/receipts", {
          method: "POST",
          body: JSON.stringify({
            planId: planId.toString(),
            employee: "Employee",
            amount: amountIn.toString(),
            txHash: tx,
          }),
        }).catch(console.error);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to claim salary");
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="label cursor-pointer justify-start space-x-2">
        <input
          type="checkbox"
          className="checkbox checkbox-primary"
          checked={swapToHBAR}
          onChange={e => setSwapToHBAR(e.target.checked)}
        />
        <span className="label-text">Receive as Native HBAR (via SaucerSwap)</span>
      </label>

      {swapToHBAR && amountsOut && amountsOut.length === 2 && (
        <div className="text-sm text-gray-500">
          Estimated HBAR output: {((amountsOut[1] as bigint) / 100000000n).toString()} HBAR
        </div>
      )}

      <button onClick={handleClaim} className="btn btn-primary" disabled={isPending || isConfirming || (swapToHBAR && amountIn > 0n && !amountsOut)}>
        {isPending || isConfirming ? "Processing..." : "Claim Salary"}
      </button>
    </div>
  );
};
