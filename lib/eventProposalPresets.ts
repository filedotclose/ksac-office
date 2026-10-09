/**
 * KSAC Event Proposal Presets, Dropdown Schemas, INR-to-Words Converter,
 * Role Authorization Guards, and Department Requirement Extractor.
 */

export interface SectionModuleOption {
  key: string;
  label: string;
  description: string;
  categoryKey?: string;
}

export const SECTION_MODULES: SectionModuleOption[] = [
  {
    key: "SUB_EVENTS",
    label: "Event Format / Sub-Events & Schedule",
    description: "Day-wise or round-wise structure (e.g., Quiz -> Hack -> Pitch, or Multi-Event Festival)",
  },
  {
    key: "GUIDELINES",
    label: "Target Audience & Participation Guidelines",
    description: "Participants year, eligibility, team formation size, and advancement rules",
  },
  {
    key: "BUDGET",
    label: "Budget Breakdown Table (Standalone Page)",
    description: "Itemized expenditure table with Quantity, Unit Price, Tentative Cost, GST note, and Signatories",
    categoryKey: "FINANCE",
  },
  {
    key: "REVENUE",
    label: "Revenue Model Table",
    description: "Participant registration fee projection and expected sponsorship breakdown",
    categoryKey: "FINANCE",
  },
  {
    key: "SPEAKER",
    label: "Guest / Speaker Profile & Fee Breakdown",
    description: "Speaker biography, manager contact info, speaker fees, GST, and TBL",
    categoryKey: "FINANCE",
  },
  {
    key: "VENUE",
    label: "A. Venue Requirements",
    description: "Campus lecture halls, classrooms, auditoriums, and green rooms by date & time",
    categoryKey: "VENUE",
  },
  {
    key: "TECHNICAL",
    label: "B. Technical, Sound & Electrical Requirements",
    description: "Podium/cordless microphones, extension boards, power supply, AV screen, lamp & lighting",
    categoryKey: "TECHNICAL",
  },
  {
    key: "FOOD",
    label: "C. Accommodation & Food Requirements",
    description: "Water bottles, OC food/snacks, refreshments (samosa/juice), and guest hospitality",
    categoryKey: "FOOD",
  },
  {
    key: "MARKETING",
    label: "D. Marketing, Publicity & Logistics Requirements",
    description: "Desk marketing tables/chairs, standees/banners, classroom promotion, Registrar mail, LED TVs, flash mob",
    categoryKey: "MARKETING",
  },
  {
    key: "SECURITY",
    label: "E. Security & Crowd Management Requirements",
    description: "Campus security guards, barricading, gate access control, night surveillance, and VIP escorts",
    categoryKey: "SECURITY",
  },
  {
    key: "FELICITATION",
    label: "F. Dignitary Felicitation & Protocol Material",
    description: "Sambalpuri shawls, brass diya lamp, fresh flower bouquets, VIP delegate kits, and mementos",
    categoryKey: "FELICITATION",
  },
  {
    key: "SPONSORS",
    label: "G. Sponsors & Memorandum of Understanding (MoU)",
    description: "Title/Associate sponsors, contribution amount, contact person, and signed MoU documents",
    categoryKey: "SPONSORS",
  },
];

export const BANNER_FORMAT_PRESETS = [
  { label: "Stage Backdrop (12x8 ft)", dimensions: "12x8 ft", material: "Star Flex", description: "Main Auditorium Stage Backdrop flex (12ft width x 8ft height)" },
  { label: "Entrance Gate Arch (8x4 ft)", dimensions: "8x4 ft", material: "Star Flex", description: "Campus Main Gate & Auditorium Foyer Arch flex (8ft width x 4ft height)" },
  { label: "Indoor Roll-up Standee (6x3 ft)", dimensions: "6x3 ft", material: "Roll-up Standee", description: "Indoor Registration Desk, Lobby & Auditorium Foyer Standee" },
  { label: "Promotional Standee (5x2 ft)", dimensions: "5x2 ft", material: "Flex Standee", description: "Campus Walkway & Academic Corridor Standee" },
  { label: "Speaker Podium Wrap (4x2.5 ft)", dimensions: "4x2.5 ft", material: "Vinyl Wrap", description: "Speaker Podium Front Branding" },
  { label: "Custom Banner Dimensions", dimensions: "Custom", material: "Star Flex", description: "Custom dimensions for specialized stage setups" },
];

