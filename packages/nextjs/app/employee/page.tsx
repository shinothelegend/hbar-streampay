"use client";

import { useState } from "react";
import { ClaimStreamButton } from "../../components/StreamPay/ClaimStreamButton";
import { StreamProgress } from "../../components/StreamPay/StreamProgress";
import { PAYROLL_VAULT_ADDRESS, useAccrued, usePlanDetails } from "../../hooks/usePayrollVault";
import { motion } from "framer-motion";
import { erc20Abi } from "viem";
import { useAccount, useReadContract } from "wagmi";

export default function EmployeePage() {
  useAccount();
  const [planIdInput, setPlanIdInput] = useState("");
  const [activePlanId, setActivePlanId] = useState<bigint | null>(null);

  const { data: planDetailsData } = usePlanDetails(activePlanId ?? 0n);
  const { data: accruedDataData } = useAccrued(activePlanId ?? 0n);

  const planDetails = planDetailsData as any;
  const accruedData = accruedDataData as any;

  const tokenAddress = planDetails?.[2] as `0x${string}` | undefined;

  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: !!tokenAddress },
  });

  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "symbol",
    query: { enabled: !!tokenAddress },
  });

  const handleLoadPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (planIdInput) {
      setActivePlanId(BigInt(planIdInput));
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold inline-block tracking-tight">Employee Dashboard</h1>
          <p className="text-base-content/70 mt-2">Watch your salary stream in real-time and claim when ready.</p>
        </div>

        {!PAYROLL_VAULT_ADDRESS && (
          <div className="alert alert-warning shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="font-bold">Contract Not Configured</h3>
              <div className="text-sm">
                Please deploy the PayrollVault contract and set NEXT_PUBLIC_PAYROLL_VAULT_ADDRESS in your .env.local
                file.
              </div>
            </div>
          </div>
        )}

        {!activePlanId ? (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleLoadPlan}
            className="card bg-base-100 shadow-xl max-w-md mx-auto p-6 space-y-4"
          >
            <h2 className="card-title">Load Salary Stream</h2>
            <p className="text-sm text-base-content/70">Enter the Plan ID provided by your employer.</p>
            <input
              type="number"
              className="input input-bordered w-full"
              placeholder="e.g. 0"
              value={planIdInput}
              onChange={e => setPlanIdInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary w-full rounded-none">
              Load Stream
            </button>
          </motion.form>
        ) : (
          <div className="space-y-6">
            <button className="btn btn-ghost btn-sm" onClick={() => setActivePlanId(null)}>
              ← Back to search
            </button>

            {planDetails && planDetails[0] !== "0x0000000000000000000000000000000000000000" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {accruedData && (
                    <StreamProgress
                      funded={planDetails[6]}
                      vested={accruedData[1]}
                      claimable={accruedData[0]}
                      ratePerSec={planDetails[3]}
                      startTime={planDetails[4]}
                      endTime={planDetails[5]}
                      cancelled={planDetails[7]}
                      decimals={(tokenDecimals as number) || 6}
                      symbol={(tokenSymbol as string) || "TOKENS"}
                    />
                  )}
                </div>
                <div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card bg-base-100 shadow-xl p-6"
                  >
                    <h3 className="font-bold text-lg mb-4 tracking-tight">Claim Salary</h3>
                    <ClaimStreamButton
                      planId={activePlanId}
                      claimable={accruedData?.[0]}
                      symbol={(tokenSymbol as string) || "TOKENS"}
                    />
                  </motion.div>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="alert alert-warning rounded-none"
              >
                Plan not found or you are not the assigned employee.
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
