import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "password123";
const SEED_VERSION_WARD_COUNT = 22; // 21 real Hackney wards + 1 fictional demo ward

// Elected members of Hackney Council following the 7 May 2026 borough elections,
// as reported by the Hackney Citizen and Hackney Council's declared results.
// Victoria and Woodberry Down are only partially confirmed from public reporting;
// unconfirmed seats are deliberately left out rather than guessed.
// Hackney Central's third seat is vacant (elected candidate disqualified).
const REAL_WARDS: { name: string; councillors: { name: string; party: string }[] }[] = [
  {
    name: "Brownswood",
    councillors: [
      { name: "Soraya Adejare", party: "Green" },
      { name: "Florence Schechter", party: "Green" },
    ],
  },
  {
    name: "Cazenove",
    councillors: [
      { name: "Charlie Lawrie", party: "Green" },
      { name: "Emma Neath", party: "Green" },
      { name: "Ian David Sharer", party: "Conservative" },
    ],
  },
  {
    name: "Clissold",
    councillors: [
      { name: "Rachel Maguire", party: "Labour" },
      { name: "Sam Mathys", party: "Green" },
      { name: "George Sheldon Grün", party: "Green" },
    ],
  },
  {
    name: "Dalston",
    councillors: [
      { name: "Zoë Garbett", party: "Green" },
      { name: "Rachel Nkiessu-Guifo", party: "Green" },
    ],
  },
  {
    name: "De Beauvoir",
    councillors: [
      { name: "Paul Anderson", party: "Green" },
      { name: "Gemma Per-Bo", party: "Green" },
    ],
  },
  {
    name: "Hackney Central",
    councillors: [
      { name: "Izzy Castello-Cortes", party: "Green" },
      { name: "Pascale Frazer-Carroll", party: "Green" },
    ],
  },
  {
    name: "Hackney Downs",
    councillors: [
      { name: "Alastair Binnie-Lubbock", party: "Green" },
      { name: "Dylan Law", party: "Green" },
      { name: "Laura-Louise Fairley", party: "Green" },
    ],
  },
  {
    name: "Hackney Wick",
    councillors: [
      { name: "Aaron Briddon", party: "Green" },
      { name: "Tyrone Scott", party: "Green" },
      { name: "Jam Anker", party: "Green" },
    ],
  },
  {
    name: "Haggerston",
    councillors: [
      { name: "Charlene Concepcion", party: "Green" },
      { name: "Siobhan McMahon", party: "Green" },
      { name: "Nisa Sharif", party: "Green" },
    ],
  },
  {
    name: "Homerton",
    councillors: [
      { name: "Anna Lynch", party: "Labour" },
      { name: "Robert Chapman", party: "Labour" },
      { name: "Zoe Holman", party: "Green" },
    ],
  },
  {
    name: "Hoxton East & Shoreditch",
    councillors: [
      { name: "Kam Adams", party: "Labour" },
      { name: "Mihai Chereji", party: "Green" },
      { name: "Janet Lee", party: "Green" },
    ],
  },
  {
    name: "Hoxton West",
    councillors: [
      { name: "Nicholas Blincoe", party: "Green" },
      { name: "Jas Crowe", party: "Green" },
      { name: "Ben Lucas", party: "Labour" },
    ],
  },
  {
    name: "King's Park",
    councillors: [
      { name: "Abi Kingston", party: "Green" },
      { name: "Jasmine O'Connor", party: "Green" },
      { name: "Emmanuel Onapa", party: "Green" },
    ],
  },
  {
    name: "Lea Bridge",
    councillors: [
      { name: "Antoinette Fernandez", party: "Green" },
      { name: "Bettina Maidment", party: "Green" },
      { name: "Sally Zlotowitz", party: "Green" },
    ],
  },
  {
    name: "London Fields",
    councillors: [
      { name: "Anntoinette Bramble", party: "Labour" },
      { name: "Kwame Otiende", party: "Green" },
      { name: "Brenda Puech", party: "Green" },
    ],
  },
  {
    name: "Shacklewell",
    councillors: [
      { name: "Ulgen Semerci", party: "Green" },
      { name: "Cathy Troupp", party: "Green" },
    ],
  },
  {
    name: "Springfield",
    councillors: [
      { name: "Shaul Krautwirt", party: "Conservative" },
      { name: "Michael Levy", party: "Conservative" },
      { name: "Simche Steinberger", party: "Conservative" },
    ],
  },
  {
    name: "Stamford Hill West",
    councillors: [
      { name: "Hershy Lisser", party: "Conservative" },
      { name: "Benzion Papier", party: "Conservative" },
    ],
  },
  {
    name: "Stoke Newington",
    councillors: [
      { name: "Jacob Cable", party: "Green" },
      { name: "Ifhat Shaheen", party: "Green" },
      { name: "Reiner Tegtmeyer", party: "Green" },
    ],
  },
  { name: "Victoria", councillors: [] },
  {
    name: "Woodberry Down",
    councillors: [{ name: "Sarah Young", party: "Labour" }],
  },
];

