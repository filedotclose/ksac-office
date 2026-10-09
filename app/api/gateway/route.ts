import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUserFromToken } from "@/lib/auth";
import EventProposal from "@/models/EventProposal";
import DepartmentConfig from "@/models/DepartmentConfig";
import RoughEventRequest from "@/models/RoughEventRequest";
import EventBudget from "@/models/EventBudget";
import SocietyFile from "@/models/SocietyFile";
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

async function syncEventBudget(proposal: any) {
  if (!proposal) return;
  try {
    const categoryBreakdown: Record<string, number> = {};
    if (Array.isArray(proposal.budgetItems)) {
      for (const item of proposal.budgetItems) {
        const cat = item.category || "GENERAL";
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (Number(item.totalCost) || 0);
      }
    }

    await EventBudget.findOneAndUpdate(
      { proposalId: proposal._id },
      {
        proposalId: proposal._id,
        eventName: proposal.eventName,
        society: proposal.society,
        academicYear: proposal.academicYear || "2025-2026",
        budgetTotal: proposal.budgetTotal || 0,
        budgetInWords: proposal.budgetInWords || "",
        revenueTotal: proposal.revenueTotal || 0,
        status: proposal.status,
        itemsCount: Array.isArray(proposal.budgetItems) ? proposal.budgetItems.length : 0,
        categoryBreakdown,
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("Failed to sync EventBudget table:", err);
  }
}

async function syncSocietyFilesFromProposal(proposal: any, user: any) {
  if (!proposal || !proposal.society) return;
  const society = proposal.society;

  try {
    // 1. Banner
    if (proposal.bannerDetails?.dataUrl && proposal.bannerDetails?.fileName) {
      await SocietyFile.findOneAndUpdate(
        { proposalId: proposal._id, fileType: "BANNER" },
        {
          society,
          proposalId: proposal._id,
          eventName: proposal.eventName,
          fileType: "BANNER",
          fileName: proposal.bannerDetails.fileName,
          mimeType: proposal.bannerDetails.mimeType || "image/png",
          fileDimensions: proposal.bannerDetails.dimensions || proposal.bannerDetails.format || "12x8 ft",
          dataUrl: proposal.bannerDetails.dataUrl,
          uploadedById: user._id,
          uploadedByName: user.name,
        },
        { upsert: true, new: true }
      );
    }

    // 2. Poster
    if (proposal.posterDetails?.dataUrl && proposal.posterDetails?.fileName) {
      await SocietyFile.findOneAndUpdate(
        { proposalId: proposal._id, fileType: "POSTER" },
        {
          society,
          proposalId: proposal._id,
          eventName: proposal.eventName,
          fileType: "POSTER",
          fileName: proposal.posterDetails.fileName,
          mimeType: proposal.posterDetails.mimeType || "image/png",
          fileDimensions: proposal.posterDetails.format || "A3 Physical Print",
          dataUrl: proposal.posterDetails.dataUrl,
          uploadedById: user._id,
          uploadedByName: user.name,
        },
        { upsert: true, new: true }
      );
    }

    // 3. Society Logo
    if (proposal.societyLogo?.dataUrl && proposal.societyLogo?.fileName) {
      await SocietyFile.findOneAndUpdate(
        { society, fileType: "SOCIETY_LOGO" },
        {
          society,
          fileType: "SOCIETY_LOGO",
          fileName: proposal.societyLogo.fileName,
          mimeType: proposal.societyLogo.mimeType || "image/png",
          dataUrl: proposal.societyLogo.dataUrl,
          uploadedById: user._id,
          uploadedByName: user.name,
        },
        { upsert: true, new: true }
      );
    }

    // 4. Sponsors & MoUs
    if (Array.isArray(proposal.sponsors)) {
      for (const sp of proposal.sponsors) {
        if (sp.mouDataUrl && sp.mouFileName) {
          await SocietyFile.findOneAndUpdate(
            { proposalId: proposal._id, fileType: "MOU", notes: sp.name },
            {
              society,
              proposalId: proposal._id,
              eventName: proposal.eventName,
              fileType: "MOU",
              fileName: sp.mouFileName,
              mimeType: sp.mouMimeType || "application/pdf",
              dataUrl: sp.mouDataUrl,
              uploadedById: user._id,
              uploadedByName: user.name,
              notes: sp.name,
            },
            { upsert: true, new: true }
          );
        }
      }
    }

    // 5. Signed softcopy
    if (proposal.signedSoftcopy?.dataUrl && proposal.signedSoftcopy?.fileName) {
      await SocietyFile.findOneAndUpdate(
        { proposalId: proposal._id, fileType: "SIGNED_COPY" },
        {
          society,
          proposalId: proposal._id,
          eventName: proposal.eventName,
          fileType: "SIGNED_COPY",
          fileName: proposal.signedSoftcopy.fileName,
          mimeType: proposal.signedSoftcopy.mimeType || "application/pdf",
          dataUrl: proposal.signedSoftcopy.dataUrl,
          uploadedById: user._id,
          uploadedByName: user.name,
        },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.error("Failed to sync SocietyFiles catalog:", err);
  }
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
          { message: "Access restricted: Only Society Presidents, Vice-Presidents, FICs, and Dean KSAC are authorized." },
          { status: 403 }
        );
      }

      const departments = await ensureDepartmentDirectory();
      let proposals: any[] = [];

      if (user.role === "dean" || user.role === "admin") {
        proposals = await EventProposal.find({}).sort({ createdAt: -1 }).lean();
      } else if (user.role === "fic") {
        if (Array.isArray(user.assignedSocieties) && user.assignedSocieties.length > 0) {
          proposals = await EventProposal.find({
            society: { $in: user.assignedSocieties },
          })
            .sort({ createdAt: -1 })
            .lean();
        } else {
          proposals = await EventProposal.find({}).sort({ createdAt: -1 }).lean();
        }
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
          { message: "Access restricted: Unauthorized to submit proposals." },
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
        : ["SUB_EVENTS", "GUIDELINES", "BUDGET", "VENUE", "TECHNICAL", "MARKETING", "SECURITY", "FELICITATION", "SPONSORS"];

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
        speakerTotal: speakerFeeItems.reduce((sum: number, it: any) => sum + (Number(it.total) || 0), 0),
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
      const marketingRequirements = sanitizeReqList(raw.marketingRequirements, "MARKETING");

      // Security requirements
      const securityRequirements = Array.isArray(raw.securityRequirements)
        ? raw.securityRequirements
            .map((s: any) => {
              if (!s) return null;
              return {
                date: sanitizeString(s.date || "", 60, "Date").value,
                timings: sanitizeString(s.timings || "", 80, "Timings").value,
                campus: sanitizeString(s.campus || "", 60, "Campus").value,
                securityType: sanitizeString(s.securityType || s.item || "Security Guards", 100, "Security Type").value,
                quantity: Number(s.quantity) || 1,
                details: sanitizeString(s.details || "", 500, "Details").value,
              };
            })
            .filter(Boolean)
        : [];

      // Felicitation requirements
      const felicitationRequirements = Array.isArray(raw.felicitationRequirements)
        ? raw.felicitationRequirements
            .map((f: any) => {
              if (!f) return null;
              return {
                date: sanitizeString(f.date || "", 60, "Date").value,
                item: sanitizeString(f.item || "", 120, "Item").value,
                quantity: Number(f.quantity) || 1,
                recipientDignitary: sanitizeString(f.recipientDignitary || "", 140, "Recipient").value,
                details: sanitizeString(f.details || "", 500, "Details").value,
              };
            })
            .filter(Boolean)
        : [];

      // Sponsors & MoU
      const sponsors = Array.isArray(raw.sponsors)
        ? raw.sponsors
            .map((sp: any) => {
              if (!sp) return null;
              const name = sanitizeString(sp.name || "", 120, "Sponsor Name").value;
              if (!name) return null;
              return {
                name,
                tier: sanitizeString(sp.tier || "Associate Partner", 80, "Tier").value,
                contributionAmount: Number(sp.contributionAmount) || 0,
                mouFileName: sanitizeString(sp.mouFileName || "", 200, "MoU Name").value,
                mouDataUrl: typeof sp.mouDataUrl === "string" && sp.mouDataUrl.startsWith("data:") ? sp.mouDataUrl : "",
                mouMimeType: sanitizeString(sp.mouMimeType || "application/pdf", 100, "MIME").value,
                contactPerson: sanitizeString(sp.contactPerson || "", 120, "Contact").value,
                contactEmail: sanitizeString(sp.contactEmail || "", 120, "Email").value,
              };
            })
            .filter(Boolean)
        : [];

      // Banners, Posters & Society Logo
      const bannerDetails = {
        format: sanitizeString(raw.bannerDetails?.format || "Stage Backdrop 12x8 ft", 100, "Banner Format").value,
        dimensions: sanitizeString(raw.bannerDetails?.dimensions || "12x8 ft", 60, "Dimensions").value,
        material: sanitizeString(raw.bannerDetails?.material || "Star Flex", 60, "Material").value,
        fileName: sanitizeString(raw.bannerDetails?.fileName || "", 200, "Banner File").value,
        dataUrl: typeof raw.bannerDetails?.dataUrl === "string" && raw.bannerDetails.dataUrl.startsWith("data:") ? raw.bannerDetails.dataUrl : "",
        mimeType: sanitizeString(raw.bannerDetails?.mimeType || "image/png", 80, "MIME").value,
      };

      const posterDetails = {
        format: sanitizeString(raw.posterDetails?.format || "A3 Physical Print", 100, "Poster Format").value,
        fileName: sanitizeString(raw.posterDetails?.fileName || "", 200, "Poster File").value,
        dataUrl: typeof raw.posterDetails?.dataUrl === "string" && raw.posterDetails.dataUrl.startsWith("data:") ? raw.posterDetails.dataUrl : "",
        mimeType: sanitizeString(raw.posterDetails?.mimeType || "image/png", 80, "MIME").value,
      };

      const societyLogo = {
        fileName: sanitizeString(raw.societyLogo?.fileName || "", 200, "Logo File").value,
        dataUrl: typeof raw.societyLogo?.dataUrl === "string" && raw.societyLogo.dataUrl.startsWith("data:") ? raw.societyLogo.dataUrl : "",
        mimeType: sanitizeString(raw.societyLogo?.mimeType || "image/png", 80, "MIME").value,
      };

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
        (user.role === "dean" ? "Dean KSAC" : user.role === "fic" ? "Faculty In-Charge" : "President");

      const roughRequestId = raw.roughRequestId && isValidMongoId(raw.roughRequestId) ? raw.roughRequestId : undefined;

      const proposalData = {
        eventName: eventNameCheck.value,
        tagline: sanitizeString(raw.tagline || "", 160, "Tagline").value,
        society: societyCheck.value,
        societyFullName: sanitizeString(raw.societyFullName || "", 160, "Full Society Name").value,
        eventMode: ["OFFLINE", "ONLINE", "HYBRID"].includes(raw.eventMode) ? raw.eventMode : "OFFLINE",
        startDate: sanitizeString(raw.startDate || "2026-10-25", 40, "Start Date").value,
        endDate: sanitizeString(raw.endDate || "2026-10-26", 40, "End Date").value,
        dateDisplay: sanitizeString(raw.dateDisplay || raw.datesDisplay || "", 100, "Dates Display").value,
        submissionDate: sanitizeString(raw.submissionDate || "", 60, "Submission Date").value,
        venueCampus: sanitizeString(raw.venueCampus || "Campus 25", 80, "Venue Campus").value,
        ocHeadcount: Number(raw.ocHeadcount) || 30,
        expectedParticipants: Number(raw.expectedParticipants) || 100,
        background: backgroundCheck.value,
        guidelines: raw.guidelines || {},
        objectives: Array.isArray(raw.objectives) ? raw.objectives.map((o: any) => sanitizeString(String(o), 300, "Objective").value).filter(Boolean) : [],
        eventFormatSummary: sanitizeString(raw.eventFormatSummary || "", 2000, "Format Summary").value,
        summary: sanitizeString(raw.summary || "", 2000, "Summary").value,
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
        marketingRequirements,
        securityRequirements,
        felicitationRequirements,
        sponsors,
        bannerDetails,
        posterDetails,
        societyLogo,
        signatories,
        roughRequestId,
        notesheetRecipient: sanitizeString(
          raw.notesheetRecipient || "The Pro-Vice Chancellor (Admin)-cum-Registrar\nKIIT-DU",
          300,
          "Notesheet Recipient"
        ).value,
        notesheetIntro: sanitizeString(raw.notesheetIntro || "", 3000, "Notesheet Intro").value,
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

      // Student submission moves to PENDING_FIC; saveAsDraft stays DRAFT
      const requestedStatus = raw.saveAsDraft === true ? "DRAFT" : "PENDING_FIC";

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
        if (
          existing.status === "DRAFT" ||
          existing.status === "REVISION_REQUESTED_FIC" ||
          existing.status === "REVISION_REQUESTED"
        ) {
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

        if (roughRequestId) {
          await RoughEventRequest.findByIdAndUpdate(roughRequestId, {
            convertedToProposalId: proposalDoc._id,
          });
        }
      }

      await syncEventBudget(proposalDoc);
      await syncSocietyFilesFromProposal(proposalDoc, user);

      const response = NextResponse.json({ proposal: proposalDoc });
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    // 0x39: FIC ACTION PROPOSAL (Student -> FIC -> Dean)
    if (op === GATEWAY_OPCODES.FIC_ACTION_PROPOSAL) {
      if (user.role !== "fic" && user.role !== "dean" && user.role !== "admin") {
        return NextResponse.json({ message: "Only Faculty In-Charge (FIC) or Admin can execute FIC review." }, { status: 403 });
      }

      const { proposalId, action, remarks } = payload || {};
      if (!isValidMongoId(proposalId)) {
        return NextResponse.json({ message: "Invalid Proposal ID." }, { status: 400 });
      }

      const proposal = await EventProposal.findById(proposalId);
      if (!proposal) {
        return NextResponse.json({ message: "Event proposal not found." }, { status: 404 });
      }

      const safeRemarks = sanitizeString(remarks || "", 1000, "FIC Remarks").value;

      if (action === "APPROVE") {
        proposal.status = "PENDING_DEAN"; // Advance to Dean KSAC review stage
        proposal.ficApproval = {
          approvedBy: user._id,
          ficName: user.name,
          approvedAt: new Date(),
          remarks: safeRemarks,
          status: "APPROVED",
        };
      } else if (action === "REQUEST_REVISION") {
        proposal.status = "REVISION_REQUESTED_FIC";
        proposal.ficApproval = {
          approvedBy: user._id,
          ficName: user.name,
          approvedAt: new Date(),
          remarks: safeRemarks,
          status: "REVISION_REQUESTED",
        };
      } else if (action === "REJECT") {
        proposal.status = "REJECTED";
        proposal.ficApproval = {
          approvedBy: user._id,
          ficName: user.name,
          approvedAt: new Date(),
          remarks: safeRemarks,
          status: "REJECTED",
        };
      }

      proposal.updatedAt = new Date();
      await proposal.save();

      await syncEventBudget(proposal);

      const response = NextResponse.json({ proposal });
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
        proposal.deanApproval = {
          approvedBy: user._id,
          deanName: user.name,
          approvedAt: new Date(),
          remarks: proposal.deanNote || "",
        };
      } else if (action === "REQUEST_REVISION") {
        proposal.status = "REVISION_REQUESTED_DEAN";
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

      await syncEventBudget(proposal);

      const response = NextResponse.json({ proposal });
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    // 0x36: FETCH ROUGH EVENT REQUESTS
    if (op === GATEWAY_OPCODES.FETCH_ROUGH_REQUESTS) {
      let requests: any[] = [];
      if (user.role === "dean" || user.role === "admin") {
        requests = await RoughEventRequest.find({}).sort({ createdAt: -1 }).lean();
      } else if (user.role === "fic") {
        if (Array.isArray(user.assignedSocieties) && user.assignedSocieties.length > 0) {
          requests = await RoughEventRequest.find({
            society: { $in: user.assignedSocieties },
          })
            .sort({ createdAt: -1 })
            .lean();
        } else {
          requests = await RoughEventRequest.find({}).sort({ createdAt: -1 }).lean();
        }
      } else {
        const userSocieties = new Set<string>();
        if (user.society) userSocieties.add(user.society);
        if (Array.isArray(user.societyPositions)) {
          user.societyPositions.forEach((sp: any) => {
            if (sp.society) userSocieties.add(sp.society);
          });
        }
        requests = await RoughEventRequest.find({
          $or: [
            { studentId: user._id },
            { society: { $in: Array.from(userSocieties) } },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();
      }

      const response = NextResponse.json({ requests });
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    // 0x37: SAVE ROUGH EVENT REQUEST
    if (op === GATEWAY_OPCODES.SAVE_ROUGH_REQUEST) {
      const raw = payload || {};
      const eventName = sanitizeString(raw.eventName, 180, "Event Name").value;
      const eventDate = sanitizeString(raw.eventDate, 100, "Event Date").value;
      const estimatedBudget = Number(raw.estimatedBudget) || 0;
      const society = sanitizeString(raw.society || user.society || "KSAC Society", 120, "Society").value;
      const description = sanitizeString(raw.description || "", 2000, "Description").value;

      if (!eventName || !eventDate) {
        return NextResponse.json({ message: "Event Name and Event Date are required." }, { status: 400 });
      }

      const created = await RoughEventRequest.create({
        eventName,
        eventDate,
        estimatedBudget,
        society,
        description,
        studentId: user._id,
        studentName: user.name,
        studentRollNo: user.rollNo,
        position: user.position || "President",
        status: "WAITING",
      });

      const response = NextResponse.json({ request: created });
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    // 0x38: ACTION ROUGH EVENT REQUEST (Dean / FIC: approve / disapprove / waiting)
    if (op === GATEWAY_OPCODES.ACTION_ROUGH_REQUEST) {
      if (user.role !== "dean" && user.role !== "fic" && user.role !== "admin") {
        return NextResponse.json({ message: "Only Dean or FIC can action rough event requests." }, { status: 403 });
      }

      const { requestId, action, reviewRemarks } = payload || {};
      if (!isValidMongoId(requestId)) {
        return NextResponse.json({ message: "Invalid Request ID." }, { status: 400 });
      }

      const reqDoc = await RoughEventRequest.findById(requestId);
      if (!reqDoc) {
        return NextResponse.json({ message: "Rough event request not found." }, { status: 404 });
      }

      const normalizedAction = String(action).toUpperCase();
      let newStatus: "APPROVED" | "DISAPPROVED" | "WAITING" = "WAITING";
      if (normalizedAction === "APPROVE" || normalizedAction === "APPROVED") {
        newStatus = "APPROVED";
      } else if (normalizedAction === "DISAPPROVE" || normalizedAction === "DISAPPROVED") {
        newStatus = "DISAPPROVED";
      } else {
        newStatus = "WAITING";
      }

      reqDoc.status = newStatus;
      reqDoc.reviewedBy = user._id;
      reqDoc.reviewerName = user.name;
      reqDoc.reviewerRole = user.role as any;
      reqDoc.reviewRemarks = sanitizeString(reviewRemarks || "", 1000, "Remarks").value;
      reqDoc.reviewedAt = new Date();
      await reqDoc.save();

      const response = NextResponse.json({ request: reqDoc });
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    // 0x3A: FETCH SOCIETY FILES
    if (op === GATEWAY_OPCODES.FETCH_SOCIETY_FILES) {
      const { society, fileType } = payload || {};
      const query: any = {};
      if (society && typeof society === "string" && society !== "ALL") {
        query.society = society;
      }
      if (fileType && typeof fileType === "string" && fileType !== "ALL") {
        query.fileType = fileType;
      }

      const files = await SocietyFile.find(query).sort({ createdAt: -1 }).lean();
      const response = NextResponse.json({ files });
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    // 0x3B: SAVE SOCIETY FILE
    if (op === GATEWAY_OPCODES.SAVE_SOCIETY_FILE) {
      const { society, fileType, fileName, mimeType, fileDimensions, dataUrl, notes, proposalId } = payload || {};
      if (!society || !fileType || !fileName || !dataUrl) {
        return NextResponse.json({ message: "Society, File Type, File Name and dataUrl are required." }, { status: 400 });
      }

      const fileDoc = await SocietyFile.create({
        society: sanitizeString(society, 100, "Society").value,
        proposalId: isValidMongoId(proposalId) ? proposalId : undefined,
        fileType,
        fileName: sanitizeString(fileName, 200, "File Name").value,
        mimeType: sanitizeString(mimeType || "application/octet-stream", 100, "MIME").value,
        fileDimensions: sanitizeString(fileDimensions || "", 100, "Dimensions").value,
        dataUrl,
        uploadedById: user._id,
        uploadedByName: user.name,
        notes: sanitizeString(notes || "", 500, "Notes").value,
      });

      const response = NextResponse.json({ file: fileDoc });
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    // 0x3C: FETCH EVENT BUDGETS TABLE
    if (op === GATEWAY_OPCODES.FETCH_EVENT_BUDGETS) {
      const { society } = payload || {};
      const query: any = {};
      if (society && typeof society === "string" && society !== "ALL") {
        query.society = society;
      }

      const budgets = await EventBudget.find(query).sort({ createdAt: -1 }).lean();
      const totalSanctionedBudget = budgets.reduce((acc, b) => acc + (Number(b.budgetTotal) || 0), 0);
      const totalProjectedRevenue = budgets.reduce((acc, b) => acc + (Number(b.revenueTotal) || 0), 0);

      const response = NextResponse.json({
        budgets,
        totalSanctionedBudget,
        totalProjectedRevenue,
        count: budgets.length,
      });
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

      if (approveOnSend !== false && (proposal.status === "SUBMITTED" || proposal.status === "PENDING_DEAN" || proposal.status === "REVISION_REQUESTED")) {
        proposal.status = "APPROVED";
        proposal.approvedBy = user._id;
        proposal.approvedAt = new Date();
      }

      proposal.updatedAt = new Date();
      await proposal.save();

      await syncEventBudget(proposal);

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
                "KSAC Event Requirement [{category}] - {eventName} ({society}) on {dateDisplay}",
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

      await syncEventBudget(proposal);
      await syncSocietyFilesFromProposal(proposal, user);

      const response = NextResponse.json({ proposal });
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }

    return NextResponse.json({ message: "Unknown opcode." }, { status: 400 });
  } catch (error: any) {
    console.error("Gateway error:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
