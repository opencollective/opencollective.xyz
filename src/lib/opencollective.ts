import { GraphQLClient, gql } from "graphql-request";
import AbortController from "abort-controller";

type Transfer = {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  tx_hash?: string;
  nonce?: number;
  token_id?: number;
  created_at?: Date;
};
type ExtendedTransfer = Transfer & {
  fromProfile?: {
    name: string;
    imgsrc: string;
  };
  currency: string;
  data: {
    description?: string;
    originalCurrency?: string;
    originalValue?: number;
    valueUSD?: number;
    valueEUR?: number;
    via?: string;
  } | null;
};

type Transaction = {
  id: string;
  uuid: string;
  createdAt: string;
  hostCurrency: string;
  amount: number;
  description: string;
  fromCollective: {
    slug: string;
    name: string;
    imageUrl: string;
  };
};

type GraphQLResponse = {
  allTransactions: Transaction[];
};

const transactionsQuery = gql`
  query getTransactions(
    $collectiveSlug: String!
    $dateFrom: String
    $dateTo: String
    $limit: Int
  ) {
    allTransactions(
      collectiveSlug: $collectiveSlug
      type: "CREDIT"
      dateFrom: $dateFrom
      dateTo: $dateTo
      limit: $limit
    ) {
      id
      uuid
      createdAt
      hostCurrency
      amount
      description
      fromCollective {
        slug
        name
        imageUrl
      }
    }
  }
`;

export const getTransactions = async (
  collectiveSlug: string,
  dateFrom?: Date,
  dateTo?: Date,
  limit?: number
) => {
  if (!collectiveSlug) throw new Error("Missing collectiveSlug");

  const slugParts = collectiveSlug.split("/");
  const slug = slugParts[slugParts.length - 1];
  const controller = new AbortController();
  setTimeout(() => {
    controller.abort();
  }, 3000);
  const graphQLClient = new GraphQLClient(
    process.env.NEXT_PUBLIC_OC_GRAPHQL_API || "",
    {
      // @ts-expect-error signal is not typed
      signal: controller.signal,
    }
  );
  try {
    const res = await graphQLClient.request<GraphQLResponse>(
      transactionsQuery,
      {
        collectiveSlug: slug,
        dateFrom,
        limit,
      }
    );
    console.log(">>> result since", dateFrom, res);
    if (!res.allTransactions) return [];
    const transactions = res.allTransactions || [];
    const transfers: ExtendedTransfer[] = [];
    transactions.map((transaction) => {
      transfers.push({
        hash: `oc#${transaction.id}`,
        tx_hash: transaction.uuid,
        to: `https://opencollective.com/${slug}`,
        nonce: 0,
        token_id: 0,
        status: "confirmed",
        created_at: new Date(transaction.createdAt),
        timestamp: new Date(transaction.createdAt).getTime(),
        from: `https://opencollective.com/${transaction.fromCollective.slug}`,
        fromProfile: {
          name: transaction.fromCollective.name,
          imgsrc: transaction.fromCollective.imageUrl,
        },
        value: String((transaction.amount / 100) * 10 ** 6),
        currency: transaction.hostCurrency,
        data: {
          description: transaction.description,
          via: "Open Collective",
        },
      });
    });
    console.log(">>> transfers", transfers);
    return transfers;
  } catch (e) {
    console.error(">>> error", e);
    return [];
  }
};
