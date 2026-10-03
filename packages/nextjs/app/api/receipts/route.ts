import { NextResponse } from "next/server";
import PayrollVaultArtifact from "../../../contracts/PayrollVaultABI.json";
import { Client, PrivateKey, TopicId, TopicMessageSubmitTransaction } from "@hiero-ledger/sdk";
import { createPublicClient, decodeEventLog, http } from "viem";
import { hederaTestnet } from "viem/chains";

export async function POST(req: Request) {
  try {
    const { planId, employee, amount, txHash } = await req.json();

    if (planId === undefined || !employee || !amount || !txHash) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      const publicClient = createPublicClient({ chain: hederaTestnet, transport: http() });
      const txReceipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
      if (!txReceipt || txReceipt.status !== "success") {
        return NextResponse.json({ error: "Transaction not successful or not found" }, { status: 400 });
      }

      let eventFound = false;
      for (const log of txReceipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: PayrollVaultArtifact.abi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "Claimed") {
            const ev = decoded.args as any;
            if (
              ev.planId.toString() === planId.toString() &&
              ev.employee.toLowerCase() === employee.toLowerCase() &&
              ev.amount.toString() === amount.toString()
            ) {
              eventFound = true;
            }
          }
        } catch {
          // ignore non-matching logs
        }
      }

      if (!eventFound) {
        return NextResponse.json({ error: "Transaction data does not match submitted receipt" }, { status: 400 });
      }
    } catch (e: any) {
      return NextResponse.json(
        { error: "Failed to validate transaction on-chain", details: e.message },
        { status: 400 },
      );
    }

    const topicIdStr = process.env.NEXT_PUBLIC_HCS_RECEIPT_TOPIC_ID || process.env.HCS_RECEIPT_TOPIC_ID;
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;

    if (!topicIdStr || !operatorId || !operatorKey) {
      console.warn("HCS configuration missing. Skipping receipt submission.");
      // Soft fail if missing config so UI doesn't break locally if unconfigured
      return NextResponse.json({ success: false, reason: "HCS not configured" });
    }

    const client = Client.forTestnet();
    client.setOperator(operatorId, PrivateKey.fromStringECDSA(operatorKey));

    const msg = await new TopicMessageSubmitTransaction({
      topicId: TopicId.fromString(topicIdStr),
      message: JSON.stringify({
        planId: planId.toString(),
        employee,
        amount: amount.toString(),
        txHash,
        ts: Date.now(),
      }),
    }).execute(client);

    const receipt = await msg.getReceipt(client);

    return NextResponse.json({
      success: true,
      status: receipt.status.toString(),
      transactionId: msg.transactionId.toString(),
    });
  } catch (error: any) {
    console.error("HCS Submit Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
