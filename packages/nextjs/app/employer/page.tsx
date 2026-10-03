import { CreatePlanForm } from "../../components/StreamPay/CreatePlanForm";

export default function EmployerPage() {
  return (
    <div className="min-h-screen bg-base-200 p-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold hedera-gradient-text inline-block">Employer Dashboard</h1>
          <p className="text-base-content/70 mt-2">Create and manage real-time salary streams for your team.</p>
        </div>

        <CreatePlanForm />
        
        {/* We would typically list employer streams here, but for now we focus on creating them */}
        <div className="text-center text-sm text-base-content/50 mt-12">
          Streams you create will be trackable by the employee ID.
        </div>
      </div>
    </div>
  );
}
