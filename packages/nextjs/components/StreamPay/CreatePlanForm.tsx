"use client";

import { useState } from "react";
import { usePayrollVaultWrite } from "../../hooks/usePayrollVault";
import toast from "react-hot-toast";
import { Address } from "viem";

export const CreatePlanForm = () => {
  const [employee, setEmployee] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [ratePerSec, setRatePerSec] = useState<string>("");
  const [durationDays, setDurationDays] = useState<string>("");

  const { createPlan, isPending, isConfirming } = usePayrollVaultWrite();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!employee || !token || !ratePerSec || !durationDays) {
        throw new Error("All fields are required");
      }

      // Convert rate to appropriate decimals (assuming 6 decimals for USDC usually, but we keep it generic)
      // Actually, ratePerSec is token units per second. If they want 100 tokens a day,
      // they should input total tokens per day, and we calculate per second.
      // But for simplicity, we let them input the raw token units per second, or we calculate it.
      // Let's assume ratePerSec input is raw integer units for now.
      const rate = BigInt(ratePerSec);
      const durationSeconds = BigInt(Math.floor(parseFloat(durationDays) * 86400));

      const tx = await createPlan(employee as Address, token as Address, rate, durationSeconds);
      toast.promise(Promise.resolve(tx), {
        loading: "Creating plan...",
        success: "Plan creation transaction sent!",
        error: "Failed to create plan",
      });
      // We could wait for confirmation here or let wagmi handle it
      setEmployee("");
      setToken("");
      setRatePerSec("");
      setDurationDays("");
    } catch (error: any) {
      toast.error(error?.message || "Failed to create plan");
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl w-full max-w-lg mx-auto">
      <div className="card-body">
        <h2 className="card-title text-2xl font-bold mb-4">Create Salary Stream</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Employee Address</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              className="input input-bordered w-full"
              value={employee}
              onChange={e => setEmployee(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Token Address (e.g. USDC)</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              className="input input-bordered w-full"
              value={token}
              onChange={e => setToken(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Rate (Token lowest-units per second)</span>
            </label>
            <input
              type="number"
              placeholder="1000"
              className="input input-bordered w-full"
              value={ratePerSec}
              onChange={e => setRatePerSec(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Duration (Days)</span>
            </label>
            <input
              type="number"
              step="any"
              placeholder="30"
              className="input input-bordered w-full"
              value={durationDays}
              onChange={e => setDurationDays(e.target.value)}
            />
          </div>

          <div className="form-control mt-6">
            <button type="submit" className="btn btn-primary w-full" disabled={isPending || isConfirming}>
              {isPending || isConfirming ? "Processing..." : "Create Stream"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
