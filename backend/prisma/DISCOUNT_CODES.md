# Predefined welcome codes

`welcome-codes.ts` contains the fixed inventory of 1,000 unique codes. Each grants
100% off, is restricted to the customer's first purchase, and can be redeemed
once across all customers. Share individual codes with their intended recipients;
do not publish the inventory or bundle it into the frontend.

The inventory is ignored by Git and is not required to build or run the app.
Keep an encrypted backup separately from the repository. Before running a seed
on a new machine, securely restore the same file to `backend/prisma/welcome-codes.ts`
and restrict access with `chmod 600 backend/prisma/welcome-codes.ts`.
Seeding fails with a clear error if the file is missing; it never generates a new
batch automatically. Tests use synthetic fixtures and do not need the private file.
Do not force-add the inventory to Git or include it in public deployment artifacts.

From `backend/`, run `npm run db:seed-discounts` to install just these codes.
The regular Prisma seed also installs them. Both commands disable `WELCOME100`
without deleting its payment history. Re-running either command skips existing
codes and never resets their usage counts or reactivates disabled codes.

Redemption uses a conditional increment inside the payment transaction, so two
checkouts cannot successfully consume the same single-use code.
