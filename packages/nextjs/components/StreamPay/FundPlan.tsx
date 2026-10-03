"use client";

import { useState } from "react";
import { useERC20Write } from "../../hooks/useERC20";
import { usePayrollVaultWrite } from "../../hooks/usePayrollVault";
import { PAYROLL_VAULT_ADDRESS } from "../../hooks/usePayrollVault";
import toast from "react-hot-toast";
import { Address } from "viem";

export const FundPlan = ({ planId, tokenAddress }: { planId: bigint; tokenAddress: Address }) => {
  const [amount, setAmount] = useState<string>("");

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
      setAmount("");
    } catch (error: any) {
      toast.error(error?.message || "Failed to fund", { id: "fund" });
    }
  };

  return (
    <div className="flex space-x-2 w-full max-w-xs">
      <input
        type="number"
        placeholder="Amount to fund"
        className="input input-bordered w-full"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />
      <button
        onClick={handleFund}
        className="btn btn-secondary"
        disabled={isFunding || isFundConfirming || isApproving || isApproveConfirming}
      >
        Fund
      </button>
    </div>
  );
};