export const POSTER_FORMAT_PRESETS = [
  { label: "A3 Physical Print (Glossy 180 GSM)", dimensions: "297 x 420 mm", description: "Official notice boards, auditoriums & academic block display" },
  { label: "A4 Notice Board Flyer", dimensions: "210 x 297 mm", description: "Hostel notice boards & departmental notice desks" },
  { label: "Digital Square (1080 x 1080 px)", dimensions: "1080x1080 px", description: "Instagram Post feed & WhatsApp group promotion" },
  { label: "Digital Portrait (1080 x 1350 px)", dimensions: "1080x1350 px", description: "Instagram Portrait Post (4:5 ratio)" },
  { label: "Digital Fullscreen Story (1080 x 1920 px)", dimensions: "1080x1920 px", description: "Instagram & WhatsApp Full Screen Story (9:16)" },
];

export const SPONSOR_TIERS = [
  "Title Sponsor",
  "Co-Sponsor",
  "Powered By Sponsor",
  "Associate Sponsor",
  "Beverage / Food Partner",
  "Technical / Platform Partner",
  "Merchandise Partner",
  "Media & Outreach Partner",
];

export const SMART_ITEM_PRESETS = {
  VENUE: [
    "Lecture Hall",
    "Classroom",
    "Auditorium",
    "Conference Hall",
    "Auditorium + Green Room",
    "KSAC Central Auditorium",
    "Custom Venue...",
  ],
  CAMPUS: [
    "Campus 3",
    "Campus 6",
    "Campus 7",
    "Campus 11",
    "Campus 12",
    "Campus 14",
    "Campus 15",
    "Campus 17",
    "Campus 25",
    "KSAC Campus 13",
    "Campus 6 & Campus 7",
    "Campus 3, 6, 25",
    "Custom Campus...",
  ],
  TECHNICAL: [
    "Podium Microphone",
    "Cordless Microphone",
    "Extension Board / Extension Cords",
    "Power Supply + Mics + Extension Board",
    "AV System + Screen",
    "Speakers + Mics + Power Supply + Lights",
    "Lamp + Candles + Garland + God's Photo",
    "Tables & Chairs Setup (Registration / Guest)",
    "Custom Technical Item...",
  ],
  FOOD: [
    "Water Bottles (Participants & Volunteers)",
    "OC Food (Lunch / Dinner Packet)",
    "OC Snacks & Refreshments",
    "Samosa & Juice Packet",
    "Guest / Speaker Hospitality & Accommodation (TBL)",
    "Custom Food / Hospitality Item...",
  ],
  MARKETING: [
    "Desk Marketing (Tables & Chairs at Campuses)",
    "Standees (5ft x 2ft) & Banners (8ft x 10ft)",
    "Classroom Promotion Permission",
    "Registrar Mail (University-wide Event Promotion)",
    "Screen across KIIT + Hostel LED TVs",
    "Flash Mob Permission (Speakers + Mics + Power Supply)",
    "Speaker Reveal Banner (8ft x 20ft)",
    "Custom Marketing / Logistics Item...",
  ],
  SECURITY: [
    "Campus Security Guards (Male/Female)",
    "Main Gate Entry Verification & ID Frisking",
    "Crowd Control Barricading & Queue Managers",
    "Night Security Surveillance (Post 9:00 PM)",
    "Dignitary / VIP Escort Security Team",
    "Parking & Campus Traffic Management Guards",
    "Auditorium Entry/Exit Gate Marshals",
    "Custom Security Requirement...",
  ],
  FELICITATION: [
    "Traditional Sambalpuri Handloom Shawl / Angavastram",
    "Fresh Floral Bouquet / Flower Basket",
    "Custom Engraved Memento / Trophy with KSAC KIIT Branding",
    "Traditional Brass Lamp (Diya) + Oil + Wicks + Camphor",
    "VIP Delegate Welcome Kit (Executive Pen, Notebook, Folder)",
    "Honorary Floral Garland for Dignitaries",
    "Silver Filigree (Tarakasi) Souvenir",
    "Custom Felicitation Item...",
  ],
  BUDGET: [
    { label: "Standee (5ft x 2ft)", defaultPrice: "300" },
    { label: "Standee (6ft x 4ft)", defaultPrice: "288" },
    { label: "Standee (8ft x 10ft)", defaultPrice: "960" },
    { label: "Banner (8ft x 10ft)", defaultPrice: "700" },
    { label: "Banner (6ft x 3ft)", defaultPrice: "216" },
    { label: "Stage Backdrop Banner (12ft x 8ft)", defaultPrice: "1440" },
    { label: "Entrance Gate Banner (8ft x 4ft)", defaultPrice: "480" },
    { label: "Speaker Reveal Banner (8ft x 20ft)", defaultPrice: "2000" },
    { label: "Posters (A3 size - Glossy)", defaultPrice: "25" },
    { label: "Posters (A4 size)", defaultPrice: "15" },
    { label: "Winner Certificates", defaultPrice: "25" },
    { label: "Winner Mementos / Trophies", defaultPrice: "500" },
    { label: "Medals", defaultPrice: "35" },
    { label: "OC ID Cards + Lanyards", defaultPrice: "60" },
    { label: "OC Food (Day 1)", defaultPrice: "120" },
    { label: "OC Food (Day 2)", defaultPrice: "120" },
    { label: "OC Snacks / Samosa & Juice", defaultPrice: "30" },
    { label: "Water Bottles", defaultPrice: "10" },
    { label: "Sambalpuri Shawl for Dignitaries", defaultPrice: "850" },
    { label: "Bouquet for Guest/Speaker", defaultPrice: "350" },
    { label: "Brass Lamp Inauguration Kit", defaultPrice: "500" },
    { label: "Transportation of Speaker", defaultPrice: "1000" },
    { label: "Speaker Fees", defaultPrice: "115000" },
    { label: "Speaker Fees GST (18%)", defaultPrice: "20700" },
    { label: "Travel, Boarding & Lodging (TBL)", defaultPrice: "25000" },
    { label: "Custom Budget Item...", defaultPrice: "" },
  ],
};

