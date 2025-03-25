import { getTransactions } from "@/lib/crypto";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chain = searchParams.get("chain");
  const contractaddress = searchParams.get("contractaddress");
  const address = searchParams.get("address");

  if (!chain) {
    return Response.json({ error: "Missing chain parameter" }, { status: 400 });
  }

  if (!contractaddress && !address) {
    return Response.json(
      { error: "Missing contractaddress or address parameter" },
      { status: 400 }
    );
  }

  try {
    const transactions = await getTransactions(chain, contractaddress, address);
    return Response.json(transactions, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: `Failed to fetch transactions` },
      { status: 500 }
    );
  }
}
