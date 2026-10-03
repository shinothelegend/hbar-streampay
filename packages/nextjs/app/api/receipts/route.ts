import { NextResponse } from "next/server";
import { Client, PrivateKey, TopicId, TopicMessageSubmitTransaction } from "@hiero-ledger/sdk";

export async function POST(req: Request) {
  try {
    const { planId, employee, amount, txHash } = await req.json();

    if (planId === undefined || !employee || !amount || !txHash) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
