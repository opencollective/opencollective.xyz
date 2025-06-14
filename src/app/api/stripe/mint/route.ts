import { mint as mintNFT } from "@/lib/nft";
import { mint as mintToken } from "@/lib/token";
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

  const walletAddress = session.client_reference_id;
  if (!walletAddress) {
    return new Response(
      "client_reference_id missing in the Stripe payment link",
      { status: 400 }
    );
  }

  const nftAddressString = session.metadata?.nft;
  const tokenAddressString = session.metadata?.token;
  if (!nftAddressString && !tokenAddressString) {
    return new Response(
      "No nft or token address provided in the metadata of the Stripe payment link",
      {
        status: 400,
      }
    );
  }
  const explorerUrl = `https://sepolia.basescan.org`;
  const res: {
    collectiveSlug: string;
    nft?: { txHash: string; explorerUrl: string };
    token?: { txHash: string; explorerUrl: string };
  } = { collectiveSlug };
  const nftAddress = nftAddressString?.match(/0x[a-fA-F0-9]{40}/)?.[0];
  if (nftAddress) {
    const txHash = await mintNFT(nftAddress, walletAddress);
    res.nft = { txHash, explorerUrl: `${explorerUrl}/tx/${txHash}` };
    console.log(">>> nftminted", res.nft);
  }
  const tokenAddress = tokenAddressString?.match(/0x[a-fA-F0-9]{40}/)?.[0];
  if (tokenAddress) {
    const value = tokenAddressString.match(/\?value=(\d+)/)?.[1];
    if (!value) {
      return new Response(
        "No value provided in the metadata.token of the Stripe payment link",
        { status: 400 }
      );
    }
    const txHash = await mintToken(tokenAddress, walletAddress, BigInt(value));
    res.token = { txHash, explorerUrl: `${explorerUrl}/tx/${txHash}` };
    console.log(">>> token minted", res.token, value);
  }
  console.log(">>> /api/stripe/mint response:", res);
  return Response.json(res, { status: 200 });
}
