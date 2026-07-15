import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "password123";

async function main() {
  const existing = await prisma.council.findUnique({ where: { slug: "hackney" } });
  if (existing) {
    console.log("Seed data already present, skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const council = await prisma.council.create({
    data: { name: "Hackney Council", slug: "hackney" },
  });

  const teamDefs: { topic: TeamTopic; name: string; description: string; contactName: string; email: string }[] = [
    {
      topic: "BINS_WASTE",
      name: "Waste & Environment",
      description: "Bin collections, fly-tipping, recycling and street cleaning.",
      contactName: "Waste & Environment Team",
      email: "waste-team@demo.hackney.gov.uk",
    },
    {
      topic: "ROADS_HIGHWAYS",
      name: "Highways & Transport",
      description: "Potholes, road safety, parking and traffic.",
      contactName: "Highways Team",
      email: "highways-team@demo.hackney.gov.uk",
    },
    {
      topic: "HOUSING",
      name: "Housing Services",
      description: "Repairs, tenancy issues and housing applications.",
      contactName: "Housing Team",
      email: "housing-team@demo.hackney.gov.uk",
    },
    {
      topic: "PARKS_ENVIRONMENT",
      name: "Parks & Green Spaces",
      description: "Parks maintenance, trees and green spaces.",
      contactName: "Parks Team",
      email: "parks-team@demo.hackney.gov.uk",
    },
    {
      topic: "PLANNING",
      name: "Planning",
      description: "Planning applications and enforcement.",
      contactName: "Planning Team",
      email: "planning-team@demo.hackney.gov.uk",
    },
    {
      topic: "COMMUNITY_SAFETY",
      name: "Community Safety",
      description: "Anti-social behaviour and neighbourhood safety.",
      contactName: "Community Safety Team",
      email: "safety-team@demo.hackney.gov.uk",
    },
    {
      topic: "COUNCIL_TAX_BENEFITS",
      name: "Revenues & Benefits",
      description: "Council tax and benefits queries.",
      contactName: "Revenues & Benefits Team",
      email: "revenues-team@demo.hackney.gov.uk",
    },
    {
      topic: "EDUCATION_YOUTH",
      name: "Education & Youth Services",
      description: "Schools admissions and youth services.",
      contactName: "Education Team",
      email: "education-team@demo.hackney.gov.uk",
    },
    {
      topic: "OTHER",
      name: "Resident Services",
      description: "General enquiries that don't fit elsewhere.",
      contactName: "Resident Services Team",
      email: "resident-services@demo.hackney.gov.uk",
    },
  ];

  const teams = new Map<string, { id: string; name: string; userId: string }>();
  for (const t of teamDefs) {
    const team = await prisma.team.create({
      data: { councilId: council.id, name: t.name, topic: t.topic, description: t.description },
    });

    const teamUser = await prisma.user.create({
      data: {
        name: t.contactName,
        email: t.email,
        passwordHash,
        role: "TEAM_MEMBER",
        teamId: team.id,
      },
    });
    teams.set(t.topic, { ...team, userId: teamUser.id });
  }

  const wardDefs = ["Dalston", "London Fields", "Hackney Central", "Stoke Newington", "Homerton"];

  const councillorSeed = [
    {
      ward: "Dalston",
      name: "Amara Fletcher",
      party: "Labour",
      email: "amara.fletcher@demo.hackney.gov.uk",
      bio: "Amara has represented Dalston for four years, focusing on housing quality and support for local high streets.",
    },
    {
      ward: "London Fields",
      name: "Daniel Osei",
      party: "Green Party",
      email: "daniel.osei@demo.hackney.gov.uk",
      bio: "Daniel campaigns on green spaces, cycling infrastructure and reducing waste across the ward.",
    },
    {
      ward: "Hackney Central",
      name: "Priya Chandran",
      party: "Labour",
      email: "priya.chandran@demo.hackney.gov.uk",
      bio: "Priya works closely with local schools and community groups, with a focus on youth services.",
    },
    {
      ward: "Stoke Newington",
      name: "Tom Whitfield",
      party: "Liberal Democrat",
      email: "tom.whitfield@demo.hackney.gov.uk",
      bio: "Tom has a background in urban planning and pushes for better public transport links.",
    },
    {
      ward: "Homerton",
      name: "Grace Adebayo",
      party: "Independent",
      email: "grace.adebayo@demo.hackney.gov.uk",
      bio: "Grace is an independent voice on the council, prioritising responsive casework for residents.",
    },
  ];

  const wardRecords = new Map<string, { id: string }>();
  for (const name of wardDefs) {
    const ward = await prisma.ward.create({ data: { name, councilId: council.id } });
    wardRecords.set(name, ward);
  }

  const councillorRecords = new Map<string, { id: string; wardId: string; userId: string }>();
  for (const c of councillorSeed) {
    const ward = wardRecords.get(c.ward)!;
    const user = await prisma.user.create({
      data: { name: c.name, email: c.email, passwordHash, role: "COUNCILLOR" },
    });
    const councillor = await prisma.councillor.create({
      data: { userId: user.id, wardId: ward.id, party: c.party, bio: c.bio },
    });
    councillorRecords.set(c.ward, { id: councillor.id, wardId: ward.id, userId: user.id });

    await prisma.post.createMany({
      data: [
        {
          councillorId: councillor.id,
          title: `Update from ${c.ward}`,
          body: `Thanks to everyone who came to the last residents' meeting in ${c.ward} — great turnout and lots of useful feedback.`,
        },
        {
          councillorId: councillor.id,
          title: "Surgery hours this month",
          body: "I'll be holding my regular residents' surgery this month — drop by with any local issues.",
        },
      ],
    });
  }

  // A demo citizen + a couple of example submissions so the flow is visible immediately.
  const citizen = await prisma.user.create({
    data: {
      name: "Demo Resident",
      email: "resident@demo.local",
      passwordHash,
      role: "CITIZEN",
    },
  });

  const dalston = councillorRecords.get("Dalston")!;
  const wasteTeam = teams.get("BINS_WASTE")!;

  const resolvedSubmission = await prisma.submission.create({
    data: {
      citizenId: citizen.id,
      councillorId: dalston.id,
      wardId: dalston.wardId,
      teamId: wasteTeam.id,
      category: "REPORT_ISSUE",
      topic: "BINS_WASTE",
      subject: "Overflowing bins on Ridley Road",
      description: "The communal bins outside the market have been overflowing for a week and it's attracting pests.",
      status: "RESOLVED",
      visibility: "PUBLISHED",
      publishedSummary: "Arranged an extra weekly collection with the waste team — resolved within 4 days.",
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
        message: "The bins outside Ridley Road Market are overflowing again, could this be looked at?",
        visibleToCitizen: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        submissionId: resolvedSubmission.id,
        authorId: dalston.userId,
        authorRole: "COUNCILLOR",
        message: "Thanks for flagging this — forwarding to the Waste & Environment team now.",
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
      councillorId: dalston.id,
      wardId: dalston.wardId,
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

  console.log("Seed complete.");
  console.log(`Demo login password for all seeded accounts: ${DEMO_PASSWORD}`);
  console.log("Resident: resident@demo.local");
  for (const c of councillorSeed) console.log(`Councillor (${c.ward}): ${c.email}`);
  for (const t of teamDefs) console.log(`Team (${t.name}): ${t.email}`);
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
