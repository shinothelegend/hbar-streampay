"use client";

import { CreatePlanForm } from "../../components/StreamPay/CreatePlanForm";
import { motion } from "framer-motion";

export default function EmployerPage() {
  return (
    <div className="min-h-screen bg-base-200 p-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold inline-block tracking-tight">Employer Dashboard</h1>
          <p className="text-base-content/70 mt-2">Create and manage real-time salary streams for your team.</p>
        </div>

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
