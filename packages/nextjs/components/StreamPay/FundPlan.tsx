"use client";

import { useState } from "react";
import { useERC20Write } from "../../hooks/useERC20";
import { usePayrollVaultWrite } from "../../hooks/usePayrollVault";
import { PAYROLL_VAULT_ADDRESS } from "../../hooks/usePayrollVault";
import toast from "react-hot-toast";
import { Address } from "viem";

export const FundPlan = ({ planId, tokenAddress }: { planId: bigint; tokenAddress: Address }) => {
  const [amount, setAmount] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { fundPlan, isPending: isFunding, isConfirming: isFundConfirming } = usePayrollVaultWrite();
  const { approve, isPending: isApproving, isConfirming: isApproveConfirming } = useERC20Write();

  const handleFund = async () => {
    try {
      if (!amount) throw new Error("Please enter an amount");
      const fundAmount = BigInt(amount);

      // Step 1: Approve
      toast.loading("Approving tokens...", { id: "fund" });
      await approve(tokenAddress, PAYROLL_VAULT_ADDRESS, fundAmount);
      // We assume quick finality on Hedera

      // Step 2: Fund
      toast.loading("Funding stream...", { id: "fund" });
      await fundPlan(planId, fundAmount);

      toast.success("Stream funded successfully!", { id: "fund" });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
      setAmount("");
    } catch (error: any) {
      let msg = error?.message || "Failed to fund";
      if (msg.includes("NotEmployer")) msg = "Error: NotEmployer (only employer can fund/manage)";
      toast.error(msg, { id: "fund" });
    }
  };

  return (
    <div className="flex space-x-2 w-full max-w-xs">
      <input
        type="number"
        placeholder="Amount to fund"
        className="input input-bordered w-full tabular-nums"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />
      <button
        onClick={handleFund}
        className={`btn ${isFunding || isFundConfirming || isApproving || isApproveConfirming ? "btn-warning" : isSuccess ? "btn-success text-success-content" : "btn-secondary"} rounded-none`}
        disabled={isFunding || isFundConfirming || isApproving || isApproveConfirming || isSuccess}
      >
        {isFunding || isFundConfirming || isApproving || isApproveConfirming ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : isSuccess ? (
          "Funded"
        ) : (
          "Fund"
        )}
      </button>
    </div>
  );
};