export interface SignatoryPreset {
  roleTitle: string;
  name: string;
  designation: string;
  location: "NOTESHEET" | "FOOTER" | "BOTH";
}

export const DEFAULT_SIGNATORY_PRESETS: SignatoryPreset[] = [
  {
    roleTitle: "FIC",
    name: "",
    designation: "Faculty In-Charge (Society)",
    location: "FOOTER",
  },
  {
    roleTitle: "Associate Dean, KSAC (Tech)",
    name: "Dr. Ajit Kumar Pasayat",
    designation: "Associate Dean, KSAC (Tech)",
    location: "BOTH",
  },
  {
    roleTitle: "Associate Dean, KSAC",
    name: "",
    designation: "Associate Dean, KSAC",
    location: "FOOTER",
  },
  {
    roleTitle: "Deputy Director, KSAC",
    name: "",
    designation: "Deputy Director, KSAC",
    location: "FOOTER",
  },
  {
    roleTitle: "Pro-Vice Chancellor (Admin)-cum-Registrar",
    name: "",
    designation: "Pro-Vice Chancellor (Admin)-cum-Registrar, KIIT-DU",
    location: "BOTH",
  },
];

export interface DepartmentDirectoryConfig {
  name: string;
  categoryKey: string;
  primaryEmail: string;
  ccEmails: string[];
  contactPerson: string;
  defaultSubjectTemplate: string;
  defaultHeaderNote: string;
}

