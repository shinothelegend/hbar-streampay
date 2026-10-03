"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatUnits } from "viem";

export default function ReceiptsPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const res = await fetch("/api/topic");
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
    const interval = setInterval(fetchReceipts, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-base-200 p-8 pt-24">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold inline-block tracking-tight">HCS Audit Trail</h1>
          <p className="text-base-content/70 mt-2">Immutable consensus timestamps for every salary claim.</p>
        </div>

        {loading && messages.length === 0 ? (
          <div className="text-center p-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <div className="bg-base-100 rounded-box shadow-xl overflow-hidden">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Consensus Time</th>
                  <th>Plan ID</th>
                  <th>Employee</th>
                  <th>Amount Claimed</th>
                  <th>EVM Tx</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {messages.length === 0 && (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <td colSpan={5} className="text-center text-base-content/50 py-8">
                        No receipts found on this topic.
                      </td>
                    </motion.tr>
                  )}
                  {messages.map((msg, i) => (
                    <motion.tr
                      key={msg.consensusTimestamp || i}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      layout
                      className="hover"
                    >
                      <td className="font-mono text-sm opacity-70 tabular-nums">
                        {new Date(parseFloat(msg.consensusTimestamp) * 1000).toLocaleString()}
                      </td>
                      <td className="tabular-nums">{msg.payload.planId}</td>
                      <td className="font-mono text-sm">
                        {msg.payload.employee.slice(0, 8)}...{msg.payload.employee.slice(-6)}
                      </td>
                      <td className="text-success font-mono tabular-nums">
                        {formatUnits(BigInt(msg.payload.amount), 6)}
                      </td>
                      <td>
                        <a
                          href={`https://hashscan.io/testnet/transaction/${msg.payload.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="link link-primary text-xs"
                        >
                          View Hashscan
                        </a>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
