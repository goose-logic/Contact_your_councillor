import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { councilKey, councilSlug, wardKey } from "../src/lib/borough";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "password123";
const DEMO_SLUG = "demo-borough";
const EXPECTED_MIN_COUNCILLORS = 18000;

type Raw = {
  council: string;
  ward: string | null;
  name: string;
  party: string | null;
  email: string | null;
};

const TEAM_DEFS: { topic: TeamTopic; name: string; description: string; contactName: string; email: string }[] = [
  { topic: "BINS_WASTE", name: "Waste & Environment", description: "Bin collections, fly-tipping, recycling and street cleaning.", contactName: "Waste & Environment Team", email: "waste-team@demo.example" },
  { topic: "ROADS_HIGHWAYS", name: "Highways & Transport", description: "Potholes, road safety, parking and traffic.", contactName: "Highways Team", email: "highways-team@demo.example" },
  { topic: "HOUSING", name: "Housing Services", description: "Repairs, tenancy issues and housing applications.", contactName: "Housing Team", email: "housing-team@demo.example" },
  { topic: "PARKS_ENVIRONMENT", name: "Parks & Green Spaces", description: "Parks maintenance, trees and green spaces.", contactName: "Parks Team", email: "parks-team@demo.example" },
  { topic: "PLANNING", name: "Planning", description: "Planning applications and enforcement.", contactName: "Planning Team", email: "planning-team@demo.example" },
  { topic: "COMMUNITY_SAFETY", name: "Community Safety", description: "Anti-social behaviour and neighbourhood safety.", contactName: "Community Safety Team", email: "safety-team@demo.example" },
  { topic: "COUNCIL_TAX_BENEFITS", name: "Revenues & Benefits", description: "Council tax and benefits queries.", contactName: "Revenues & Benefits Team", email: "revenues-team@demo.example" },
  { topic: "EDUCATION_YOUTH", name: "Education & Youth Services", description: "Schools admissions and youth services.", contactName: "Education Team", email: "education-team@demo.example" },
  { topic: "OTHER", name: "Resident Services", description: "General enquiries that don't fit elsewhere.", contactName: "Resident Services Team", email: "resident-services@demo.example" },
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

async function seedReal() {
  const data: Raw[] = JSON.parse(readFileSync(join(__dirname, "ukCouncillors.json"), "utf-8"));

  // Group councillors by council, then by ward.
  const byCouncil = new Map<string, Raw[]>();
  for (const c of data) {
    const list = byCouncil.get(c.council) ?? [];
    list.push(c);
    byCouncil.set(c.council, list);
  }

  const usedSlugs = new Set<string>();
  let wardCount = 0;

  for (const [councilName, councillors] of byCouncil) {
    let slug = councilSlug(councilName);
    while (usedSlugs.has(slug)) slug = `${slug}-x`;
    usedSlugs.add(slug);

    const council = await prisma.council.create({
      data: { name: councilName, slug, matchKey: councilKey(councilName) },
    });

    // Create the distinct wards for this council.
    const wardNames = [...new Set(councillors.map((c) => c.ward).filter((w): w is string => !!w))];
    if (wardNames.length) {
      await prisma.ward.createMany({
        data: wardNames.map((name) => ({ councilId: council.id, name, matchKey: wardKey(name) })),
      });
      wardCount += wardNames.length;
    }
    const wards = await prisma.ward.findMany({
      where: { councilId: council.id },
      select: { id: true, name: true },
    });
    const wardId = new Map(wards.map((w) => [w.name, w.id]));

    await prisma.councillor.createMany({
      data: councillors.map((c) => ({
        councilId: council.id,
        wardId: c.ward ? wardId.get(c.ward) ?? null : null,
        name: c.name,
        party: c.party,
        email: c.email,
      })),
    });
  }

  return { councils: byCouncil.size, councillors: data.length, wards: wardCount };
}

async function seedDemo(passwordHash: string) {
  const demoCouncil = await prisma.council.create({
    data: { name: "Demo Borough (fictional)", slug: DEMO_SLUG, matchKey: "__demo__", isDemo: true },
  });

  const teams = new Map<string, { id: string; name: string; userId: string }>();
  for (const t of TEAM_DEFS) {
    const team = await prisma.team.create({
      data: { councilId: demoCouncil.id, name: t.name, topic: t.topic, description: t.description },
    });
    const teamUser = await prisma.user.create({
      data: { name: t.contactName, email: t.email, passwordHash, role: "TEAM_MEMBER", teamId: team.id },
    });
    teams.set(t.topic, { ...team, userId: teamUser.id });
  }

  const demoWard = await prisma.ward.create({
    data: { name: "Demo Ward (fictional)", matchKey: "__demo_ward__", councilId: demoCouncil.id },
  });

  const demoCouncillorUser = await prisma.user.create({
    data: { name: "Amara Fletcher (Demo)", email: "demo.councillor@demo.example", passwordHash, role: "COUNCILLOR" },
  });
  const demoCouncillor = await prisma.councillor.create({
    data: {
      userId: demoCouncillorUser.id,
      councilId: demoCouncil.id,
      wardId: demoWard.id,
      name: "Amara Fletcher (Demo)",
      party: "Independent (fictional)",
      role: "Councillor",
      bio: "A fictional councillor used to demonstrate the platform's casework workflow. Not a real person.",
      isDemo: true,
    },
  });

  await prisma.post.create({
    data: {
      councillorId: demoCouncillor.id,
      title: "Welcome to the demo",
      body: "This profile shows how councillors can share updates with residents. Log in as demo.councillor@demo.example to try the councillor dashboard.",
    },
  });

  const citizen = await prisma.user.create({
    data: { name: "Demo Resident", email: "resident@demo.example", passwordHash, role: "CITIZEN" },
  });

  const wasteTeam = teams.get("BINS_WASTE")!;

  const resolved = await prisma.submission.create({
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
      firstRespondedAt: new Date(Date.now() - 6 * 864e5),
      resolvedAt: new Date(Date.now() - 2 * 864e5),
      createdAt: new Date(Date.now() - 7 * 864e5),
    },
  });

  await prisma.submissionUpdate.createMany({
    data: [
      { submissionId: resolved.id, authorId: citizen.id, authorRole: "CITIZEN", message: "The bins on Market Street are overflowing again, could this be looked at?", visibleToCitizen: true, createdAt: new Date(Date.now() - 7 * 864e5) },
      { submissionId: resolved.id, authorId: demoCouncillorUser.id, authorRole: "COUNCILLOR", message: "Thanks for flagging this - forwarding to the Waste & Environment team now.", visibleToCitizen: true, createdAt: new Date(Date.now() - 6 * 864e5) },
      { submissionId: resolved.id, authorId: wasteTeam.userId, authorRole: "TEAM_MEMBER", message: "We've arranged an additional weekly collection for this location.", visibleToCitizen: true, createdAt: new Date(Date.now() - 3 * 864e5) },
    ],
  });

  const open = await prisma.submission.create({
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
      createdAt: new Date(Date.now() - 864e5),
    },
  });

  await prisma.submissionUpdate.create({
    data: { submissionId: open.id, authorId: citizen.id, authorRole: "CITIZEN", message: "There's been persistent damp in the bathroom for a few months, would like some advice on next steps.", visibleToCitizen: true, createdAt: new Date(Date.now() - 864e5) },
  });
}

async function main() {
  const councillorCount = await prisma.councillor.count();
  const demoCouncil = await prisma.council.findUnique({ where: { slug: DEMO_SLUG } });

  if (demoCouncil && councillorCount > EXPECTED_MIN_COUNCILLORS) {
    console.log("Seed data already current, skipping.");
    return;
  }

  console.log("Seeding UK councillor data (this loads ~19k councillors)...");
  await wipe();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const { councils, councillors, wards } = await seedReal();
  await seedDemo(passwordHash);

  console.log(`Seed complete: ${councillors} councillors, ${wards} wards, ${councils} councils, plus a demo borough.`);
  console.log(`Demo login password for all demo accounts: ${DEMO_PASSWORD}`);
  console.log("Resident: resident@demo.example | Demo councillor: demo.councillor@demo.example");
}

type TeamTopic =
  | "BINS_WASTE" | "ROADS_HIGHWAYS" | "HOUSING" | "PARKS_ENVIRONMENT"
  | "PLANNING" | "COMMUNITY_SAFETY" | "COUNCIL_TAX_BENEFITS" | "EDUCATION_YOUTH" | "OTHER";

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