const TEAM_DEFS: { topic: TeamTopic; name: string; description: string; contactName: string; email: string }[] = [
  {
    topic: "BINS_WASTE",
    name: "Waste & Environment",
    description: "Bin collections, fly-tipping, recycling and street cleaning.",
    contactName: "Waste & Environment Team",
    email: "waste-team@demo.example",
  },
  {
    topic: "ROADS_HIGHWAYS",
    name: "Highways & Transport",
    description: "Potholes, road safety, parking and traffic.",
    contactName: "Highways Team",
    email: "highways-team@demo.example",
  },
  {
    topic: "HOUSING",
    name: "Housing Services",
    description: "Repairs, tenancy issues and housing applications.",
    contactName: "Housing Team",
    email: "housing-team@demo.example",
  },
  {
    topic: "PARKS_ENVIRONMENT",
    name: "Parks & Green Spaces",
    description: "Parks maintenance, trees and green spaces.",
    contactName: "Parks Team",
    email: "parks-team@demo.example",
  },
  {
    topic: "PLANNING",
    name: "Planning",
    description: "Planning applications and enforcement.",
    contactName: "Planning Team",
    email: "planning-team@demo.example",
  },
  {
    topic: "COMMUNITY_SAFETY",
    name: "Community Safety",
    description: "Anti-social behaviour and neighbourhood safety.",
    contactName: "Community Safety Team",
    email: "safety-team@demo.example",
  },
  {
    topic: "COUNCIL_TAX_BENEFITS",
    name: "Revenues & Benefits",
    description: "Council tax and benefits queries.",
    contactName: "Revenues & Benefits Team",
    email: "revenues-team@demo.example",
  },
  {
    topic: "EDUCATION_YOUTH",
    name: "Education & Youth Services",
    description: "Schools admissions and youth services.",
    contactName: "Education Team",
    email: "education-team@demo.example",
  },
  {
    topic: "OTHER",
    name: "Resident Services",
    description: "General enquiries that don't fit elsewhere.",
    contactName: "Resident Services Team",
    email: "resident-services@demo.example",
  },
];

async function wipe() {
  await prisma.submissionUpdate.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.post.deleteMany();
  await prisma.councillor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.council.deleteMany();
}

