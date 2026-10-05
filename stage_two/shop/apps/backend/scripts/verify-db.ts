import { eq } from "drizzle-orm";
import { db } from "../src/db/index.ts";
import { users } from "../src/db/schema/users.ts";

void (async () => {
  const email = `phase2-test-${Date.now()}@example.com`;

  const inserted = await db
    .insert(users)
    .values({
      name: "Phase2 Check",
      email,
      image: null,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
    });

  const found = await db.select().from(users).where(eq(users.email, email));

  console.log(JSON.stringify({ inserted, foundCount: found.length }));
})();
