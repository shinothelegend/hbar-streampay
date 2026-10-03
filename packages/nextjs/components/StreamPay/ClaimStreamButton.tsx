"use client";

import { useState } from "react";
import { usePayrollVaultWrite } from "../../hooks/usePayrollVault";
import toast from "react-hot-toast";

export const ClaimStreamButton = ({ planId }: { planId: bigint }) => {
  const [swapToHBAR, setSwapToHBAR] = useState(false);
  const [amountOutMin, setAmountOutMin] = useState("0"); // Simplification for now

  const { claim, isPending, isConfirming } = usePayrollVaultWrite();

  const handleClaim = async () => {
    try {
      const minOut = swapToHBAR ? BigInt(amountOutMin) : 0n;
      const tx = await claim(planId, swapToHBAR, minOut);
      
      toast.promise(Promise.resolve(tx), {
        loading: "Claiming salary...",
        success: "Salary claimed successfully!",
        error: "Failed to claim salary",
      });

      // Wait for hash to be available before posting to HCS
      if (tx) {
        // Optimistic UI or await wagmi confirmation
        fetch("/api/receipts", {
          method: "POST",
          body: JSON.stringify({
            planId: planId.toString(),
            employee: "Employee", // Can fetch from address if needed
            amount: "Claimed Amount", 
            txHash: tx
          })
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
          onChange={(e) => setSwapToHBAR(e.target.checked)}
        />
        <span className="label-text">Receive as Native HBAR (via SaucerSwap)</span>
      </label>
      
      {swapToHBAR && (
        <input 
          type="number" 
          placeholder="Min HBAR out (Slippage)" 
          className="input input-bordered input-sm"
          value={amountOutMin}
          onChange={(e) => setAmountOutMin(e.target.value)}
        />
      )}

      <button
        onClick={handleClaim}
        className="btn btn-primary"
        disabled={isPending || isConfirming}
      >
        {isPending || isConfirming ? "Processing..." : "Claim Salary"}
      </button>
    </div>
  );
};
