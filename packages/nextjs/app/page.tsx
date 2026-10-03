"use client";

import Link from "next/link";
import { StreamProgress } from "../components/StreamPay/StreamProgress";
import { PAYROLL_VAULT_ADDRESS, payrollVaultABI, useAccrued, usePlanDetails } from "../hooks/usePayrollVault";
import { useReadContract } from "wagmi";

const PlanCard = ({ planId }: { planId: bigint }) => {
  const { data: planDetailsData } = usePlanDetails(planId);
  const { data: accruedDataData } = useAccrued(planId);

  const planDetails = planDetailsData as any;
  const accruedData = accruedDataData as any;

  if (!planDetails || planDetails[0] === "0x0000000000000000000000000000000000000000") return null;

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300">
      <div className="card-body p-6">
        <h2 className="card-title text-sm opacity-50 uppercase tracking-widest mb-4">Stream #{planId.toString()}</h2>

        <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
          <div>
            <span className="block text-xs font-bold opacity-50 uppercase">Employer</span>
            <span className="font-mono text-sm">{planDetails[0]}</span>
          </div>
          <div>
            <span className="block text-xs font-bold opacity-50 uppercase">Employee</span>
            <span className="font-mono text-sm">{planDetails[1]}</span>
          </div>
        </div>

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
    </div>
  );
};

export default function Home() {
  const { data: countData } = useReadContract({
    address: PAYROLL_VAULT_ADDRESS,
    abi: payrollVaultABI,
    functionName: "nextPlanId",
  });

  const count = Number(countData || 0n);
  const planIds = Array.from({ length: count }, (_, i) => BigInt(i));

  return (
    <div className="min-h-screen bg-base-200 p-8 pt-24">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold hedera-gradient-text inline-block mb-4">StreamPay</h1>
          <p className="text-lg text-base-content/70">Non-custodial, real-time salary streaming on Hedera.</p>
          <div className="flex justify-center space-x-4 mt-8">
            <Link href="/employer" className="btn btn-primary">
              Employer Portal
            </Link>
            <Link href="/employee" className="btn btn-secondary">
              Employee Portal
            </Link>
            <Link href="/receipts" className="btn btn-outline">
              HCS Audit Trail
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Live Streams</h2>
          {count === 0 ? (
            <div className="text-center p-12 bg-base-100 rounded-box border border-base-300">
              <p className="opacity-50">No streams created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {planIds.map(id => (
                <PlanCard key={id.toString()} planId={id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
