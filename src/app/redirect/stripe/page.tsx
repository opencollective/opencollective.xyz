import MintNFT from "@/components/MintNFT";
import { getCollectiveConfig } from "@/lib/config";
import { Price } from "@/types";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET!);

export default async function CollectivePage({
  searchParams,
}: {
  searchParams: Promise<{ checkout_session_id: string }>;
}) {
  const { checkout_session_id } = await searchParams;

  if (!checkout_session_id) {
    return <div>No checkout session id</div>;
  }

  const session = await stripe.checkout.sessions.retrieve(checkout_session_id, {
    expand: ["payment_link"],
  });
  console.log(">>> session", session);

  const collectiveSlug = session.metadata?.collectiveSlug;
  if (!collectiveSlug) {
    return <div>No collective slug</div>;
  }
  const collectiveConfig = getCollectiveConfig(collectiveSlug);
  let productPrice: Price | undefined;
  collectiveConfig?.products.map((p) => {
    const price = p.prices.find(
      (p) => p.stripeLink === (session.payment_link as Stripe.PaymentLink)?.url
    );
    if (price) {
      productPrice = price;
    }
  });

  if (!productPrice) {
    return <div>No product found</div>;
  }

  console.log(">>> productPrice", productPrice);

  const expiryDate = (new Date().getTime() + 1000 * 60 * 60 * 24 * 365) / 1000; // 1 year from now
  const mintedAt = new Date().getTime() / 1000;

  const nft_image_url = `${
    process.env.NEXT_PUBLIC_WEBAPP_URL
  }/${collectiveSlug}/membershipcard.svg?name=${encodeURIComponent(
    productPrice.label ?? "Membership"
  )}&mintedAt=${mintedAt}&expiryDate=${expiryDate}`;
  console.log(">>> nft_image_url", nft_image_url);
  return (
    <div className="max-w-screen-lg mx-auto p-4 space-y-4">
      <h1>Payment successful</h1>

      {nft_image_url && (
        <MintNFT
          preview_url={nft_image_url}
          checkout_session_id={checkout_session_id}
        />
      )}
    </div>
  );
}
