import PayrollVaultArtifact from "../contracts/PayrollVaultABI.json";
import { Abi, Address } from "viem";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

export const payrollVaultABI = PayrollVaultArtifact.abi as Abi;

export const PAYROLL_VAULT_ADDRESS = process.env.NEXT_PUBLIC_PAYROLL_VAULT_ADDRESS as Address | undefined;

/**
 * Hook to read the accrued amounts of a specific plan
 */
export function useAccrued(planId: bigint) {
  return useReadContract({
    address: PAYROLL_VAULT_ADDRESS,
    abi: payrollVaultABI,
    functionName: "accrued",
    args: [planId],
    query: {
      // Refetch every 10 seconds to keep UI updated naturally
      refetchInterval: 10000,
    },
  });
}

/**
 * Hook to read the plan details
 */
export function usePlanDetails(planId: bigint) {
  return useReadContract({
    address: PAYROLL_VAULT_ADDRESS,
    abi: payrollVaultABI,
    functionName: "plans",
    args: [planId],
  });
}

/**
 * Hook for writing to the contract
 */
export function usePayrollVaultWrite() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const createPlan = async (employee: Address, token: Address, ratePerSec: bigint, duration: bigint) => {
    if (!PAYROLL_VAULT_ADDRESS) throw new Error("Vault not configured");
    return writeContractAsync({
      address: PAYROLL_VAULT_ADDRESS,
      abi: payrollVaultABI,
      functionName: "createPlan",
      args: [employee, token, ratePerSec, duration],
    });
  };

  const fundPlan = async (planId: bigint, amount: bigint) => {
    if (!PAYROLL_VAULT_ADDRESS) throw new Error("Vault not configured");
    return writeContractAsync({
      address: PAYROLL_VAULT_ADDRESS,
      abi: payrollVaultABI,
      functionName: "fundPlan",
      args: [planId, amount],
    });
  };

  const claim = async (planId: bigint, swapToHBAR: boolean, amountOutMin: bigint) => {
    return writeContractAsync({
      address: PAYROLL_VAULT_ADDRESS,
      abi: payrollVaultABI,
      functionName: "claim",
      args: [planId, swapToHBAR, amountOutMin],
    });
  };

  const cancelPlan = async (planId: bigint) => {
    if (!PAYROLL_VAULT_ADDRESS) throw new Error("Vault not configured");
    return writeContractAsync({
      address: PAYROLL_VAULT_ADDRESS,
      abi: payrollVaultABI,
      functionName: "cancelPlan",
      args: [planId],
    });
  };

  return {
    createPlan,
    fundPlan,
    claim,
    cancelPlan,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}