export const DEFAULT_DEPARTMENT_DIRECTORY: DepartmentDirectoryConfig[] = [
  {
    name: "Estate & Campus Venue Department",
    categoryKey: "VENUE",
    primaryEmail: "estate.venues@kiit.ac.in",
    ccEmails: ["ksac.office@kiit.ac.in"],
    contactPerson: "Deputy Director (Estate & Infrastructure)",
    defaultSubjectTemplate:
      "KSAC Venue Allotment Request - {eventName} ({society}) on {dateDisplay}",
    defaultHeaderNote:
      "Kindly arrange and allot the following campus venues (Lecture Halls / Classrooms / Auditoriums) for the approved KSAC society event:",
  },
  {
    name: "Technical, Sound, AV & Electrical Department",
    categoryKey: "TECHNICAL",
    primaryEmail: "technical.electrical@kiit.ac.in",
    ccEmails: ["it.support@kiit.ac.in", "ksac.office@kiit.ac.in"],
    contactPerson: "In-Charge (Electrical & Central Sound/AV)",
    defaultSubjectTemplate:
      "KSAC Technical & Sound/AV Requirement - {eventName} ({society}) on {dateDisplay}",
    defaultHeaderNote:
      "Kindly arrange the following technical, sound, AV, and electrical power setups for the approved KSAC society event:",
  },
  {
    name: "Hospitality, Catering & Guest House Department",
    categoryKey: "FOOD",
    primaryEmail: "hospitality.catering@kiit.ac.in",
    ccEmails: ["guesthouse@kiit.ac.in", "ksac.office@kiit.ac.in"],
    contactPerson: "Manager (KIIT Hospitality & Catering)",
    defaultSubjectTemplate:
      "KSAC Food, Refreshments & Hospitality Request - {eventName} ({society}) on {dateDisplay}",
    defaultHeaderNote:
      "Kindly arrange the following refreshments, water bottles, OC food packets, and guest hospitality items for the approved KSAC event:",
  },
  {
    name: "Publicity, Campus Administration & Registrar Office",
    categoryKey: "MARKETING",
    primaryEmail: "registrar.publicity@kiit.ac.in",
    ccEmails: ["campus.security@kiit.ac.in", "ksac.office@kiit.ac.in"],
    contactPerson: "Office of the Registrar & Campus Administration",
    defaultSubjectTemplate:
      "KSAC Event Promotion & Logistics Intimation - {eventName} ({society})",
    defaultHeaderNote:
      "Kindly grant permission and arrange logistics for the following marketing, desk promotion, LED screen display, and promotional activities:",
  },
  {
    name: "Campus Security & Discipline Department",
    categoryKey: "SECURITY",
    primaryEmail: "security.control@kiit.ac.in",
    ccEmails: ["chief.security@kiit.ac.in", "ksac.office@kiit.ac.in"],
    contactPerson: "Chief Security Officer (CSO)",
    defaultSubjectTemplate:
      "KSAC Campus Security & Crowd Management Requisition - {eventName} ({society}) on {dateDisplay}",
    defaultHeaderNote:
      "Kindly deploy the following campus security personnel, crowd control barriers, and gate access arrangements for the approved KSAC society event:",
  },
  {
    name: "Dignitary Felicitation & Protocol Cell",
    categoryKey: "FELICITATION",
    primaryEmail: "protocol.felicitation@kiit.ac.in",
    ccEmails: ["ksac.office@kiit.ac.in"],
    contactPerson: "Protocol Officer (KSAC / Registrar Office)",
    defaultSubjectTemplate:
      "KSAC Dignitary Felicitation & Protocol Material Requisition - {eventName} ({society})",
    defaultHeaderNote:
      "Kindly arrange the following dignitary felicitation materials, shawls, brass lamp, and hospitality kits for the approved KSAC event:",
  },
  {
    name: "Finance, Accounts & Printing Procurement",
    categoryKey: "FINANCE",
    primaryEmail: "accounts.procurement@kiit.ac.in",
    ccEmails: ["ksac.finance@kiit.ac.in"],
    contactPerson: "Finance & Central Procurement Officer",
    defaultSubjectTemplate:
      "KSAC Approved Event Budget & Procurement - {eventName} ({society}) [Rs. {budgetTotal}/-]",
    defaultHeaderNote:
      "Please find below the approved budget breakdown, printing/flex specifications, and financial particulars for the KSAC society event:",
  },
];

