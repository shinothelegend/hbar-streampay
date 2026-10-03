"use client";

import { CreatePlanForm } from "../../components/StreamPay/CreatePlanForm";
import { PAYROLL_VAULT_ADDRESS } from "../../hooks/usePayrollVault";
import { motion } from "framer-motion";

export default function EmployerPage() {
  return (
    <div className="min-h-screen bg-base-200 p-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold inline-block tracking-tight">Employer Dashboard</h1>
          <p className="text-base-content/70 mt-2">Create and manage real-time salary streams for your team.</p>
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

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <CreatePlanForm />
        </motion.div>

        {/* We would typically list employer streams here, but for now we focus on creating them */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-sm text-base-content/50 mt-12"
        >
          Streams you create will be trackable by the employee ID.
        </motion.div>
      </div>
    </div>
  );
}
