import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../src/db.js";
import {
  COMPLAINT_STATUS,
  EVENT_APPROVAL_STATUS,
  EVENT_STATUS,
  FINE_STATUS,
  REGISTRATION_STATUS,
  ROLES,
} from "../src/lib/constants.js";
import { sendConfirmationEmail, toEventEmailData } from "../src/mail/mailer.js";
import { runFeedbackJob, runReminderJob } from "../src/scheduler.js";

const DEMO_PASSWORD = "password123";
const now = new Date();
const hours = (h: number) => new Date(now.getTime() + h * 3600_000);
const days = (d: number) => new Date(now.getTime() + d * 86_400_000);
const ticket = () =>
  `UEV-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

const AVATARS = [
  "indigo",
  "violet",
  "fuchsia",
  "sky",
  "emerald",
  "amber",
  "rose",
];

async function main() {
  console.log("Seeding UniEvents…");

  // --- Reset (respect FK order) ------------------------------------------
  await prisma.emailMessage.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.eventCoHost.deleteMany();
  await prisma.event.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);

  // --- Categories --------------------------------------------------------
  const categoryDefs = [
    { name: "Technology", slug: "technology", color: "#2563EB", icon: "Cpu" },
    { name: "Business", slug: "business", color: "#7C3AED", icon: "Briefcase" },
    {
      name: "Arts & Culture",
      slug: "arts-culture",
      color: "#DB2777",
      icon: "Palette",
    },
    { name: "Career", slug: "career", color: "#059669", icon: "GraduationCap" },
    {
      name: "Health & Sports",
      slug: "health-sports",
      color: "#EA580C",
      icon: "Activity",
    },
    { name: "Academic", slug: "academic", color: "#0891B2", icon: "BookOpen" },
  ];
  const categories: Record<string, { id: string; name: string }> = {};
  for (const c of categoryDefs) {
    const row = await prisma.category.create({ data: c });
    categories[c.slug] = { id: row.id, name: row.name };
  }

  // --- Staff (admin + organizers) ----------------------------------------
  const admin = await prisma.user.create({
    data: {
      name: "Dr. Sarah Chen",
      email: "admin@uni.edu",
      passwordHash,
      role: ROLES.ADMIN,
      department: "Student Affairs",
      avatarColor: "violet",
    },
  });
  const organizer = await prisma.user.create({
    data: {
      name: "Marcus Rivera",
      email: "organizer@uni.edu",
      passwordHash,
      role: ROLES.ORGANIZER,
      department: "Events Office",
      avatarColor: "indigo",
    },
  });
  const organizer2 = await prisma.user.create({
    data: {
      name: "Priya Patel",
      email: "organizer2@uni.edu",
      passwordHash,
      role: ROLES.ORGANIZER,
      department: "Computer Science",
      avatarColor: "emerald",
    },
  });

  // --- Students ----------------------------------------------------------
  const named = [
    { name: "Alex Johnson", email: "student@uni.edu" }, // primary demo student
    { name: "Emma Wilson", email: "emma@uni.edu" },
    { name: "Liam Brown", email: "liam@uni.edu" },
    { name: "Sophia Davis", email: "sophia@uni.edu" },
    { name: "Noah Martinez", email: "noah@uni.edu" },
    { name: "Olivia Garcia", email: "olivia@uni.edu" },
    { name: "Ethan Lee", email: "ethan@uni.edu" },
    { name: "Ava Nguyen", email: "ava@uni.edu" },
    { name: "Mia Patel", email: "mia@uni.edu" },
    { name: "Lucas Kim", email: "lucas@uni.edu" },
  ];
  const firstNames = [
    "Jack",
    "Zoe",
    "Leo",
    "Ruby",
    "Owen",
    "Chloe",
    "Max",
    "Lily",
    "Sam",
    "Nora",
    "Kai",
    "Isla",
    "Finn",
    "Maya",
    "Cole",
    "Elle",
    "Jude",
    "Anya",
    "Reid",
    "Tess",
    "Beau",
    "Iris",
    "Cruz",
    "Wren",
    "Dean",
    "Faye",
    "Gray",
    "June",
    "Hugo",
    "Skye",
  ];
  const lastNames = [
    "Adams",
    "Bell",
    "Cole",
    "Diaz",
    "Ford",
    "Gray",
    "Hill",
    "Ito",
    "Jones",
    "Kaur",
    "Lopez",
    "Moore",
    "Novak",
    "Ortiz",
    "Price",
    "Quinn",
    "Reed",
    "Shah",
    "Tran",
    "Vega",
    "Ward",
    "Xu",
    "Yang",
    "Zhao",
    "Ali",
    "Bose",
    "Choi",
    "Dutta",
    "Efron",
    "Frost",
  ];
  const students: { id: string; name: string; email: string }[] = [];
  for (let i = 0; i < named.length; i++) {
    const u = await prisma.user.create({
      data: {
        name: named[i].name,
        email: named[i].email,
        passwordHash,
        role: ROLES.STUDENT,
        department: "Undergraduate",
        studentId: `S${100000 + i}`,
        avatarColor: AVATARS[i % AVATARS.length],
      },
    });
    students.push({ id: u.id, name: u.name, email: u.email });
  }
  for (let i = 0; i < 30; i++) {
    const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
    const u = await prisma.user.create({
      data: {
        name,
        email: `student${i + 11}@uni.edu`,
        passwordHash,
        role: ROLES.STUDENT,
        department: "Undergraduate",
        studentId: `S${200000 + i}`,
        avatarColor: AVATARS[i % AVATARS.length],
      },
    });
    students.push({ id: u.id, name: u.name, email: u.email });
  }
  const alex = students[0];
  const pool = students.slice(1); // everyone except the primary demo student

  const img = (id: string) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

  // --- Events ------------------------------------------------------------
  type EventDef = {
    key: string;
    title: string;
    category: string;
    host: string;
    coHosts?: string[];
    startsAt: Date;
    endsAt: Date;
    seatLimit: number;
    featured?: boolean;
    location: string;
    description: string;
    cover: string;
    tags: string[];
    agenda: { time: string; title: string; speaker?: string }[];
    speakers: { name: string; role?: string; initials?: string }[];
  };

  const hostId = (email: string) =>
    email === "admin@uni.edu"
      ? admin.id
      : email === "organizer2@uni.edu"
        ? organizer2.id
        : organizer.id;

  const eventDefs: EventDef[] = [
    {
      key: "ai-summit",
      title: "AI & Machine Learning Summit 2026",
      category: "technology",
      host: "organizer@uni.edu",
      coHosts: ["organizer2@uni.edu"],
      startsAt: hours(20),
      endsAt: hours(24),
      seatLimit: 120,
      featured: true,
      location: "Engineering Auditorium, Block C",
      description:
        "A full-day summit exploring the frontier of AI — from large language models to computer vision. Keynotes, hands-on labs, and a research showcase from faculty and students.",
      cover: img("photo-1518770660439-4636190af475"),
      tags: ["AI", "Machine Learning", "Research", "Keynote"],
      agenda: [
        { time: "09:00", title: "Registration & Coffee" },
        {
          time: "10:00",
          title: "Keynote: The Next Decade of AI",
          speaker: "Dr. Sarah Chen",
        },
        {
          time: "12:30",
          title: "Hands-on Lab: Fine-tuning LLMs",
          speaker: "Priya Patel",
        },
        { time: "15:00", title: "Student Research Showcase" },
      ],
      speakers: [
        { name: "Dr. Sarah Chen", role: "Keynote Speaker", initials: "SC" },
        { name: "Priya Patel", role: "Lab Instructor", initials: "PP" },
      ],
    },
    {
      key: "cyber-workshop",
      title: "Intro to Cybersecurity Workshop",
      category: "technology",
      host: "organizer2@uni.edu",
      startsAt: days(3),
      endsAt: days(3),
      seatLimit: 40,
      location: "Lab 204, Computer Science Building",
      description:
        "Hands-on introduction to ethical hacking, network defense, and secure coding. Bring a laptop — we'll set up a capture-the-flag environment together.",
      cover: img("photo-1550751827-4bd374c3f58b"),
      tags: ["Security", "Hands-on", "CTF"],
      agenda: [
        { time: "14:00", title: "Threat Landscape Overview" },
        { time: "15:00", title: "Live CTF Challenge" },
      ],
      speakers: [{ name: "Priya Patel", role: "Instructor", initials: "PP" }],
    },
    {
      key: "startup-pitch",
      title: "Startup Pitch Night",
      category: "business",
      host: "organizer@uni.edu",
      startsAt: days(5),
      endsAt: days(5),
      seatLimit: 80,
      featured: true,
      location: "Innovation Hub, Ground Floor",
      description:
        "Ten student teams pitch their startups to a panel of investors and alumni founders. Networking reception to follow.",
      cover: img("photo-1556761175-b413da4baf72"),
      tags: ["Entrepreneurship", "Pitch", "Networking"],
      agenda: [
        { time: "18:00", title: "Doors open & networking" },
        { time: "18:30", title: "Team pitches" },
        { time: "20:00", title: "Judges' verdict & reception" },
      ],
      speakers: [{ name: "Marcus Rivera", role: "Host", initials: "MR" }],
    },
    {
      key: "music-fest",
      title: "Fall Music Festival",
      category: "arts-culture",
      host: "organizer@uni.edu",
      startsAt: days(12),
      endsAt: days(12),
      seatLimit: 300,
      featured: true,
      location: "Central Quad Lawn",
      description:
        "An open-air celebration of student bands, DJs, and food trucks. The biggest campus event of the semester.",
      cover: img("photo-1470229722913-7c0e2dbbafd3"),
      tags: ["Music", "Festival", "Live"],
      agenda: [
        { time: "16:00", title: "Opening acts" },
        { time: "19:00", title: "Headline performance" },
      ],
      speakers: [],
    },
    {
      key: "career-fair",
      title: "Career Fair 2026",
      category: "career",
      host: "admin@uni.edu",
      startsAt: days(8),
      endsAt: days(8),
      seatLimit: 200,
      location: "Sports Hall A",
      description:
        "Meet 60+ employers hiring for internships and graduate roles across engineering, business, and design. Bring copies of your résumé.",
      cover: img("photo-1523240795612-9a054b0db644"),
      tags: ["Careers", "Recruiting", "Internships"],
      agenda: [
        { time: "10:00", title: "Employer booths open" },
        { time: "13:00", title: "Résumé clinic" },
      ],
      speakers: [],
    },
    {
      key: "hackathon",
      title: "48-Hour Hackathon",
      category: "technology",
      host: "organizer2@uni.edu",
      coHosts: ["organizer@uni.edu"],
      startsAt: days(15),
      endsAt: days(17),
      seatLimit: 150,
      location: "Innovation Hub, All Floors",
      description:
        "Build something amazing in 48 hours. Free food, mentors on-site, and prizes for the best hacks. Teams of up to four.",
      cover: img("photo-1504384308090-c894fdcc538d"),
      tags: ["Hackathon", "Coding", "Prizes"],
      agenda: [
        { time: "Fri 18:00", title: "Kickoff & team formation" },
        { time: "Sun 18:00", title: "Demos & judging" },
      ],
      speakers: [],
    },
    {
      key: "yoga",
      title: "Yoga & Wellness Morning",
      category: "health-sports",
      host: "organizer@uni.edu",
      startsAt: days(-3),
      endsAt: days(-3),
      seatLimit: 50,
      location: "Recreation Center Studio 2",
      description:
        "Start your day with a guided yoga and mindfulness session suitable for all levels. Mats provided.",
      cover: img("photo-1544367567-0f2fcb009e0b"),
      tags: ["Wellness", "Yoga", "Mindfulness"],
      agenda: [{ time: "07:30", title: "Guided session" }],
      speakers: [],
    },
    {
      key: "design-bootcamp",
      title: "Design Thinking Bootcamp",
      category: "arts-culture",
      host: "organizer2@uni.edu",
      startsAt: days(-6),
      endsAt: days(-6),
      seatLimit: 60,
      location: "Design Studio, Arts Building",
      description:
        "A practical crash course in human-centered design: empathy mapping, ideation, and rapid prototyping.",
      cover: img("photo-1531403009284-440f080d1e12"),
      tags: ["Design", "UX", "Workshop"],
      agenda: [
        { time: "10:00", title: "Empathize & Define" },
        { time: "13:00", title: "Prototype & Test" },
      ],
      speakers: [{ name: "Priya Patel", role: "Facilitator", initials: "PP" }],
    },
    {
      key: "webdev-101",
      title: "Web Development 101",
      category: "technology",
      host: "organizer@uni.edu",
      startsAt: days(-10),
      endsAt: days(-10),
      seatLimit: 45,
      location: "Lab 110, Computer Science Building",
      description:
        "From zero to a deployed website in one afternoon. HTML, CSS, and a taste of modern tooling.",
      cover: img("photo-1461749280684-dccba630e2f6"),
      tags: ["Web", "Beginner", "Hands-on"],
      agenda: [{ time: "13:00", title: "Build your first page" }],
      speakers: [],
    },
  ];

  const events: Record<
    string,
    {
      id: string;
      startsAt: Date;
      endsAt: Date;
      title: string;
      location: string;
      categoryName: string;
    }
  > = {};
  for (const def of eventDefs) {
    const isPast = def.endsAt < now;
    const created = await prisma.event.create({
      data: {
        slug: def.key,
        title: def.title,
        description: def.description,
        location: def.location,
        startsAt: def.startsAt,
        endsAt: def.endsAt,
        seatLimit: def.seatLimit,
        registrationDeadline: null,
        coverImage: def.cover,
        featured: def.featured ?? false,
        status: EVENT_STATUS.PUBLISHED,
        approvalStatus: EVENT_APPROVAL_STATUS.ACCEPTED,
        tags: JSON.stringify(def.tags),
        agenda: JSON.stringify(def.agenda),
        speakers: JSON.stringify(def.speakers),
        categoryId: categories[def.category].id,
        hostId: hostId(def.host),
        coHosts: def.coHosts?.length
          ? { create: def.coHosts.map((email) => ({ userId: hostId(email) })) }
          : undefined,
      },
    });
    events[def.key] = {
      id: created.id,
      startsAt: created.startsAt,
      endsAt: created.endsAt,
      title: created.title,
      location: created.location,
      categoryName: categories[def.category].name,
    };
    void isPast;
  }

  // --- Registrations -----------------------------------------------------
  type RegRow = {
    eventId: string;
    userId: string;
    status: string;
    ticketCode: string;
    seatNumber: number;
    checkedInAt: Date | null;
  };
  const regRows: RegRow[] = [];
  const regSeen = new Set<string>();
  const seatCounter: Record<string, number> = {};

  function addReg(eventKey: string, userId: string, checkedIn: boolean) {
    const ev = events[eventKey];
    const k = `${ev.id}|${userId}`;
    if (regSeen.has(k)) return;
    regSeen.add(k);
    seatCounter[ev.id] = (seatCounter[ev.id] ?? 0) + 1;
    regRows.push({
      eventId: ev.id,
      userId,
      status: REGISTRATION_STATUS.REGISTERED,
      ticketCode: ticket(),
      seatNumber: seatCounter[ev.id],
      // Checked in shortly after the event started.
      checkedInAt: checkedIn
        ? new Date(ev.startsAt.getTime() + 20 * 60_000)
        : null,
    });
  }

  // Rotate through the student pool so events share attendees realistically.
  let cursor = 0;
  function fill(eventKey: string, count: number, checkinCount = 0) {
    const n = Math.min(count, pool.length);
    for (let i = 0; i < n; i++) {
      const student = pool[(cursor + i) % pool.length];
      addReg(eventKey, student.id, i < checkinCount);
    }
    cursor = (cursor + n) % pool.length;
  }

  fill("ai-summit", 30);
  fill("cyber-workshop", 37); // + Alex below → 38/40 (2 left)
  fill("startup-pitch", 22);
  fill("music-fest", 39);
  fill("career-fair", 39);
  fill("hackathon", 26);
  fill("yoga", 39, 26); // past → check-ins
  fill("design-bootcamp", 37, 30);
  fill("webdev-101", 39, 33);

  // Primary demo student's registrations (curated for a rich dashboard).
  addReg("ai-summit", alex.id, false); // upcoming + featured
  addReg("cyber-workshop", alex.id, false); // upcoming, near-full
  addReg("yoga", alex.id, true); // past, attended
  addReg("design-bootcamp", alex.id, false); // past, no-show → still pending feedback

  await prisma.registration.createMany({ data: regRows });

  // --- Admin demonstration records ---------------------------------------
  // These records keep the approval, complaint, and fine panels populated
  // after a fresh seed for demonstrations and screenshots.
  const requestOne = await prisma.event.create({
    data: {
      slug: "student-research-showcase-demo",
      title: "Student Research Showcase",
      description:
        "A showcase of student research projects, prototypes, and applied work across campus.",
      location: "Innovation Hub, Exhibition Hall",
      startsAt: days(18),
      endsAt: days(18),
      seatLimit: 120,
      registrationDeadline: days(16),
      coverImage: img("photo-1523240795612-9a054b0db644"),
      status: EVENT_STATUS.DRAFT,
      approvalStatus: EVENT_APPROVAL_STATUS.PENDING,
      tags: JSON.stringify(["Research", "Students", "Showcase"]),
      agenda: JSON.stringify([]),
      speakers: JSON.stringify([]),
      categoryId: categories.academic.id,
      hostId: organizer.id,
    },
  });
  await prisma.event.create({
    data: {
      slug: "campus-volunteer-day-demo",
      title: "Campus Volunteer Day",
      description:
        "A campus-wide volunteer event connecting students with local community projects.",
      location: "Student Union, Room 204",
      startsAt: days(22),
      endsAt: days(22),
      seatLimit: 80,
      registrationDeadline: days(20),
      coverImage: img("photo-1559027615-cd4628902d4a"),
      status: EVENT_STATUS.DRAFT,
      approvalStatus: EVENT_APPROVAL_STATUS.PENDING,
      tags: JSON.stringify(["Community", "Volunteer"]),
      agenda: JSON.stringify([]),
      speakers: JSON.stringify([]),
      categoryId: categories.business.id,
      hostId: organizer2.id,
    },
  });

  const showcaseRegistration = await prisma.registration.findFirst({
    where: { eventId: events["yoga"].id, userId: alex.id },
  });
  const complaint = await prisma.complaint.create({
    data: {
      eventId: events["yoga"].id,
      participantId: alex.id,
      category: "venue_problem",
      subject: "Venue access issue",
      description:
        "The assigned studio was locked for the first part of the event and attendees had to wait outside.",
      status: COMPLAINT_STATUS.UNDER_REVIEW,
    },
  });
  const resolvedComplaint = await prisma.complaint.create({
    data: {
      eventId: events["design-bootcamp"].id,
      participantId: pool[0].id,
      category: "poor_management",
      subject: "Workshop schedule change",
      description:
        "The advertised afternoon workshop started late and the schedule was not updated for attendees.",
      status: COMPLAINT_STATUS.RESOLVED,
      adminNote:
        "Reviewed with the organizer and recorded as a scheduling issue.",
      reviewedById: admin.id,
      reviewedAt: days(-1),
    },
  });
  await prisma.fine.create({
    data: {
      complaintId: resolvedComplaint.id,
      eventId: events["design-bootcamp"].id,
      eventCreatorId: organizer2.id,
      issuedById: admin.id,
      amount: 150,
      reason: "Repeated schedule changes without attendee notification",
      status: FINE_STATUS.ISSUED,
    },
  });
  void requestOne;
  void complaint;
  void showcaseRegistration;

  // --- Feedback (from checked-in pool attendees; not from Alex) ----------
  const comments = [
    "Fantastic session, learned a lot!",
    "Well organized and engaging.",
    "Great speakers, would attend again.",
    "Good content, a bit rushed at the end.",
    "Loved the hands-on parts.",
    "",
    "Venue was a little cramped but worth it.",
    "Exceeded my expectations.",
  ];
  const feedbackRows: {
    eventId: string;
    userId: string;
    rating: number;
    comment: string | null;
  }[] = [];
  const fbSeen = new Set<string>();
  function addFeedback(eventKey: string, limit: number) {
    const ev = events[eventKey];
    const attended = regRows.filter(
      (r) => r.eventId === ev.id && r.checkedInAt && r.userId !== alex.id,
    );
    for (let i = 0; i < Math.min(limit, attended.length); i++) {
      const r = attended[i];
      const k = `${ev.id}|${r.userId}`;
      if (fbSeen.has(k)) continue;
      fbSeen.add(k);
      feedbackRows.push({
        eventId: ev.id,
        userId: r.userId,
        rating: 3 + (i % 3), // 3..5
        comment: comments[i % comments.length] || null,
      });
    }
  }
  addFeedback("yoga", 18);
  addFeedback("design-bootcamp", 22);
  addFeedback("webdev-101", 20);
  await prisma.feedback.createMany({ data: feedbackRows });

  // --- Populate the Outbox ----------------------------------------------
  // Confirmation emails (with QR) for the primary student's registrations.
  const alexRegs = regRows.filter((r) => r.userId === alex.id);
  for (const r of alexRegs) {
    const evKey = Object.keys(events).find((k) => events[k].id === r.eventId)!;
    const ev = events[evKey];
    await sendConfirmationEmail({
      userId: alex.id,
      user: { name: alex.name, email: alex.email },
      eventId: ev.id,
      event: {
        title: ev.title,
        location: ev.location,
        startsAt: ev.startsAt,
        endsAt: ev.endsAt,
        category: ev.categoryName,
      },
      ticketCode: r.ticketCode,
      seatNumber: r.seatNumber,
    });
  }
  void toEventEmailData;

  // Run the real jobs so reminders (AI summit) + feedback requests (past events)
  // land in the Outbox exactly as they would in production.
  const reminders = await runReminderJob();
  const feedbackReqs = await runFeedbackJob();

  const [userCount, eventCount, regCount, emailCount] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.registration.count(),
    prisma.emailMessage.count(),
  ]);

  console.log(`\n  Seeded:`);
  console.log(`   • ${userCount} users (admin/organizers/students)`);
  console.log(`   • ${eventCount} events, ${regCount} registrations`);
  console.log(`   • ${feedbackRows.length} feedback entries`);
  console.log(
    `   • ${emailCount} Outbox emails (incl. ${reminders} reminders, ${feedbackReqs} feedback requests)`,
  );
  console.log(`\n  Demo login (password: ${DEMO_PASSWORD})`);
  console.log(`   • admin@uni.edu       — admin`);
  console.log(`   • organizer@uni.edu   — organizer (hosts most events)`);
  console.log(`   • organizer2@uni.edu  — organizer (co-host on AI Summit)`);
  console.log(`   • student@uni.edu     — student (Alex Johnson)\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