async function main() {
  const existing = await prisma.council.findUnique({
    where: { slug: "hackney" },
    include: { _count: { select: { wards: true } } },
  });

  if (existing && existing._count.wards === SEED_VERSION_WARD_COUNT) {
    console.log("Seed data already current, skipping.");
    return;
  }

  if (existing) {
    console.log("Outdated seed data found - wiping and reseeding.");
    await wipe();
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const council = await prisma.council.create({
    data: { name: "Hackney Council", slug: "hackney" },
  });

  const teams = new Map<string, { id: string; name: string; userId: string }>();
  for (const t of TEAM_DEFS) {
    const team = await prisma.team.create({
      data: { councilId: council.id, name: t.name, topic: t.topic, description: t.description },
    });
    const teamUser = await prisma.user.create({
      data: { name: t.contactName, email: t.email, passwordHash, role: "TEAM_MEMBER", teamId: team.id },
    });
    teams.set(t.topic, { ...team, userId: teamUser.id });
  }

  // Real wards and councillors: public-record listings only. No accounts, no
  // fabricated bios/posts/metrics - profiles stay factual until claimed.
  for (const w of REAL_WARDS) {
    const ward = await prisma.ward.create({ data: { name: w.name, councilId: council.id } });
    for (const c of w.councillors) {
      await prisma.councillor.create({
        data: { wardId: ward.id, name: c.name, party: c.party },
      });
    }
  }

  // Clearly-fictional demo ward so the full councillor/team workflow can be
  // trialled end-to-end without impersonating a real person.
  const demoWard = await prisma.ward.create({
    data: { name: "Demo Ward (fictional)", councilId: council.id },
  });

  const demoCouncillorUser = await prisma.user.create({
    data: {
      name: "Amara Fletcher (Demo)",
      email: "demo.councillor@demo.example",
      passwordHash,
      role: "COUNCILLOR",
    },
  });
  const demoCouncillor = await prisma.councillor.create({
    data: {
      userId: demoCouncillorUser.id,
      wardId: demoWard.id,
      name: "Amara Fletcher (Demo)",
      party: "Independent (fictional)",
      bio: "A fictional councillor used to demonstrate the platform's casework workflow. Not a real person.",
      isDemo: true,
    },
  });

  await prisma.post.createMany({
    data: [
      {
        councillorId: demoCouncillor.id,
        title: "Welcome to the demo",
        body: "This profile shows how councillors can share updates with residents. Log in as demo.councillor@demo.example to try the councillor dashboard.",
      },
    ],
  });

  const citizen = await prisma.user.create({
    data: { name: "Demo Resident", email: "resident@demo.example", passwordHash, role: "CITIZEN" },
  });

  const wasteTeam = teams.get("BINS_WASTE")!;

  const resolvedSubmission = await prisma.submission.create({
    data: {
      citizenId: citizen.id,
      councillorId: demoCouncillor.id,
      wardId: demoWard.id,
      teamId: wasteTeam.id,
      category: "REPORT_ISSUE",
      topic: "BINS_WASTE",
      subject: "Overflowing bins on Market Street",
      description: "The communal bins have been overflowing for a week and it's attracting pests.",
      status: "RESOLVED",
      visibility: "PUBLISHED",
      publishedSummary: "Arranged an extra weekly collection with the waste team - resolved within 4 days.",
      firstRespondedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.submissionUpdate.createMany({
    data: [
      {
        submissionId: resolvedSubmission.id,
        authorId: citizen.id,
        authorRole: "CITIZEN",
        message: "The bins on Market Street are overflowing again, could this be looked at?",
        visibleToCitizen: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        submissionId: resolvedSubmission.id,
        authorId: demoCouncillorUser.id,
        authorRole: "COUNCILLOR",
        message: "Thanks for flagging this - forwarding to the Waste & Environment team now.",
        visibleToCitizen: true,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        submissionId: resolvedSubmission.id,
        authorId: wasteTeam.userId,
        authorRole: "TEAM_MEMBER",
        message: "We've arranged an additional weekly collection for this location.",
        visibleToCitizen: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  const openSubmission = await prisma.submission.create({
    data: {
      citizenId: citizen.id,
      councillorId: demoCouncillor.id,
      wardId: demoWard.id,
      category: "CASEWORK_SUPPORT",
      topic: "HOUSING",
      subject: "Damp in council flat",
      description: "There's been persistent damp in the bathroom for a few months, would like some advice on next steps.",
      status: "NEW",
      sensitivity: "SENSITIVE",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.submissionUpdate.create({
    data: {
      submissionId: openSubmission.id,
      authorId: citizen.id,
      authorRole: "CITIZEN",
      message: "There's been persistent damp in the bathroom for a few months, would like some advice on next steps.",
      visibleToCitizen: true,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Seed complete: 21 real Hackney wards + demo ward.");
  console.log(`Demo login password for all demo accounts: ${DEMO_PASSWORD}`);
  console.log("Resident: resident@demo.example");
  console.log("Demo councillor: demo.councillor@demo.example");
  for (const t of TEAM_DEFS) console.log(`Team (${t.name}): ${t.email}`);
}

type TeamTopic =
  | "BINS_WASTE"
  | "ROADS_HIGHWAYS"
  | "HOUSING"
  | "PARKS_ENVIRONMENT"
  | "PLANNING"
  | "COMMUNITY_SAFETY"
  | "COUNCIL_TAX_BENEFITS"
  | "EDUCATION_YOUTH"
  | "OTHER";

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
