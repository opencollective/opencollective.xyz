"use client";

import { GraphQLClient, gql } from "graphql-request";
import AbortController from "abort-controller";
import useSWR from "swr";
import HumanNumber from "./HumanNumber";

const query = gql`
  query getCollectiveStats($collectiveSlug: String!, $limit: Int!) {
    Collective(slug: $collectiveSlug) {
      expenses(limit: $limit) {
        id
        createdAt
        description
        amount
        status
      }
      members(role: "BACKER") {
        publicMessage
        member {
          slug
          imageUrl
          name
        }
      }
      currency
      stats {
        balance
        balanceWithBlockedFunds
        backers {
          all
        }
        totalAmountReceived
        totalAmountSpent
      }
    }
  }
`;

type Member = {
  publicMessage: string;
  member: {
    slug: string;
    imageUrl: string;
    name: string;
  };
};

type Expense = {
  id: string;
  createdAt: string;
  description: string;
  amount: number;
  status: string;
};

type ResponseData = {
  Collective: {
    expenses: Expense[];
    members: Member[];
    currency: string;
    stats: {
      balance: number;
      balanceWithBlockedFunds: number;
      backers: {
        all: number;
      };
    };
  };
};

const getOpenCollectiveData = async (collectiveSlug: string, limit: number) => {
  if (!collectiveSlug) throw new Error("Missing collectiveSlug");
  if (!process.env.NEXT_PUBLIC_OC_GRAPHQL_API) {
    throw new Error("Missing OC_GRAPHQL_API env variable");
  }
  const slugParts = collectiveSlug.split("/");
  const slug = slugParts[slugParts.length - 1];
  const controller = new AbortController();
  setTimeout(() => {
    controller.abort();
  }, 3000);
  const graphQLClient = new GraphQLClient(
    process.env.NEXT_PUBLIC_OC_GRAPHQL_API,
    {
      // @ts-expect-error AbortSignal is not typed
      signal: controller.signal,
    }
  );
  try {
    const data: ResponseData = await graphQLClient.request(query, {
      collectiveSlug: slug,
      limit: limit || 5,
    });
    const result = {
      currency: data.Collective.currency,
      amount: `${data.Collective.stats.balance}`,
      stats: data.Collective.stats,
      backers: data.Collective.members,
      expenses: data.Collective.expenses,
    };
    return result;
  } catch (e) {
    console.error(">>> error fetching collective data", e);
    return false;
  }
};

const CollectiveExpenses = ({
  collectiveSlug,
  limit,
  showStatus,
}: {
  collectiveSlug: string;
  limit: number;
  showStatus: boolean;
}) => {
  const { data, error } = useSWR(
    collectiveSlug,
    (collectiveSlug) => getOpenCollectiveData(collectiveSlug, limit),
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000, // 1 minute
      refreshInterval: 60000, // 1 minute
      errorRetryCount: 3,
      errorRetryInterval: 30000, // 30 seconds
      keepPreviousData: true,
    }
  );

  // console.log(">>> error received", error);
  // console.log(">>> data received", data);

  if (error) return <div>An error has occurred: {error.message}.</div>;
  if (!data) return <div className="text-center">Loading...</div>;
  return (
    <div>
      <ul className="list-none m-3">
        {data.expenses.map((expense) => (
          <li
            key={expense.id}
            className="flex flex-row my-2 items-center px-4 py-2 border-b border-gray-200 dark:border-gray-800 justify-between font-bold"
          >
            <div className="mr-2 text-left">
              <a
                href={`https://opencollective.com/${collectiveSlug}/expenses/${expense.id}`}
                title="open expense on opencollective.com"
              >
                {expense.description}
              </a>
            </div>
            <div className="text-right flex flex-row">
              €
              <HumanNumber value={expense.amount / 100} />
            </div>
            {showStatus && (
              <div className="ml-2 w-16 text-center">
                <div className="w-fit inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                  {expense.status === "PAID" ? "paid" : "pending"}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CollectiveExpenses;
