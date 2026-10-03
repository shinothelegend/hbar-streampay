"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatUnits } from "viem";

export const StreamProgress = ({
  funded,
  vested,
  claimable,
  ratePerSec,
  startTime,
  endTime,
  cancelled,
}: {
  funded: bigint;
  vested: bigint;
  claimable: bigint;
  ratePerSec: bigint;
  startTime: bigint;
  endTime: bigint;
  cancelled: boolean;
}) => {
  // We want to interpolate claimable and vested based on local time
  const [currentVested, setCurrentVested] = useState<bigint>(vested);
  const [currentClaimable, setCurrentClaimable] = useState<bigint>(claimable);

  useEffect(() => {
    if (cancelled) {
      setCurrentVested(vested);
      setCurrentClaimable(claimable);
      return;
    }

    const interval = setInterval(() => {
      const now = BigInt(Math.floor(Date.now() / 1000));

      // Calculate elapsed based on local clock to make it smooth
      let currentTimestamp = now;
      if (currentTimestamp > endTime) {
        currentTimestamp = endTime;
      }

      const elapsed = currentTimestamp > startTime ? currentTimestamp - startTime : 0n;
      let newVested = ratePerSec * elapsed;

      if (newVested > funded) {
        newVested = funded;
      }

      setCurrentVested(newVested);
      // The difference is what we added to vested locally
      const added = newVested - vested;
      setCurrentClaimable(claimable + added);
    }, 100); // 100ms smooth updates

    return () => clearInterval(interval);
  }, [vested, claimable, ratePerSec, startTime, endTime, cancelled, funded]);

  const progressPercentage = funded > 0n ? Number((currentVested * 10000n) / funded) / 100 : 0;

  return (
    <div className="w-full bg-base-300 rounded-box p-6 space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-widest">Available to Claim</h3>
          <div className="font-mono text-4xl text-primary flex items-baseline space-x-2 tabular-nums">
            <span>{formatUnits(currentClaimable, 6)}</span>
            <span className="text-sm text-base-content/50">TOKENS</span>
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-widest">Total Vested</h3>
          <div className="font-mono text-2xl text-base-content tabular-nums">
            {formatUnits(currentVested, 6)} <span className="text-sm opacity-50">/ {formatUnits(funded, 6)}</span>
          </div>
        </div>
      </div>

      <div className="w-full bg-base-100 h-4 rounded-none overflow-hidden relative">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: `${progressPercentage}%` }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ ease: "linear", duration: 0.1 }}
        />
      </div>

      {cancelled && <div className="badge badge-error badge-outline">Stream Cancelled</div>}
    </div>
  );
};