/**
 * Converts a numeric INR amount into formal Indian English Words
 * matching the official KSAC Notesheet style:
 * e.g. 232750 -> "Rupees Two Lakh Thirty Two Thousand Seven Hundred Fifty Only"
 */
export function numberToIndianRupeeWords(amount: number): string {
  const num = Math.round(Math.abs(Number(amount) || 0));
  if (num === 0) return "Rupees Zero Only";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const twoDigitToWords = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return `${tens[t]}${o > 0 ? " " + ones[o] : ""}`;
  };

  const parts: string[] = [];
  let remaining = num;

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  if (crore > 0) {
    parts.push(`${twoDigitToWords(crore)} Crore`);
  }

  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  if (lakh > 0) {
    parts.push(`${twoDigitToWords(lakh)} Lakh`);
  }

  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  if (thousand > 0) {
    parts.push(`${twoDigitToWords(thousand)} Thousand`);
  }

  const hundred = Math.floor(remaining / 100);
  remaining %= 100;
  if (hundred > 0) {
    parts.push(`${ones[hundred]} Hundred`);
  }

  if (remaining > 0) {
    parts.push(twoDigitToWords(remaining));
  }

  return `Rupees ${parts.join(" ")} Only`;
}

export function formatIndianCurrency(amount: number): string {
  const num = Math.round(Number(amount) || 0);
  return num.toLocaleString("en-IN");
}

/**
 * Checks if a user is authorized to access the Event Proposal workflow.
 * Allowed:
 * - Society Presidents & Vice-Presidents
 * - Faculty In-Charge (`role === "fic"`)
 * - Dean KSAC (`role === "dean"`) and Admin (`role === "admin"`)
 */
export function isAuthorizedForEventProposal(user: {
  role?: string;
  isSocietyLead?: boolean;
  position?: string;
  society?: string;
  societyPositions?: Array<{ society: string; position: string; allocatedRoom?: string }>;
} | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "dean" || user.role === "admin" || user.role === "ksac") return true;
  if (user.role === "fic") return true;
  if (user.role === "president" || user.role === "vice_president") return true;
  if (user.role !== "student") return false;

  const allowedPositions = ["president", "vice-president", "vice president", "lead", "coordinator"];
  if (user.position && allowedPositions.includes(user.position.trim().toLowerCase())) {
    return true;
  }
  if (
    Array.isArray(user.societyPositions) &&
    user.societyPositions.some(
      (sp) => sp.position && allowedPositions.includes(sp.position.trim().toLowerCase())
    )
  ) {
    return true;
  }
  if (user.isSocietyLead === true) {
    return true;
  }
  return false;
}

export interface GeneratedDepartmentMail {
  categoryKey: string;
  departmentName: string;
  recipientEmail: string;
  ccEmails: string[];
  subject: string;
  bodyText: string;
  bodyHtml: string;
  status: "PENDING" | "SENT" | "FAILED";
  itemCount: number;
  fromAddress?: string;
  replyToAddress?: string;
}

