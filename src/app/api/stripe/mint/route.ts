import { mint } from "@/lib/nft";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET!);

export async function POST(req: Request) {
  const { stripeSessionId } = await req.json();
  if (!stripeSessionId) {
    return new Response("stripeSessionId missing", { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(stripeSessionId, {
    expand: ["payment_link"],
  });
  console.log(">>> session", session);

  const collectiveSlug = session.metadata?.collectiveSlug;
  if (!collectiveSlug) {
    return new Response(
      "collectiveSlug missing in the metadata of the Stripe payment link",
      { status: 400 }
    );
  }

  const nftAddressString = session.metadata?.nft;
  if (!nftAddressString) {
    return new Response(
      "nft missing in the metadata of the Stripe payment link",
      {
        status: 400,
      }
    );
  }
  const nftAddress = nftAddressString.match(/0x[a-fA-F0-9]{40}/)?.[0];
  if (!nftAddress) {
    return new Response(
      "Invalid nft address in the metadata of the Stripe payment link",
      {
        status: 400,
      }
    );
  }

  const walletAddress = session.client_reference_id;

  if (!walletAddress) {
    return new Response(
      "client_reference_id missing in the Stripe payment link",
      { status: 400 }
    );
  }

  const txHash = await mint(nftAddress, walletAddress);
  console.log(">>> minted", txHash);
  const explorerUrl = `https://sepolia.basescan.org/tx/${txHash}`;
  const res = { collectiveSlug, txHash, explorerUrl };
  console.log(">>> /api/stripe/mint response:", res);
  return Response.json(res, { status: 200 });
}
