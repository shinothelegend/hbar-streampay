"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StreamProgress } from "../components/StreamPay/StreamProgress";
import { PAYROLL_VAULT_ADDRESS, payrollVaultABI, useAccrued, usePlanDetails } from "../hooks/usePayrollVault";
import { motion } from "framer-motion";
import { erc20Abi, formatUnits } from "viem";
import { useReadContract } from "wagmi";

const HeroTicker = ({ planId }: { planId?: bigint }) => {
  const { data: planDetails } = usePlanDetails(planId || 0n);
  const { data: accruedData } = useAccrued(planId || 0n);

  const [currentClaimable, setCurrentClaimable] = useState<bigint>(0n);

  useEffect(() => {
    if (planId === undefined || !planDetails || !accruedData) return;

    const ratePerSec = (planDetails as any)[3] as bigint;
    const startTime = (planDetails as any)[4] as bigint;
    const endTime = (planDetails as any)[5] as bigint;
    const cancelled = (planDetails as any)[8] as boolean;
    const funded = (planDetails as any)[6] as bigint;
    const vested = (accruedData as any)[1] as bigint;
    const claimable = (accruedData as any)[0] as bigint;

    if (cancelled) {
      setCurrentClaimable(claimable);
      return;
    }

    const interval = setInterval(() => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const currentTimestamp = now > endTime ? endTime : now;
      const elapsed = currentTimestamp > startTime ? currentTimestamp - startTime : 0n;
      let newVested = ratePerSec * elapsed;
      if (newVested > funded) newVested = funded;

      const added = newVested - vested;
      setCurrentClaimable(claimable + added);
    }, 100);

    return () => clearInterval(interval);
  }, [planDetails, accruedData, planId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="font-mono text-7xl md:text-9xl text-primary tabular-nums tracking-tighter"
    >
      ${planId !== undefined ? formatUnits(currentClaimable, 6) : "0.000000"}
    </motion.div>
  );
};

const PlanCard = ({ planId }: { planId: bigint }) => {
  const { data: planDetailsData } = usePlanDetails(planId);
  const { data: accruedDataData } = useAccrued(planId);

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

  if (!planDetails || planDetails[0] === "0x0000000000000000000000000000000000000000") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="card bg-base-100 shadow-xl border border-base-300"
    >
      <div className="card-body p-6">
        <h2 className="card-title text-sm opacity-50 uppercase tracking-widest mb-4">Stream #{planId.toString()}</h2>

        <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
          <div>
            <span className="block text-xs font-bold opacity-50 uppercase">Employer</span>
            <span className="font-mono text-sm tabular-nums">{planDetails[0]}</span>
          </div>
          <div>
            <span className="block text-xs font-bold opacity-50 uppercase">Employee</span>
            <span className="font-mono text-sm tabular-nums">{planDetails[1]}</span>
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
            decimals={(tokenDecimals as number) || 6}
            symbol={(tokenSymbol as string) || "TOKENS"}
          />
        )}
      </div>
    </motion.div>
  );
};

export default function Home() {
  const { data: countData } = useReadContract({
    address: PAYROLL_VAULT_ADDRESS,
    abi: payrollVaultABI,
    functionName: "nextPlanId",
  });

  const count = Number(countData || 0n);
  const planIds = Array.from({ length: count }, (_, i) => BigInt(i)).reverse(); // Show newest first

  return (
    <div className="min-h-screen bg-base-200 p-8 pt-24 text-base-content selection:bg-primary/30">
      <div className="max-w-6xl mx-auto space-y-24">
        {/* HERO */}
        <div className="text-center space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-base-content"
          >
            Salary that streams every second —<br />
            paid in USDC or HBAR.
          </motion.h1>

          <HeroTicker planId={count > 0 ? planIds[0] : undefined} />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-4"
          >
            <Link href="/employer" className="btn btn-primary rounded-none">
              Employer Portal
            </Link>
            <Link href="/employee" className="btn btn-secondary rounded-none">
              Employee Portal
            </Link>
          </motion.div>
        </div>

        {/* VERIFIED BADGES */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 text-xs font-mono"
        >
          <a
            href="https://hashscan.io/testnet/contract/0.0.10840783"
            target="_blank"
            rel="noreferrer"
            className="badge badge-outline hover:bg-base-300 py-4 px-4 rounded-none"
          >
            Contract: 0.0.10840783 ↗
          </a>
          <a
            href="https://hashscan.io/testnet/transaction/0x267644233d45d38910265b0c205e1abee6b0273f02020d3c0de79e47f868cb13"
            target="_blank"
            rel="noreferrer"
            className="badge badge-outline hover:bg-base-300 py-4 px-4 rounded-none"
          >
            Seed Tx ↗
          </a>
          <a
            href="https://hashscan.io/testnet/transaction/0.0.10469716-1791025581-655739693"
            target="_blank"
            rel="noreferrer"
            className="badge badge-outline hover:bg-base-300 py-4 px-4 rounded-none"
          >
            HCS Audit Receipt ↗
          </a>
        </motion.div>

        {/* HOW IT WORKS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-base-100 border border-base-300 p-8 md:p-12 space-y-8"
        >
          <h2 className="text-2xl font-bold text-center tracking-tight">How it works</h2>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-sm overflow-x-auto w-full max-w-4xl mx-auto py-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center p-4 border border-base-300 w-32 shrink-0"
            >
              <span className="text-secondary">Employer</span>
              <span className="opacity-50 text-xs mt-2">USDC</span>
            </motion.div>

            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: 64 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-px bg-primary/50 shrink-0 hidden md:block"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center p-6 border-2 border-primary text-primary w-40 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <span>Payroll Vault</span>
              <span className="text-[10px] mt-2 tabular-nums">streaming...</span>
            </motion.div>

            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: 64 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="h-px bg-primary/50 shrink-0 hidden md:block"
            />

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col items-center gap-4 shrink-0"
            >
              <div className="p-4 border border-base-300 text-center w-32">
                <span className="text-info">Employee</span>
                <span className="block opacity-50 text-xs mt-2">USDC</span>
              </div>
              <span className="opacity-50 text-[10px]">OR</span>
              <div className="p-4 border border-base-300 text-center w-32">
                <span className="text-info">Employee</span>
                <span className="block text-success text-xs mt-2">HBAR (SaucerSwap)</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* LIVE STREAMS WIDGET */}
        <div>
          <h2 className="text-2xl font-bold mb-6 tracking-tight">Live Streams</h2>
          {count === 0 ? (
            <div className="text-center p-12 bg-base-100 border border-base-300">
              <p className="opacity-50 font-mono text-sm">No streams created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {planIds.map((id, index) => (
                <motion.div
                  key={id.toString()}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.4 }}
                >
                  <PlanCard planId={id} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
