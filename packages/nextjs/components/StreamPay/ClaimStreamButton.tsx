"use client";

import { useState } from "react";
import { usePayrollVaultWrite } from "../../hooks/usePayrollVault";
import scaffoldConfig from "~~/scaffold.config";
import toast from "react-hot-toast";
import { useAccount, useReadContract } from "wagmi";


const ROUTER_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
    ],
    name: "getAmountsOut",
    outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
];

export const ClaimStreamButton = ({ planId, claimable, symbol }: { planId: bigint; claimable?: bigint; symbol: string }) => {
  const [swapToHBAR, setSwapToHBAR] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { address } = useAccount();
  const { claim, isPending, isConfirming } = usePayrollVaultWrite();

  const USDC = scaffoldConfig.testnetAddresses!.usdc as `0x${string}`;
  const WHBAR = scaffoldConfig.testnetAddresses!.whbar as `0x${string}`;
  const ROUTER = scaffoldConfig.testnetAddresses!.router as `0x${string}`;

  const amountIn = claimable || 0n;

  const { data: amountsOut } = useReadContract({
    address: ROUTER,
    abi: ROUTER_ABI,
    functionName: "getAmountsOut",
    args: [amountIn, [USDC, WHBAR]],
    query: { enabled: swapToHBAR && amountIn > 0n },
  });

  const handleClaim = async () => {
    try {
      let minOut = 0n;
      if (swapToHBAR && Array.isArray(amountsOut) && amountsOut.length === 2) {
        // 1% slippage
        minOut = ((amountsOut[1] as bigint) * 99n) / 100n;
      }
      const tx = await claim(planId, swapToHBAR, minOut);

      toast.promise(Promise.resolve(tx), {
        loading: "Claiming salary...",
        success: "Salary claimed successfully!",
        error: "Failed to claim salary",
      });

      if (tx) {
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000);

        fetch("/api/receipts", {
          method: "POST",
          body: JSON.stringify({
            planId: planId.toString(),
            employee: address || "Unknown",
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
        <span className="label-text">Receive as Native HBAR (swap {symbol} via SaucerSwap)</span>
      </label>

      {swapToHBAR && Array.isArray(amountsOut) && amountsOut.length === 2 && (
        <div className="text-sm text-base-content/50 tabular-nums">
          Estimated HBAR output: {((amountsOut[1] as bigint) / 100000000n).toString()} HBAR
        </div>
      )}

      <button
        onClick={handleClaim}
        className={`btn ${isPending || isConfirming ? "btn-warning" : isSuccess ? "btn-success text-success-content" : "btn-primary"} rounded-none`}
        disabled={isPending || isConfirming || isSuccess || (swapToHBAR && amountIn > 0n && !amountsOut)}
      >
        {isPending || isConfirming ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : isSuccess ? (
          "Success!"
        ) : (
          "Claim Salary"
        )}
      </button>
    </div>
  );
};
