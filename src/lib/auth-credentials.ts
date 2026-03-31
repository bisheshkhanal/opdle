import bcrypt from "bcryptjs";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type AuthorizeInput = {
  username?: string;
  password?: string;
};

type AuthUserRow = {
  id: string;
  username: string;
  passwordHash: string;
};

type QueryBuilder = {
  from: (table: typeof users) => {
    where: (condition: ReturnType<typeof eq>) => Promise<AuthUserRow[]>;
  };
};

export interface AuthorizeDBLike {
  select: () => QueryBuilder;
}

export async function authorizeCredentials(
  credentials: Partial<AuthorizeInput>,
  database: AuthorizeDBLike
): Promise<{ id: string; name: string } | null> {
  if (
    typeof credentials.username !== "string" ||
    typeof credentials.password !== "string" ||
    credentials.username.length === 0 ||
    credentials.password.length === 0
  ) {
    return null;
  }

  const [user] = await database
    .select()
    .from(users)
    .where(eq(users.username, credentials.username));

  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(credentials.password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return { id: user.id, name: user.username };
}
