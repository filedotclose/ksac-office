import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUserFromToken } from "@/lib/auth";
import EventProposal from "@/models/EventProposal";
import DepartmentConfig from "@/models/DepartmentConfig";
import {
  deobfuscatePayload,
  verifyGatewaySignature,
  validateGatewayNonce,
  GATEWAY_OPCODES,
} from "@/lib/clientSecurity";
import {
  DEFAULT_DEPARTMENT_DIRECTORY,
  extractDepartmentEmailsForProposal,
  isAuthorizedForEventProposal,
  numberToIndianRupeeWords,
} from "@/lib/eventProposalPresets";
import { sendDepartmentRequirementEmail } from "@/lib/event-department-email";
import { parseAndValidateBody, sanitizeString, isValidMongoId } from "@/lib/sanitize";
import { getClientIp, checkGeneralRateLimit, setRateLimitHeaders } from "@/lib/rateLimit";

async function ensureDepartmentDirectory() {
  const existing = await DepartmentConfig.find({}).sort({ categoryKey: 1 }).lean();
  if (existing.length > 0) return existing;
  await DepartmentConfig.insertMany(DEFAULT_DEPARTMENT_DIRECTORY);
  return await DepartmentConfig.find({}).sort({ categoryKey: 1 }).lean();
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateLimitResult = await checkGeneralRateLimit(clientIp);

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { message: "Too many requests. Please slow down." },
        { status: 429 }
      );
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    const bodyResult = await parseAndValidateBody<{
      op?: string;
      data?: string;
      nonce?: string;
      ts?: number;
      sig?: string;
    }>(req);

    if (!bodyResult.ok) {
      return bodyResult.response;
    }

    const { op, data: rawData, nonce, ts, sig } = bodyResult.data;

    if (!op || !rawData || !nonce || typeof ts !== "number" || !sig) {
      return NextResponse.json({ message: "Malformed gateway envelope." }, { status: 400 });
    }

    const nonceCheck = validateGatewayNonce(nonce, ts);
    if (!nonceCheck.valid) {
      return NextResponse.json(
        { message: nonceCheck.error || "Anti-replay validation failed." },
        { status: 403 }
      );
    }

    if (!verifyGatewaySignature(op, rawData, nonce, ts, sig)) {
      return NextResponse.json({ message: "Gateway integrity signature verification failed." }, { status: 403 });
    }

    const payload = deobfuscatePayload<any>(rawData);
    if (payload === null && rawData.trim() !== "") {
      return NextResponse.json({ message: "Failed to decode payload." }, { status: 400 });
    }

    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Session expired or unauthorized." }, { status: 401 });
    }

    // 0x30: FETCH EVENT PROPOSALS & DEPARTMENT DIRECTORY
    if (op === GATEWAY_OPCODES.FETCH_EVENT_PROPOSALS) {
      if (!isAuthorizedForEventProposal(user)) {
        return NextResponse.json(
          { message: "Access restricted: Only Society Presidents, Vice-Presidents, and Dean KSAC are authorized." },
          { status: 403 }
        );
      }

      const departments = await ensureDepartmentDirectory();
      let proposals: any[] = [];

      if (user.role === "dean" || user.role === "admin") {
        proposals = await EventProposal.find({}).sort({ createdAt: -1 }).lean();
      } else {
        const userSocieties = new Set<string>();
        if (user.society) userSocieties.add(user.society);
        if (Array.isArray(user.societyPositions)) {
          user.societyPositions.forEach((sp: any) => {
            if (sp.society) userSocieties.add(sp.society);
          });
        }
        proposals = await EventProposal.find({
          $or: [
            { studentId: user._id },
            { society: { $in: Array.from(userSocieties) } },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();
      }

      const response = NextResponse.json({ proposals, departments });
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    // 0x31: SAVE / SUBMIT EVENT PROPOSAL
    if (op === GATEWAY_OPCODES.SAVE_EVENT_PROPOSAL) {
      if (!isAuthorizedForEventProposal(user)) {
        return NextResponse.json(
          { message: "Access restricted: Only Society Presidents, Vice-Presidents, and Dean KSAC can save event proposals." },
          { status: 403 }
        );
      }

      const raw = payload || {};
      const eventNameCheck = sanitizeString(raw.eventName, 180, "Event Name");
      if (!eventNameCheck.valid || !eventNameCheck.value) {
        return NextResponse.json({ message: "Event Name is required." }, { status: 400 });
      }

      const societyCheck = sanitizeString(raw.society || user.society || "KSAC Society", 120, "Society");
      const backgroundCheck = sanitizeString(raw.background, 4000, "Background");
      if (!backgroundCheck.valid || !backgroundCheck.value) {
        return NextResponse.json({ message: "Event Background is required." }, { status: 400 });
      }

      const enabledSections = Array.isArray(raw.enabledSections)
        ? raw.enabledSections.map((s: any) => String(s).toUpperCase().trim()).filter(Boolean)
        : ["SUB_EVENTS", "GUIDELINES", "BUDGET", "VENUE", "TECHNICAL", "MARKETING"];

      // Sanitize budget items & calculate total
      const budgetItems = Array.isArray(raw.budgetItems)
        ? raw.budgetItems
            .map((b: any, idx: number) => {
              const particulars = sanitizeString(b.particulars, 200, "Particulars").value;
              if (!particulars) return null;
              const quantity = sanitizeString(String(b.quantity ?? "1"), 60, "Quantity").value || "1";
              const unitPrice = sanitizeString(String(b.unitPrice ?? "0"), 60, "Unit Price").value || "0";
              const numericQty = parseFloat(quantity.replace(/[^0-9.]/g, "")) || 1;
              const numericUnit = parseFloat(unitPrice.replace(/[^0-9.]/g, "")) || 0;
              const explicitTotal = Number(b.totalCost);
              const totalCost =
                Number.isFinite(explicitTotal) && explicitTotal > 0
                  ? Math.round(explicitTotal)
                  : Math.round(numericQty * numericUnit);
              return {
                slNo: idx + 1,
                particulars,
                quantity,
                unitPrice,
                totalCost,
                category: sanitizeString(b.category || "FINANCE", 40, "Category").value || "FINANCE",
              };
            })
            .filter(Boolean)
        : [];

      const budgetTotal = enabledSections.includes("BUDGET")
        ? budgetItems.reduce((acc: number, item: any) => acc + (Number(item.totalCost) || 0), 0)
        : 0;
      const budgetInWords = numberToIndianRupeeWords(budgetTotal);

      // Sanitize revenue items
      const revenueItems = Array.isArray(raw.revenueItems)
        ? raw.revenueItems
            .map((r: any, idx: number) => {
              const source = sanitizeString(r.source, 200, "Revenue Source").value;
              if (!source) return null;
              const amountFormula = sanitizeString(String(r.amountFormula ?? ""), 100, "Amount Formula").value;
              const total = Math.round(Number(r.total) || 0);
              return { slNo: idx + 1, source, amountFormula, total };
            })
            .filter(Boolean)
        : [];
      const revenueTotal = enabledSections.includes("REVENUE")
        ? revenueItems.reduce((acc: number, item: any) => acc + (Number(item.total) || 0), 0)
        : 0;

      // Sanitize sub-events
      const subEvents = Array.isArray(raw.subEvents)
        ? raw.subEvents
            .map((se: any) => {
              const name = sanitizeString(se.name, 200, "Sub-Event Name").value;
              if (!name) return null;
              return {
                name,
                dayLabel: sanitizeString(se.dayLabel || "Day 1", 60, "Day Label").value,
                date: sanitizeString(se.date || "", 80, "Date").value,
                timings: sanitizeString(se.timings || "", 80, "Timings").value,
                description: sanitizeString(se.description || "", 2000, "Description").value,
              };
            })
            .filter(Boolean)
        : [];

      // Sanitize speaker details
      const rawSpeaker = raw.speakerDetails || {};
      const speakerFeeItems = Array.isArray(rawSpeaker.feeItems)
        ? rawSpeaker.feeItems
            .map((f: any, idx: number) => {
              const particulars = sanitizeString(f.particulars, 200, "Speaker Fee Item").value;
              if (!particulars) return null;
              const quantity = sanitizeString(String(f.quantity ?? "1"), 40, "Qty").value;
              const pricing = Number(f.pricing) || 0;
              const total = Number(f.total) || pricing;
              return { slNo: idx + 1, particulars, quantity, pricing, total };
            })
            .filter(Boolean)
        : [];

      const speakerDetails = {
        name: sanitizeString(rawSpeaker.name || "", 120, "Speaker Name").value,
        bio: sanitizeString(rawSpeaker.bio || "", 2000, "Speaker Bio").value,
        managerContact: sanitizeString(rawSpeaker.managerContact || "", 200, "Manager Contact").value,
        feeItems: speakerFeeItems,
      };

      const sanitizeReqList = (arr: any[], defaultCat: string) =>
        Array.isArray(arr)
          ? arr
              .map((it: any) => {
                if (!it) return null;
                return {
                  date: sanitizeString(it.date || "", 60, "Date").value,
                  campus: sanitizeString(it.campus || "", 60, "Campus").value,
                  timings: sanitizeString(it.timings || "", 80, "Timings").value,
                  venueType: sanitizeString(it.venueType || it.item || it.particulars || "", 100, "Type").value,
                  item: sanitizeString(it.item || it.particulars || it.venueType || "", 120, "Item").value,
                  quantity: sanitizeString(String(it.quantity ?? "1"), 40, "Qty").value,
                  details: sanitizeString(it.details || it.specifications || "", 500, "Details").value,
                  departmentCategory: defaultCat,
                };
              })
              .filter(Boolean)
          : [];

      const venueRequirements = sanitizeReqList(raw.venueRequirements, "VENUE");
      const technicalRequirements = sanitizeReqList(raw.technicalRequirements, "TECHNICAL");
      const foodRequirements = sanitizeReqList(raw.foodRequirements, "FOOD");
      const printingRequirements = sanitizeReqList(raw.printingRequirements, "PRINTING");
      const prizeRequirements = sanitizeReqList(raw.prizeRequirements, "PRIZES");
      const securityRequirements = sanitizeReqList(raw.securityRequirements, "SECURITY");
      const avRequirements = sanitizeReqList(raw.avRequirements, "MEDIA");

      const facultyCoordinators = Array.isArray(raw.facultyCoordinators)
        ? raw.facultyCoordinators
            .map((fc: any) => {
              const name = sanitizeString(fc.name, 120, "Faculty Name").value;
              if (!name) return null;
              return {
                name,
                designation: sanitizeString(fc.designation || "Faculty Coordinator", 120, "Designation").value,
                department: sanitizeString(fc.department || "", 120, "Department").value,
                phone: sanitizeString(fc.phone || "", 40, "Phone").value,
                email: sanitizeString(fc.email || "", 120, "Email").value,
              };
            })
            .filter(Boolean)
        : [];

      const signatories = Array.isArray(raw.signatories)
        ? raw.signatories
            .map((s: any) => {
              const roleTitle = sanitizeString(s.roleTitle, 120, "Signatory Role").value;
              if (!roleTitle) return null;
              const loc = ["NOTESHEET", "FOOTER", "BOTH"].includes(s.location) ? s.location : "FOOTER";
              return {
                roleTitle,
                name: sanitizeString(s.name || "", 120, "Name").value,
                designation: sanitizeString(s.designation || roleTitle, 160, "Designation").value,
                location: loc,
              };
            })
            .filter(Boolean)
        : [];

      const userPos =
        user.societyPositions?.find((sp: any) => sp.society === (societyCheck.value || user.society))?.position ||
        user.position ||
        (user.role === "dean" ? "Dean KSAC" : "President");

      const proposalData = {
        eventName: eventNameCheck.value,
        society: societyCheck.value,
        academicYear: sanitizeString(raw.academicYear || "2025-2026", 40, "Academic Year").value,
        datesDisplay: sanitizeString(raw.datesDisplay || "", 100, "Dates Display").value,
        expectedParticipants: Number(raw.expectedParticipants) || 100,
        background: backgroundCheck.value,
        rationale: sanitizeString(raw.rationale || "", 4000, "Rationale").value,
        outcomes: sanitizeString(raw.outcomes || "", 4000, "Outcomes").value,
        participationGuidelines: sanitizeString(raw.participationGuidelines || "", 4000, "Guidelines").value,
        enabledSections,
        budgetItems,
        budgetTotal,
        budgetInWords,
        revenueItems,
        revenueTotal,
        subEvents,
        speakerDetails,
        venueRequirements,
        technicalRequirements,
        foodRequirements,
        printingRequirements,
        prizeRequirements,
        securityRequirements,
        avRequirements,
        facultyCoordinators,
        signatories,
        notesheetRecipient: sanitizeString(
          raw.notesheetRecipient || "The Pro-Vice Chancellor (Admin)-cum-Registrar\nKIIT-DU",
          300,
          "Notesheet Recipient"
        ).value,
        notesheetSubject: sanitizeString(raw.notesheetSubject || "", 300, "Notesheet Subject").value,
        notesheetBody: sanitizeString(raw.notesheetBody || "", 4000, "Notesheet Body").value,
        updatedAt: new Date(),
      };

      const departments = await ensureDepartmentDirectory();
      const synthesizedMails = extractDepartmentEmailsForProposal(
        {
          ...proposalData,
          studentName: user.name,
          position: userPos,
        },
        departments as any
      );

      const requestedStatus = raw.saveAsDraft === true ? "DRAFT" : "SUBMITTED";

      let proposalDoc: any;
      if (raw.proposalId && isValidMongoId(raw.proposalId)) {
        const existing = await EventProposal.findById(raw.proposalId);
        if (!existing) {
          return NextResponse.json({ message: "Event proposal not found." }, { status: 404 });
        }
        const mergedMails = synthesizedMails.map((gen) => {
          const prev = existing.departmentMails?.find((m: any) => m.categoryKey === gen.categoryKey);
          if (prev && prev.status === "SENT") {
            return prev;
          }
          return gen;
        });

        Object.assign(existing, proposalData);
        existing.departmentMails = mergedMails;
        if (existing.status === "DRAFT" || existing.status === "REVISION_REQUESTED" || existing.status === "SUBMITTED") {
          existing.status = requestedStatus;
        }
        await existing.save();
        proposalDoc = existing;
      } else {
        proposalDoc = await EventProposal.create({
          ...proposalData,
          studentId: user._id,
          studentName: user.name,
          studentRollNo: user.rollNo,
          position: userPos,
          departmentMails: synthesizedMails,
          status: requestedStatus,
        });
      }

      const response = NextResponse.json({ proposal: proposalDoc });
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    // 0x32: ACTION EVENT PROPOSAL (Dean KSAC)
    if (op === GATEWAY_OPCODES.ACTION_EVENT_PROPOSAL) {
      if (user.role !== "dean" && user.role !== "admin") {
        return NextResponse.json({ message: "Only Dean KSAC can control event proposals." }, { status: 403 });
      }

      const { proposalId, action, deanNote, signatories } = payload || {};
      if (!isValidMongoId(proposalId)) {
        return NextResponse.json({ message: "Invalid Proposal ID." }, { status: 400 });
      }

      const proposal = await EventProposal.findById(proposalId);
      if (!proposal) {
        return NextResponse.json({ message: "Event proposal not found." }, { status: 404 });
      }

      if (typeof deanNote === "string") {
        proposal.deanNote = sanitizeString(deanNote, 1000, "Dean Note").value;
      }

      if (Array.isArray(signatories)) {
        proposal.signatories = signatories
          .map((s: any) => {
            const roleTitle = sanitizeString(s.roleTitle, 120, "Signatory Role").value;
            if (!roleTitle) return null;
            const loc = ["NOTESHEET", "FOOTER", "BOTH"].includes(s.location) ? s.location : "FOOTER";
            return {
              roleTitle,
              name: sanitizeString(s.name || "", 120, "Name").value,
              designation: sanitizeString(s.designation || roleTitle, 160, "Designation").value,
              location: loc,
            };
          })
          .filter(Boolean);
      }

      if (action === "APPROVE") {
        proposal.status = "APPROVED";
        proposal.approvedBy = user._id;
        proposal.approvedAt = new Date();
      } else if (action === "REQUEST_REVISION") {
        proposal.status = "REVISION_REQUESTED";
      } else if (action === "REJECT") {
        proposal.status = "REJECTED";
      } else if (action === "VERIFY_SOFTCOPY") {
        if (proposal.signedSoftcopy) {
          proposal.signedSoftcopy.verifiedByDean = true;
          proposal.signedSoftcopy.verifiedAt = new Date();
        }
        proposal.status = "COMPLETED";
      } else if (action === "REGENERATE_MAILS") {
        const departments = await ensureDepartmentDirectory();
        proposal.departmentMails = extractDepartmentEmailsForProposal(proposal.toObject(), departments as any);
      }

      proposal.updatedAt = new Date();
      await proposal.save();

      const response = NextResponse.json({ proposal });
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    // 0x33: SEND DEPARTMENT EMAILS (Dean KSAC)
    if (op === GATEWAY_OPCODES.SEND_DEPARTMENT_EMAILS) {
      if (user.role !== "dean" && user.role !== "admin") {
        return NextResponse.json({ message: "Only Dean KSAC can dispatch department emails." }, { status: 403 });
      }

      const { proposalId, categoryKey, updatedMail, approveOnSend } = payload || {};
      if (!isValidMongoId(proposalId)) {
        return NextResponse.json({ message: "Invalid Proposal ID." }, { status: 400 });
      }

      const proposal = await EventProposal.findById(proposalId);
      if (!proposal) {
        return NextResponse.json({ message: "Event proposal not found." }, { status: 404 });
      }

      if (!Array.isArray(proposal.departmentMails) || proposal.departmentMails.length === 0) {
        const departments = await ensureDepartmentDirectory();
        proposal.departmentMails = extractDepartmentEmailsForProposal(proposal.toObject(), departments as any);
      }

      if (updatedMail && updatedMail.categoryKey) {
        const targetIdx = proposal.departmentMails.findIndex(
          (m: any) => m.categoryKey === updatedMail.categoryKey
        );
        if (targetIdx !== -1) {
          if (updatedMail.recipientEmail) {
            proposal.departmentMails[targetIdx].recipientEmail = sanitizeString(
              updatedMail.recipientEmail,
              200,
              "Recipient Email"
            ).value;
          }
          if (Array.isArray(updatedMail.ccEmails)) {
            proposal.departmentMails[targetIdx].ccEmails = updatedMail.ccEmails
              .map((c: any) => sanitizeString(c, 200, "CC").value)
              .filter(Boolean);
          }
          if (updatedMail.subject) {
            proposal.departmentMails[targetIdx].subject = sanitizeString(
              updatedMail.subject,
              300,
              "Subject"
            ).value;
          }
          if (updatedMail.bodyText) {
            proposal.departmentMails[targetIdx].bodyText = String(updatedMail.bodyText).slice(0, 15000);
          }
          if (updatedMail.bodyHtml) {
            proposal.departmentMails[targetIdx].bodyHtml = String(updatedMail.bodyHtml).slice(0, 30000);
          }
        }
      }

      const defaultOfficialSender = process.env.KSAC_OFFICIAL_SMTP_EMAIL || "ksac.office@kiit.ac.in";
      const defaultReplyTo = user.email || process.env.DEAN_REPLYTO_EMAIL || "deanksac@kiit.ac.in";
      const defaultDisplayName = process.env.KSAC_SMTP_DISPLAY_NAME || "Office of the Dean, KSAC";

      const rawSenderDisplayName =
        updatedMail?.senderDisplayName || payload?.senderDisplayName || defaultDisplayName;
      const rawOfficialSender =
        updatedMail?.officialSenderEmail || payload?.officialSenderEmail || defaultOfficialSender;
      const rawReplyTo =
        updatedMail?.replyToEmail || payload?.replyToEmail || defaultReplyTo;

      const safeSenderDisplayName =
        sanitizeString(rawSenderDisplayName, 120, "Sender Display Name").value || defaultDisplayName;
      const safeOfficialSender =
        sanitizeString(rawOfficialSender, 120, "Official Sender Email").value || defaultOfficialSender;
      const safeReplyTo =
        sanitizeString(rawReplyTo, 120, "Dean Reply-To Email").value || defaultReplyTo;

      const targetKey = categoryKey ? String(categoryKey).toUpperCase() : "ALL";
      let sentCount = 0;
      let simulatedCount = 0;
      const errors: string[] = [];

      for (const mail of proposal.departmentMails) {
        if (targetKey !== "ALL" && mail.categoryKey.toUpperCase() !== targetKey) {
          continue;
        }
        const res = await sendDepartmentRequirementEmail({
          recipientEmail: mail.recipientEmail,
          ccEmails: mail.ccEmails,
          subject: mail.subject,
          bodyText: mail.bodyText,
          bodyHtml: mail.bodyHtml,
          senderDisplayName: safeSenderDisplayName,
          officialSenderEmail: safeOfficialSender,
          replyToEmail: safeReplyTo,
        });

        mail.fromAddress = res.from || `"${safeSenderDisplayName}" <${safeOfficialSender}>`;
        mail.replyToAddress = res.replyTo || safeReplyTo;

        if (res.sent) {
          mail.status = "SENT";
          mail.sentAt = new Date();
          mail.errorNote = "";
          sentCount++;
          if (res.simulated) simulatedCount++;
        } else {
          mail.status = "FAILED";
          mail.errorNote = res.error || "Delivery failed";
          errors.push(`${mail.departmentName}: ${mail.errorNote}`);
        }
      }

      if (approveOnSend !== false && (proposal.status === "SUBMITTED" || proposal.status === "REVISION_REQUESTED")) {
        proposal.status = "APPROVED";
        proposal.approvedBy = user._id;
        proposal.approvedAt = new Date();
      }

      proposal.updatedAt = new Date();
      await proposal.save();

      const response = NextResponse.json({
        proposal,
        sentCount,
        simulatedCount,
        errors,
      });
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    // 0x34: SAVE DEPARTMENT CONFIG
    if (op === GATEWAY_OPCODES.SAVE_DEPARTMENT_CONFIG) {
      if (user.role !== "dean" && user.role !== "admin") {
        return NextResponse.json({ message: "Only Dean KSAC can manage the Department Directory." }, { status: 403 });
      }

      const { mode, department } = payload || {};

      if (mode === "RESET_DEFAULTS") {
        await DepartmentConfig.deleteMany({});
        await DepartmentConfig.insertMany(DEFAULT_DEPARTMENT_DIRECTORY);
        const departments = await DepartmentConfig.find({}).sort({ categoryKey: 1 }).lean();
        return NextResponse.json({ departments });
      }

      if (mode === "DELETE" && department?.categoryKey) {
        const key = sanitizeString(department.categoryKey, 40, "Category Key").value.toUpperCase();
        await DepartmentConfig.deleteOne({ categoryKey: key });
        const departments = await DepartmentConfig.find({}).sort({ categoryKey: 1 }).lean();
        return NextResponse.json({ departments });
      }

      const categoryKey = sanitizeString(department?.categoryKey, 40, "Category Key").value.toUpperCase();
      const name = sanitizeString(department?.name, 160, "Department Name").value;
      const primaryEmail = sanitizeString(department?.primaryEmail, 200, "Primary Email").value;

      if (!categoryKey || !name || !primaryEmail || !primaryEmail.includes("@")) {
        return NextResponse.json(
          { message: "Department Name, Category Key, and a valid Primary Email are required." },
          { status: 400 }
        );
      }

      const ccEmails = Array.isArray(department?.ccEmails)
        ? department.ccEmails.map((c: any) => sanitizeString(c, 200, "CC Email").value).filter(Boolean)
        : typeof department?.ccEmails === "string"
        ? department.ccEmails
            .split(",")
            .map((c: string) => sanitizeString(c.trim(), 200, "CC Email").value)
            .filter(Boolean)
        : [];

      await DepartmentConfig.findOneAndUpdate(
        { categoryKey },
        {
          name,
          categoryKey,
          primaryEmail,
          ccEmails,
          contactPerson: sanitizeString(department?.contactPerson || "", 160, "Contact Person").value,
          defaultSubjectTemplate:
            sanitizeString(
              department?.defaultSubjectTemplate ||
                "KSAC Event Requirement [{category}] — {eventName} ({society}) on {dateDisplay}",
              300,
              "Subject Template"
            ).value,
          defaultHeaderNote:
            sanitizeString(
              department?.defaultHeaderNote ||
                "Kindly arrange the following approved requirements for the upcoming KSAC society event:",
              600,
              "Header Note"
            ).value,
          updatedBy: user._id,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      const departments = await DepartmentConfig.find({}).sort({ categoryKey: 1 }).lean();
      const response = NextResponse.json({ departments });
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    // 0x35: UPLOAD SIGNED SOFTCOPY
    if (op === GATEWAY_OPCODES.UPLOAD_SIGNED_SOFTCOPY) {
      if (!isAuthorizedForEventProposal(user)) {
        return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
      }

      const { proposalId, fileName, mimeType, dataUrl } = payload || {};
      if (!isValidMongoId(proposalId)) {
        return NextResponse.json({ message: "Invalid Proposal ID." }, { status: 400 });
      }

      const allowedMimeTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (typeof mimeType !== "string" || !allowedMimeTypes.includes(mimeType.toLowerCase())) {
        return NextResponse.json(
          { message: "Invalid file format. Please upload a PDF, PNG, or JPEG scan." },
          { status: 400 }
        );
      }

      if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:") || dataUrl.length > 7 * 1024 * 1024) {
        return NextResponse.json(
          { message: "Signed softcopy file must be a valid data URL under 5 MB." },
          { status: 400 }
        );
      }

      const proposal = await EventProposal.findById(proposalId);
      if (!proposal) {
        return NextResponse.json({ message: "Event proposal not found." }, { status: 404 });
      }

      proposal.signedSoftcopy = {
        fileName: sanitizeString(fileName || "Signed_Approval_Copy.pdf", 200, "File Name").value,
        mimeType: mimeType.toLowerCase(),
        dataUrl,
        uploadedAt: new Date(),
        uploadedByName: user.name,
        verifiedByDean: false,
      };
      proposal.status = "SIGNED_SOFTCOPY_SUBMITTED";
      proposal.updatedAt = new Date();
      await proposal.save();

      const response = NextResponse.json({ proposal });
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    return NextResponse.json({ message: "Unknown opcode." }, { status: 400 });
  } catch (error: any) {
    console.error("Gateway error:", error);
    return NextResponse.json({ message: "Gateway processing error." }, { status: 500 });
  }
}