const escapeHtml = (str: unknown): string => {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

/**
 * Extracts requirements department-wise from an EventProposal and synthesizes
 * ready-to-send email templates for Dean KSAC.
 */
export function extractDepartmentEmailsForProposal(
  proposal: any,
  directory: DepartmentDirectoryConfig[] = DEFAULT_DEPARTMENT_DIRECTORY
): GeneratedDepartmentMail[] {
  const results: GeneratedDepartmentMail[] = [];
  const enabled = Array.isArray(proposal.enabledSections) ? proposal.enabledSections : [];

  const getDept = (key: string): DepartmentDirectoryConfig => {
    const found = directory.find((d) => d.categoryKey.toUpperCase() === key.toUpperCase());
    if (found) return found;
    const fallback = DEFAULT_DEPARTMENT_DIRECTORY.find((d) => d.categoryKey === key.toUpperCase());
    return (
      fallback || {
        name: `${key} Department`,
        categoryKey: key.toUpperCase(),
        primaryEmail: `${key.toLowerCase()}@kiit.ac.in`,
        ccEmails: ["ksac.office@kiit.ac.in"],
        contactPerson: `${key} In-Charge`,
        defaultSubjectTemplate: `KSAC Event Requirement [{category}] - {eventName} ({society})`,
        defaultHeaderNote: `Kindly arrange the following approved requirements for ${proposal.eventName}:`,
      }
    );
  };

  const applyTemplateVars = (tpl: string, dept: DepartmentDirectoryConfig) => {
    return tpl
      .replace(/\{category\}/g, dept.categoryKey)
      .replace(/\{eventName\}/g, proposal.eventName || "Event")
      .replace(/\{society\}/g, proposal.society || "KSAC Society")
      .replace(/\{dateDisplay\}/g, proposal.dateDisplay || proposal.startDate || "Upcoming")
      .replace(/\{budgetTotal\}/g, formatIndianCurrency(proposal.budgetTotal || 0));
  };

  const buildEnvelope = (
    dept: DepartmentDirectoryConfig,
    tableHeaders: string[],
    rows: string[][],
    extraNote = ""
  ): GeneratedDepartmentMail => {
    const subject = applyTemplateVars(dept.defaultSubjectTemplate, dept);
    const textRows = rows
      .map((r, idx) => `${idx + 1}. ${r.map((col, i) => `${tableHeaders[i]}: ${col}`).join(" | ")}`)
      .join("\n");

    const bodyText = `To,
${dept.contactPerson || dept.name}
KIIT Deemed to be University

Sub: ${subject}

Respected Sir/Madam,

${dept.defaultHeaderNote}

Event Name: ${proposal.eventName} (${proposal.eventMode || "OFFLINE"})
Society: ${proposal.society} (KSAC)
Event Date(s): ${proposal.dateDisplay || proposal.startDate}
Primary Campus / Venue: ${proposal.venueCampus || "KIIT Campus"}
Student Coordinator: ${proposal.studentName || ""} (${proposal.position || "Society Lead"})

REQUIREMENTS BREAKDOWN:
${textRows}
${extraNote ? `\n${extraNote}\n` : ""}
This event proposal has been reviewed and approved by the Office of the Dean, KSAC. Kindly make the necessary arrangements.

Warm Regards,
Office of the Dean, KSAC
KIIT Student Activity Centre (KSAC)
KIIT Deemed to be University, Bhubaneswar`;

    const thHtml = tableHeaders
      .map(
        (h) =>
          `<th style="border:1px solid #cbd5e1;padding:8px 12px;background:#0f172a;color:#ffffff;text-align:left;font-size:13px;">${escapeHtml(
            h
          )}</th>`
      )
      .join("");

    const trHtml = rows
      .map(
        (r) =>
          `<tr>${r
            .map(
              (c) =>
                `<td style="border:1px solid #cbd5e1;padding:8px 12px;font-size:13px;color:#1e293b;">${escapeHtml(
                  c
                )}</td>`
            )
            .join("")}</tr>`
      )
      .join("");

    const bodyHtml = `<div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;color:#1e293b;line-height:1.6;">
  <div style="border-bottom:2px solid #059669;padding-bottom:10px;margin-bottom:16px;">
    <h2 style="margin:0;color:#0f172a;font-size:18px;">KIIT STUDENT ACTIVITY CENTRE (KSAC)</h2>
    <p style="margin:2px 0 0;font-size:12px;color:#475569;">KALINGA INSTITUTE OF INDUSTRIAL TECHNOLOGY (KIIT) DEEMED TO BE UNIVERSITY</p>
  </div>
  <p><strong>To,</strong><br/>${escapeHtml(dept.contactPerson || dept.name)}<br/>KIIT Deemed to be University</p>
  <p><strong>Sub: ${escapeHtml(subject)}</strong></p>
  <p>Respected Sir/Madam,</p>
  <p>${escapeHtml(dept.defaultHeaderNote)}</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;margin:14px 0;font-size:13px;">
    <strong>Event:</strong> ${escapeHtml(proposal.eventName)} (${escapeHtml(proposal.eventMode || "OFFLINE")})<br/>
    <strong>Society:</strong> ${escapeHtml(proposal.society)} under KSAC<br/>
    <strong>Event Date(s):</strong> ${escapeHtml(proposal.dateDisplay || proposal.startDate)}<br/>
    <strong>Primary Campus:</strong> ${escapeHtml(proposal.venueCampus || "KIIT Campus")}<br/>
    <strong>Student Lead:</strong> ${escapeHtml(proposal.studentName || "")} (${escapeHtml(proposal.position || "Lead")})
  </div>
  <table style="border-collapse:collapse;width:100%;margin:16px 0;">
    <thead><tr>${thHtml}</tr></thead>
    <tbody>${trHtml}</tbody>
  </table>
  ${extraNote ? `<p style="font-size:13px;background:#ecfdf5;border-left:4px solid #059669;padding:8px 12px;">${escapeHtml(extraNote)}</p>` : ""}
  <p>This event proposal has been reviewed and approved by the Office of the Dean, KSAC. Kindly make the necessary arrangements.</p>
  <p style="margin-top:24px;">Warm Regards,<br/><strong>Office of the Dean, KSAC</strong><br/>KIIT Student Activity Centre</p>
</div>`;

    return {
      categoryKey: dept.categoryKey,
      departmentName: dept.name,
      recipientEmail: dept.primaryEmail,
      ccEmails: dept.ccEmails || [],
      subject,
      bodyText,
      bodyHtml,
      status: "PENDING",
      itemCount: rows.length,
    };
  };

  // 1. VENUE REQUIREMENTS
  const venueReqs = Array.isArray(proposal.venueRequirements) ? proposal.venueRequirements : [];
  if (enabled.includes("VENUE") && venueReqs.length > 0) {
    const dept = getDept("VENUE");
    const rows = venueReqs.map((v: any, idx: number) => [
      String(idx + 1),
      v.date || proposal.dateDisplay || "-",
      v.campus || proposal.venueCampus || "-",
      v.timings || "Full Day",
      v.venueType || "-",
      String(v.quantity ?? 1),
      v.details || "-",
    ]);
    results.push(
      buildEnvelope(dept, ["Sl. No.", "Date", "Campus", "Timings", "Venue", "Qty", "Purpose / Details"], rows)
    );
  }

  // 2. TECHNICAL REQUIREMENTS
  const techReqs = Array.isArray(proposal.technicalRequirements) ? proposal.technicalRequirements : [];
  if (enabled.includes("TECHNICAL") && techReqs.length > 0) {
    const dept = getDept("TECHNICAL");
    const rows = techReqs.map((t: any, idx: number) => [
      String(idx + 1),
      t.date || proposal.dateDisplay || "-",
      t.timings || "-",
      t.venue || proposal.venueCampus || "-",
      t.item || "-",
      String(t.quantity ?? "1"),
      t.details || "-",
    ]);
    results.push(
      buildEnvelope(dept, ["Sl. No.", "Dates", "Timings", "Venue / Campus", "Requirements", "Qty", "Details"], rows)
    );
  }

  // 3. FOOD & ACCOMMODATION REQUIREMENTS
  const foodReqs = Array.isArray(proposal.foodRequirements) ? proposal.foodRequirements : [];
  if (enabled.includes("FOOD") && foodReqs.length > 0) {
    const dept = getDept("FOOD");
    const rows = foodReqs.map((f: any, idx: number) => [
      String(idx + 1),
      f.date || proposal.dateDisplay || "-",
      f.item || "-",
      String(f.quantity || "-"),
      f.details || "-",
    ]);
    results.push(
      buildEnvelope(dept, ["Sl. No.", "Dates", "Requirement / Item", "Quantity", "Details"], rows)
    );
  }

  // 4. MARKETING & LOGISTICS REQUIREMENTS
  const mktReqs = Array.isArray(proposal.marketingRequirements) ? proposal.marketingRequirements : [];
  if (enabled.includes("MARKETING") && mktReqs.length > 0) {
    const dept = getDept("MARKETING");
    const rows = mktReqs.map((m: any, idx: number) => [
      String(idx + 1),
      m.startDate && m.endDate && m.startDate !== m.endDate
        ? `${m.startDate} to ${m.endDate}`
        : m.startDate || proposal.dateDisplay || "-",
      m.item || "-",
      m.campus || proposal.venueCampus || "-",
      m.details || "-",
    ]);
    results.push(
      buildEnvelope(dept, ["Sl. No.", "Date / Interval", "Marketing / Logistics Item", "Campus", "Details / Purpose"], rows)
    );
  }

  // 5. SECURITY REQUIREMENTS
  const securityReqs = Array.isArray(proposal.securityRequirements) ? proposal.securityRequirements : [];
  if (enabled.includes("SECURITY") && securityReqs.length > 0) {
    const dept = getDept("SECURITY");
    const rows = securityReqs.map((s: any, idx: number) => [
      String(idx + 1),
      s.date || proposal.dateDisplay || "-",
      s.timings || "-",
      s.campus || proposal.venueCampus || "-",
      s.securityType || s.item || "Security Guards",
      String(s.quantity ?? "1"),
      s.details || "-",
    ]);
    results.push(
      buildEnvelope(dept, ["Sl. No.", "Date", "Timings", "Campus / Location", "Security Requisition", "Personnel / Qty", "Crowd & Access Details"], rows)
    );
  }

  // 6. FELICITATION MATERIAL REQUIREMENTS
  const felicitationReqs = Array.isArray(proposal.felicitationRequirements) ? proposal.felicitationRequirements : [];
  if (enabled.includes("FELICITATION") && felicitationReqs.length > 0) {
    const dept = getDept("FELICITATION");
    const rows = felicitationReqs.map((f: any, idx: number) => [
      String(idx + 1),
      f.date || proposal.dateDisplay || "-",
      f.item || "-",
      String(f.quantity ?? "1"),
      f.recipientDignitary || "Chief Guest / Dignitaries",
      f.details || "-",
    ]);
    results.push(
      buildEnvelope(dept, ["Sl. No.", "Date", "Material / Item", "Quantity", "Recipient Dignitary", "Specifications"], rows)
    );
  }

  // 7. FINANCE / BUDGET & SPEAKER FEES
  const budgetItems = Array.isArray(proposal.budgetItems) ? proposal.budgetItems : [];
  if (enabled.includes("BUDGET") && budgetItems.length > 0) {
    const dept = getDept("FINANCE");
    const rows = budgetItems.map((b: any, idx: number) => [
      String(b.slNo || idx + 1),
      b.particulars || "-",
      String(b.quantity || "1"),
      String(b.unitPrice || "0"),
      `Rs. ${formatIndianCurrency(b.totalCost || 0)}`,
    ]);
    const extraNote = `Grand Total Approved Budget: Rs. ${formatIndianCurrency(
      proposal.budgetTotal || 0
    )}/- (${proposal.budgetInWords || numberToIndianRupeeWords(proposal.budgetTotal || 0)})`;
    results.push(
      buildEnvelope(
        dept,
        ["Sl. No.", "Particulars / Items", "Quantity", "Unit Price (INR)", "Tentative Cost (Rs.)"],
        rows,
        extraNote
      )
    );
  }

  return results;
}
