"use client";

import { usePayrollVaultWrite } from "../../hooks/usePayrollVault";
import toast from "react-hot-toast";

export const CancelPlanButton = ({ planId }: { planId: bigint }) => {
  const { cancelPlan, isPending, isConfirming } = usePayrollVaultWrite();

  const handleCancel = async () => {
    try {
      const tx = await cancelPlan(planId);
      toast.promise(Promise.resolve(tx), {
        loading: "Cancelling plan...",
        success: "Stream cancelled successfully!",
        error: "Failed to cancel stream",
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to cancel stream");
    }
  };

  return (
    <button onClick={handleCancel} className="btn btn-error btn-outline" disabled={isPending || isConfirming}>
      {isPending || isConfirming ? "Cancelling..." : "Cancel Stream"}
    </button>
  );
};
