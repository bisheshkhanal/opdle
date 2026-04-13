import { describe, expect, it, beforeEach, vi } from "vitest";

type SubscriptionRow = {
  id: string;
  userId: string;
  endpoint: string;
  p256dhKey: string;
  authKey: string;
  userAgent: string;
  timezone: string | null;
  utcOffset: number | null;
  appOptIn: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type Condition =
  | { type: "eq"; left: string; right: unknown }
  | { type: "and"; conditions: Condition[] };

const { mockAuth, mockEq, mockAnd, store, mockDb } = vi.hoisted(() => {
  const store: SubscriptionRow[] = [];

  const mockEq = vi.fn(
    (left: string, right: unknown): Condition => ({
      type: "eq",
      left,
      right,
    })
  );

  const mockAnd = vi.fn(
    (...conditions: Condition[]): Condition => ({
      type: "and",
      conditions,
    })
  );

  const matches = (row: SubscriptionRow, condition: Condition): boolean => {
    if (condition.type === "eq") {
      return row[condition.left as keyof SubscriptionRow] === condition.right;
    }

    return condition.conditions.every((item) => matches(row, item));
  };

  const cloneRow = (row: SubscriptionRow): SubscriptionRow => ({
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  });

  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async (condition: Condition) =>
          store.filter((row) => matches(row, condition)).map(cloneRow)
        ),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(
        (
          values: Omit<SubscriptionRow, "id" | "createdAt"> & {
            updatedAt: Date;
          }
        ) => ({
          onConflictDoUpdate: vi.fn(() => ({
            returning: vi.fn(async () => {
              const now = new Date(values.updatedAt);
              const existingIndex = store.findIndex(
                (row) => row.endpoint === values.endpoint
              );

              if (existingIndex >= 0) {
                const nextRow = {
                  ...store[existingIndex],
                  ...values,
                  updatedAt: now,
                };
                store[existingIndex] = nextRow;
                return [cloneRow(nextRow)];
              }

              const nextRow: SubscriptionRow = {
                id: `subscription-${store.length + 1}`,
                createdAt: now,
                ...values,
              };
              store.push(nextRow);
              return [cloneRow(nextRow)];
            }),
          })),
        })
      ),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(async (condition: Condition) => {
        for (let index = store.length - 1; index >= 0; index -= 1) {
          if (matches(store[index], condition)) {
            store.splice(index, 1);
          }
        }

        return [] as SubscriptionRow[];
      }),
    })),
  };

  return {
    mockAuth: vi.fn(),
    mockEq,
    mockAnd,
    store,
    mockDb,
  };
});

vi.mock("drizzle-orm", () => ({
  eq: mockEq,
  and: mockAnd,
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/db/schema", () => ({
  pushSubscriptions: {
    id: "id",
    userId: "userId",
    endpoint: "endpoint",
    p256dhKey: "p256dhKey",
    authKey: "authKey",
    userAgent: "userAgent",
    timezone: "timezone",
    utcOffset: "utcOffset",
    appOptIn: "appOptIn",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
}));

const session = {
  user: { id: "user-1", name: "luffy", email: null, image: null },
  expires: "",
};

const createRequest = (method: string, body: unknown) =>
  new Request("http://localhost/api/notifications/subscriptions", {
    method,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "user-agent": "Vitest Browser",
    },
  });

