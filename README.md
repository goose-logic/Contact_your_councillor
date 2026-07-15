# Contact Your Councillor

An MVP for residents to find their local councillor by postcode, see what they've been up to, and
raise an issue that gets routed to the right council team — with visible progress from submission
to resolution.

Demo data covers a pilot borough (Hackney) with real ward names (via the free
[postcodes.io](https://postcodes.io) API) but fictional councillor profiles, clearly labelled as
placeholder data.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS
- Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`) + PostgreSQL
- Auth.js / NextAuth v5 (Credentials provider, JWT sessions)

## Roles

- **Resident (citizen)** — looks up their address, browses councillor profiles, submits a
  categorized contact request, and tracks updates.
- **Councillor** — triages incoming submissions, forwards them to the relevant council team,
  posts updates, marks issues resolved, and optionally publishes a resolution summary to their
  public profile (unless marked sensitive).
- **Council team member** — sees items forwarded to their team and responds.

Public self-signup only creates resident accounts. Councillor and team accounts are seeded demo
accounts (see below) since those would require real-world verification.

## Local development

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL (any Postgres) and NEXTAUTH_SECRET
npm run db:push
npm run db:seed
npm run dev
```

The seed script prints demo login credentials for a resident, a councillor per ward, and a
council-team member per team. All seeded accounts share the password `password123`.

## Deploying / live preview

The `build` script runs `prisma generate`, then `prisma db push` + the seed script against
whatever `DATABASE_URL` is configured, then `next build`. If `DATABASE_URL` isn't set yet, the
DB step is skipped gracefully so the app still deploys (pages just won't have data until the
database is connected).

To connect a real database on Vercel:

1. In the Vercel project → **Storage** tab → **Create Database** → choose a Postgres option
   (this auto-populates `DATABASE_URL` for the project).
2. Add a `NEXTAUTH_SECRET` env var (generate one with `openssl rand -base64 32`).
3. Redeploy — the next build will create the schema and seed the demo data automatically.
