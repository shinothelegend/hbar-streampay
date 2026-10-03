import { NextResponse } from "next/server";

export async function GET() {
  const topicIdStr = process.env.NEXT_PUBLIC_HCS_RECEIPT_TOPIC_ID || process.env.HCS_RECEIPT_TOPIC_ID;

  if (!topicIdStr) {
    return NextResponse.json({ messages: [] });
  }

  try {
    const response = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicIdStr}/messages?limit=100&order=desc`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch messages from mirror node");
    }

    const data = await response.json();

    // Base64 decode the messages and parse JSON
    const messages = data.messages
      .map((m: any) => {
        try {
          const decodedString = Buffer.from(m.message, "base64").toString("utf-8");
          const parsed = JSON.parse(decodedString);
          return {
            sequenceNumber: m.sequence_number,
            consensusTimestamp: m.consensus_timestamp,
            payload: parsed,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean); // Drop malformed

    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