describe("/api/notifications/subscriptions", () => {
  beforeEach(() => {
    vi.resetModules();
    mockAuth.mockReset();
    mockEq.mockClear();
    mockAnd.mockClear();
    store.splice(0, store.length);
  });

  it("returns 401 for unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);
    const { GET, POST, DELETE } = await import("../route");
    const getHandler = GET as () => Promise<Response>;
    const postHandler = POST as (request: Request) => Promise<Response>;
    const deleteHandler = DELETE as (request: Request) => Promise<Response>;

    expect((await getHandler()).status).toBe(401);
    expect((await postHandler(createRequest("POST", {}))).status).toBe(401);
    expect((await deleteHandler(createRequest("DELETE", {}))).status).toBe(401);
  });

  it("creates and lists the authenticated user's active subscription", async () => {
    mockAuth.mockResolvedValue(session);
    const { POST, GET } = await import("../route");
    const postHandler = POST as (request: Request) => Promise<Response>;
    const getHandler = GET as () => Promise<Response>;

    const payload = {
      endpoint: "https://push.example.com/abc",
      keys: {
        p256dh: "dGVzdC1wMjU2ZGg=",
        auth: "dGVzdC1hdXRo",
      },
      timezone: "Asia/Kolkata",
      utcOffset: 330,
    };

    const postResponse = await postHandler(createRequest("POST", payload));
    expect(postResponse.status).toBe(200);
    expect(postResponse).toBeDefined();

    const postJson = (await postResponse!.json()) as {
      subscription: SubscriptionRow;
    };
    expect(postJson.subscription.endpoint).toBe(payload.endpoint);
    expect(postJson.subscription.userId).toBe("user-1");
    expect(postJson.subscription.appOptIn).toBe(true);

    const getResponse = await getHandler();
    expect(getResponse.status).toBe(200);

    const getJson = (await getResponse.json()) as {
      subscriptions: SubscriptionRow[];
    };
    expect(getJson.subscriptions).toHaveLength(1);
    expect(getJson.subscriptions[0]?.endpoint).toBe(payload.endpoint);
  });

  it("upserts duplicate endpoints instead of creating duplicates", async () => {
    mockAuth.mockResolvedValue(session);
    const { POST, GET } = await import("../route");
    const postHandler = POST as (request: Request) => Promise<Response>;
    const getHandler = GET as () => Promise<Response>;

    const firstPayload = {
      endpoint: "https://push.example.com/abc",
      keys: {
        p256dh: "dGVzdC1wMjU2ZGg=",
        auth: "dGVzdC1hdXRo",
      },
      timezone: "Asia/Kolkata",
      utcOffset: 330,
    };

    const secondPayload = {
      ...firstPayload,
      keys: {
        p256dh: "dXBkYXRlZC1wMjU2ZGg=",
        auth: "dXBkYXRlZC1hdXRo",
      },
      utcOffset: 300,
    };

    await postHandler(createRequest("POST", firstPayload));
    await postHandler(createRequest("POST", secondPayload));

    expect(store).toHaveLength(1);
    expect(store[0]?.p256dhKey).toBe("dXBkYXRlZC1wMjU2ZGg=");
    expect(store[0]?.utcOffset).toBe(300);

    const getResponse = await getHandler();
    const getJson = (await getResponse.json()) as {
      subscriptions: SubscriptionRow[];
    };
    expect(getJson.subscriptions).toHaveLength(1);
  });

  it("deletes the authenticated user's subscription by endpoint", async () => {
    mockAuth.mockResolvedValue(session);
    const { POST, DELETE, GET } = await import("../route");
    const postHandler = POST as (request: Request) => Promise<Response>;
    const deleteHandler = DELETE as (request: Request) => Promise<Response>;
    const getHandler = GET as () => Promise<Response>;

    const payload = {
      endpoint: "https://push.example.com/abc",
      keys: {
        p256dh: "dGVzdC1wMjU2ZGg=",
        auth: "dGVzdC1hdXRo",
      },
    };

    await postHandler(createRequest("POST", payload));
    const deleteResponse = await deleteHandler(
      createRequest("DELETE", { endpoint: payload.endpoint })
    );

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse).toBeDefined();
    expect(store).toHaveLength(0);

    const getResponse = await getHandler();
    const getJson = (await getResponse.json()) as {
      subscriptions: SubscriptionRow[];
    };
    expect(getJson.subscriptions).toHaveLength(0);
  });
});
