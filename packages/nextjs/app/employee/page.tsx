"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { StreamProgress } from "../../components/StreamPay/StreamProgress";
import { ClaimStreamButton } from "../../components/StreamPay/ClaimStreamButton";
import { usePlanDetails, useAccrued } from "../../hooks/usePayrollVault";

export default function EmployeePage() {
  useAccount();
  const [planIdInput, setPlanIdInput] = useState("");
  const [activePlanId, setActivePlanId] = useState<bigint | null>(null);

  const { data: planDetailsData } = usePlanDetails(activePlanId ?? 0n);
  const { data: accruedDataData } = useAccrued(activePlanId ?? 0n);

  const planDetails = planDetailsData as any;
  const accruedData = accruedDataData as any;

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
          <h1 className="text-4xl font-bold hedera-gradient-text inline-block">Employee Dashboard</h1>
          <p className="text-base-content/70 mt-2">Watch your salary stream in real-time and claim when ready.</p>
        </div>

        {!activePlanId ? (
          <form onSubmit={handleLoadPlan} className="card bg-base-100 shadow-xl max-w-md mx-auto p-6 space-y-4">
            <h2 className="card-title">Load Salary Stream</h2>
            <p className="text-sm text-base-content/70">Enter the Plan ID provided by your employer.</p>
            <input 
              type="number" 
              className="input input-bordered w-full" 
              placeholder="e.g. 0" 
              value={planIdInput}
              onChange={(e) => setPlanIdInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary w-full">Load Stream</button>
          </form>
        ) : (
          <div className="space-y-6">
            <button className="btn btn-ghost btn-sm" onClick={() => setActivePlanId(null)}>← Back to search</button>
            
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
                      cancelled={planDetails[8]}
                    />
                  )}
                </div>
                <div>
                  <div className="card bg-base-100 shadow-xl p-6">
                    <h3 className="font-bold text-lg mb-4">Claim Salary</h3>
                    <ClaimStreamButton planId={activePlanId} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-warning">
                Plan not found or you are not the assigned employee.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
