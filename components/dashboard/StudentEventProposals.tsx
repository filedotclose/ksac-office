"use client";

import React, { useEffect, useState } from "react";
import { IUser } from "@/types/user";
import { dispatchGateway, GATEWAY_OPCODES } from "@/lib/gatewayClient";
import {
  SECTION_MODULES,
  SMART_ITEM_PRESETS,
  DEFAULT_SIGNATORY_PRESETS,
  BANNER_FORMAT_PRESETS,
  POSTER_FORMAT_PRESETS,
  SPONSOR_TIERS,
  numberToIndianRupeeWords,
  formatIndianCurrency,
} from "@/lib/eventProposalPresets";
import EventProposalDocument from "./EventProposalDocument";

interface Props {
  user: IUser;
  authorizedSocieties: Array<{ society: string; position: string; allocatedRoom?: string }>;
}

export default function StudentEventProposals({ user, authorizedSocieties }: Props) {
  const defaultSociety = authorizedSocieties[0]?.society || user.society || "FED";

  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // View Mode: "list" | "builder" | "preview"
  const [viewMode, setViewMode] = useState<"list" | "builder" | "preview" | "rough">("list");
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [society, setSociety] = useState(defaultSociety);
  const [societyFullName, setSocietyFullName] = useState(`${defaultSociety} Society`);
  const [eventName, setEventName] = useState("");
  const [tagline, setTagline] = useState("");
  const [eventMode, setEventMode] = useState<"OFFLINE" | "ONLINE" | "HYBRID">("OFFLINE");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dateDisplay, setDateDisplay] = useState("");
  const [submissionDate, setSubmissionDate] = useState(() =>
    new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
  );
  const [venueCampus, setVenueCampus] = useState("Campus 25");
  const [ocHeadcount, setOcHeadcount] = useState(30);
  const [notesheetRecipient, setNotesheetRecipient] = useState(
    "The Pro-Vice Chancellor (Admin)-cum-Registrar\nKIIT-DU"
  );
  const [notesheetIntro, setNotesheetIntro] = useState("");
  const [background, setBackground] = useState("");
  const [objectives, setObjectives] = useState<string[]>([
    "Provide practical hands-on learning and industry exposure to participating students.",
    "Encourage interdisciplinary collaboration, analytical thinking, and problem-solving.",
  ]);
  const [newObjective, setNewObjective] = useState("");
  const [eventFormatSummary, setEventFormatSummary] = useState("");
  const [summary, setSummary] = useState("");

  // Level-1 Dropdown: Enabled Modular Sections
  const [enabledSections, setEnabledSections] = useState<string[]>([
    "SUB_EVENTS",
    "GUIDELINES",
    "BUDGET",
    "VENUE",
    "TECHNICAL",
    "MARKETING",
  ]);
  const [selectedSectionDropdown, setSelectedSectionDropdown] = useState<string>("FOOD");

  // Dynamic Section Data
  const [subEvents, setSubEvents] = useState<any[]>([
    {
      name: "Round 1 — Inauguration & Preliminary Track",
      dayLabel: "Day 1",
      date: "",
      timings: "09:00 AM - 01:00 PM",
      description: "Opening keynote followed by the preliminary screening round.",
    },
  ]);

  const [guidelines, setGuidelines] = useState({
    participantsYear: "1st, 2nd & 3rd Year Students",
    eligibility: "Open to all students of KIIT Deemed to be University",
    teamSize: "Interdisciplinary teams of 2 to 4 members",
    advancementRules: "Top shortlisted teams advance to the final evaluation round.",
    extraNotes: "",
  });

  const [budgetItems, setBudgetItems] = useState<any[]>([
    {
      slNo: 1,
      particulars: "Standee (5ft x 2ft)",
      quantity: "6",
      unitPrice: "300",
      totalCost: 1800,
      category: "FINANCE",
    },
    {
      slNo: 2,
      particulars: "Winner Certificates",
      quantity: "30",
      unitPrice: "25",
      totalCost: 750,
      category: "FINANCE",
    },
    {
      slNo: 3,
      particulars: "OC ID Cards + Lanyards",
      quantity: "30",
      unitPrice: "60",
      totalCost: 1800,
      category: "FINANCE",
    },
  ]);
  const [includeGstNote, setIncludeGstNote] = useState(true);

  const [revenueItems, setRevenueItems] = useState<any[]>([
    { slNo: 1, source: "Participants Registration", amountFormula: "200 x 500", total: 100000 },
  ]);
  const [revenueSummaryLine, setRevenueSummaryLine] = useState("");

  const [speakerDetails, setSpeakerDetails] = useState<any>({
    name: "",
    title: "",
    bio: "",
    managerContact: "",
    feeItems: [
      { slNo: 1, particulars: "Speaker Fees", quantity: "1", pricing: 50000, total: 50000 },
      { slNo: 2, particulars: "Speaker Fees GST (18%)", quantity: "18%", pricing: 9000, total: 9000 },
    ],
    speakerTotal: 59000,
  });

  // Department Requirement Tables
  const [venueRequirements, setVenueRequirements] = useState<any[]>([
    {
      date: "",
      campus: "Campus 25",
      timings: "09:00 AM - 05:00 PM",
      venueType: "Lecture Hall",
      quantity: 1,
      details: "Main event session & presentation",
      departmentCategory: "VENUE",
    },
  ]);

  const [technicalRequirements, setTechnicalRequirements] = useState<any[]>([
    {
      date: "",
      timings: "09:00 AM - 05:00 PM",
      venue: "Campus 25 Lecture Hall",
      item: "Podium Microphone",
      quantity: "2",
      details: "For speakers and anchors",
      departmentCategory: "TECHNICAL",
    },
    {
      date: "",
      timings: "09:00 AM - 05:00 PM",
      venue: "Campus 25 Lecture Hall",
      item: "Extension Board / Extension Cords",
      quantity: "6",
      details: "For participant and jury desks",
      departmentCategory: "TECHNICAL",
    },
  ]);

  const [foodRequirements, setFoodRequirements] = useState<any[]>([
    {
      date: "",
      item: "Water Bottles (Participants & Volunteers)",
      quantity: "100",
      details: "For event guests, judges, and volunteers",
      departmentCategory: "FOOD",
    },
  ]);

  const [marketingRequirements, setMarketingRequirements] = useState<any[]>([
    {
      startDate: "",
      endDate: "",
      item: "Desk Marketing (Tables & Chairs at Campuses)",
      campus: "Campus 3, 6, 25",
      details: "2 Tables & 4 Chairs for offline registration desk",
      departmentCategory: "MARKETING",
    },
    {
      startDate: "",
      endDate: "",
      item: "Registrar Mail (University-wide Event Promotion)",
      campus: "All Campuses",
      details: "University-wide promotional mail for student registrations",
      departmentCategory: "MARKETING",
    },
  ]);

  // Security Requisition Requirements
  const [securityRequirements, setSecurityRequirements] = useState<any[]>([
    {
      date: "",
      timings: "09:00 AM - 09:00 PM",
      campus: "Campus 25 Gate & Auditorium",
      securityType: "Campus Security Guards",
      quantity: 4,
      details: "Main gate access verification and crowd control marshals",
    },
  ]);

  // Felicitation Protocol Requirements
  const [felicitationRequirements, setFelicitationRequirements] = useState<any[]>([
    {
      date: "",
      item: "Traditional Sambalpuri Handloom Shawl / Angavastram",
      quantity: 2,
      recipientDignitary: "Chief Guest & Keynote Dignitary",
      details: "Official university handloom felicitation drape",
    },
    {
      date: "",
      item: "Traditional Brass Lamp (Diya) + Oil + Wicks + Camphor",
      quantity: 1,
      recipientDignitary: "Inaugural Ceremony Stage",
      details: "Inauguration lamp lighting setup with bronze stand",
    },
  ]);

  // Sponsors & Memorandum of Understanding (MoU)
  const [sponsors, setSponsors] = useState<any[]>([]);

  // Promotional Uploads: Banner, Poster & Society Logo
  const [bannerDetails, setBannerDetails] = useState({
    format: "Stage Backdrop (12x8 ft)",
    dimensions: "12x8 ft",
    material: "Star Flex",
    fileName: "",
    dataUrl: "",
    mimeType: "",
  });

  const [posterDetails, setPosterDetails] = useState({
    format: "A3 Physical Print (Glossy 180 GSM)",
    fileName: "",
    dataUrl: "",
    mimeType: "",
  });

  const [societyLogo, setSocietyLogo] = useState({
    fileName: "",
    dataUrl: "",
    mimeType: "",
  });

  // Pre-Proposal Rough Requests State
  const [roughRequests, setRoughRequests] = useState<any[]>([]);
  const [roughRequestId, setRoughRequestId] = useState<string | null>(null);
  const [roughForm, setRoughForm] = useState({
    eventName: "",
    eventDate: "",
    estimatedBudget: "",
    description: "",
  });
  const [submittingRough, setSubmittingRough] = useState(false);

  // Signatories State (President/VP or Dean can add/remove)
  const [signatories, setSignatories] = useState<any[]>(() =>
    DEFAULT_SIGNATORY_PRESETS.map((sp) =>
      sp.roleTitle === "FIC"
        ? { ...sp, roleTitle: `FIC, ${defaultSociety}`, designation: `FIC (${defaultSociety})` }
        : { ...sp }
    )
  );

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await dispatchGateway(GATEWAY_OPCODES.FETCH_EVENT_PROPOSALS);
      if (res.ok && res.data && Array.isArray(res.data.proposals)) {
        setProposals(res.data.proposals);
      }
      const roughRes = await dispatchGateway<{ requests: any[] }>(GATEWAY_OPCODES.FETCH_ROUGH_REQUESTS);
      if (roughRes.ok && roughRes.data?.requests) {
        setRoughRequests(roughRes.data.requests);
      }
    } catch (err) {
      console.error("Failed to fetch event proposals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const computedBudgetTotal = enabledSections.includes("BUDGET")
    ? budgetItems.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0)
    : 0;
  const computedBudgetWords = numberToIndianRupeeWords(computedBudgetTotal);

  const computedRevenueTotal = enabledSections.includes("REVENUE")
    ? revenueItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
    : 0;

  const computedSpeakerTotal = enabledSections.includes("SPEAKER")
    ? (speakerDetails.feeItems || []).reduce((sum: number, f: any) => sum + (Number(f.total) || 0), 0)
    : 0;

  const buildLiveProposalSnapshot = () => ({
    _id: editingId || "preview",
    society,
    societyFullName: societyFullName || society,
    position:
      authorizedSocieties.find((s) => s.society === society)?.position ||
      user.position ||
      "President",
    studentName: user.name,
    studentRollNo: user.rollNo,
    eventName: eventName || "UNTITLED KSAC EVENT",
    tagline,
    eventMode,
    startDate,
    endDate,
    dateDisplay: dateDisplay || (startDate === endDate ? startDate : `${startDate} to ${endDate}`),
    submissionDate,
    venueCampus,
    ocHeadcount,
    notesheetRecipient,
    notesheetIntro,
    background: background || "Event background description will appear here.",
    objectives,
    eventFormatSummary,
    summary,
    enabledSections,
    subEvents,
    guidelines,
    budgetItems,
    budgetTotal: computedBudgetTotal,
    budgetInWords: computedBudgetWords,
    includeGstNote,
    revenueItems,
    revenueTotal: computedRevenueTotal,
    revenueSummaryLine,
    speakerDetails: { ...speakerDetails, speakerTotal: computedSpeakerTotal },
    venueRequirements: venueRequirements.map((v) => ({
      ...v,
      date: v.date || dateDisplay || startDate,
    })),
    technicalRequirements: technicalRequirements.map((t) => ({
      ...t,
      date: t.date || dateDisplay || startDate,
    })),
    foodRequirements: foodRequirements.map((f) => ({
      ...f,
      date: f.date || dateDisplay || startDate,
    })),
    marketingRequirements: marketingRequirements.map((m) => ({
      ...m,
      startDate: m.startDate || startDate,
      endDate: m.endDate || endDate,
    })),
    securityRequirements: securityRequirements.map((s) => ({
      ...s,
      date: s.date || dateDisplay || startDate,
    })),
    felicitationRequirements: felicitationRequirements.map((f) => ({
      ...f,
      date: f.date || dateDisplay || startDate,
    })),
    sponsors,
    bannerDetails,
    posterDetails,
    societyLogo,
    roughRequestId,
    signatories,
    status: selectedProposal?.status || "DRAFT",
  });

  const handleCreateFromRough = (r: any) => {
    handleResetBuilder();
    setEventName(r.eventName || "");
    setDateDisplay(r.eventDate || "");
    setRoughRequestId(r._id);
    if (r.society) setSociety(r.society);
    if (r.estimatedBudget) {
      setBudgetItems([
        {
          slNo: 1,
          particulars: "Estimated Event Expenses (from Pre-request)",
          quantity: "1",
          unitPrice: String(r.estimatedBudget),
          totalCost: Number(r.estimatedBudget),
          category: "FINANCE",
        },
      ]);
    }
    setViewMode("builder");
  };

  const handleSaveRoughRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roughForm.eventName || !roughForm.eventDate) {
      setToast({ type: "error", text: "Event Name and Date are required." });
      return;
    }
    setSubmittingRough(true);
    try {
      const res = await dispatchGateway(GATEWAY_OPCODES.SAVE_ROUGH_REQUEST, {
        eventName: roughForm.eventName,
        eventDate: roughForm.eventDate,
        estimatedBudget: parseFloat(roughForm.estimatedBudget.replace(/[^0-9.]/g, "")) || 0,
        society,
        description: roughForm.description,
      });

      if (res.ok) {
        setToast({ type: "success", text: "Rough Event Request submitted! Awaiting Dean / FIC review." });
        setRoughForm({ eventName: "", eventDate: "", estimatedBudget: "", description: "" });
        fetchProposals();
      } else {
        setToast({ type: "error", text: res.message || "Failed to submit rough request." });
      }
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Network error." });
    } finally {
      setSubmittingRough(false);
    }
  };

  const handleResetBuilder = () => {
    setEditingId(null);
    setSelectedProposal(null);
    setEventName("");
    setTagline("");
    setEventMode("OFFLINE");
    setDateDisplay("");
    setVenueCampus("Campus 25");
    setOcHeadcount(30);
    setNotesheetIntro("");
    setBackground("");
    setSummary("");
    setEnabledSections(["SUB_EVENTS", "GUIDELINES", "BUDGET", "VENUE", "TECHNICAL", "MARKETING"]);
    setSignatories(
      DEFAULT_SIGNATORY_PRESETS.map((sp) =>
        sp.roleTitle === "FIC"
          ? { ...sp, roleTitle: `FIC, ${society}`, designation: `FIC (${society})` }
          : { ...sp }
      )
    );
  };

  const handleEditProposal = (p: any) => {
    setEditingId(p._id);
    setSelectedProposal(p);
    setSociety(p.society || defaultSociety);
    setSocietyFullName(p.societyFullName || p.society || defaultSociety);
    setEventName(p.eventName || "");
    setTagline(p.tagline || "");
    setEventMode(p.eventMode || "OFFLINE");
    setStartDate(p.startDate || new Date().toISOString().split("T")[0]);
    setEndDate(p.endDate || new Date().toISOString().split("T")[0]);
    setDateDisplay(p.dateDisplay || "");
    setSubmissionDate(p.submissionDate || "");
    setVenueCampus(p.venueCampus || "Campus 25");
    setOcHeadcount(p.ocHeadcount || 30);
    setNotesheetRecipient(
      p.notesheetRecipient || "The Pro-Vice Chancellor (Admin)-cum-Registrar\nKIIT-DU"
    );
    setNotesheetIntro(p.notesheetIntro || "");
    setBackground(p.background || "");
    setObjectives(Array.isArray(p.objectives) ? p.objectives : []);
    setEventFormatSummary(p.eventFormatSummary || "");
    setSecurityRequirements(Array.isArray(p.securityRequirements) ? p.securityRequirements : []);
    setFelicitationRequirements(Array.isArray(p.felicitationRequirements) ? p.felicitationRequirements : []);
    setSponsors(Array.isArray(p.sponsors) ? p.sponsors : []);
    if (p.bannerDetails) setBannerDetails(p.bannerDetails);
    if (p.posterDetails) setPosterDetails(p.posterDetails);
    if (p.societyLogo) setSocietyLogo(p.societyLogo);
    setRoughRequestId(p.roughRequestId || null);
    setSummary(p.summary || "");
    setEnabledSections(
      Array.isArray(p.enabledSections)
        ? p.enabledSections
        : ["SUB_EVENTS", "GUIDELINES", "BUDGET", "VENUE", "TECHNICAL", "MARKETING"]
    );
    if (Array.isArray(p.subEvents) && p.subEvents.length > 0) setSubEvents(p.subEvents);
    if (p.guidelines) setGuidelines(p.guidelines);
    if (Array.isArray(p.budgetItems) && p.budgetItems.length > 0) setBudgetItems(p.budgetItems);
    setIncludeGstNote(p.includeGstNote !== false);
    if (Array.isArray(p.revenueItems) && p.revenueItems.length > 0) setRevenueItems(p.revenueItems);
    setRevenueSummaryLine(p.revenueSummaryLine || "");
    if (p.speakerDetails) setSpeakerDetails(p.speakerDetails);
    if (Array.isArray(p.venueRequirements)) setVenueRequirements(p.venueRequirements);
    if (Array.isArray(p.technicalRequirements)) setTechnicalRequirements(p.technicalRequirements);
    if (Array.isArray(p.foodRequirements)) setFoodRequirements(p.foodRequirements);
    if (Array.isArray(p.marketingRequirements)) setMarketingRequirements(p.marketingRequirements);
    if (Array.isArray(p.signatories) && p.signatories.length > 0) setSignatories(p.signatories);
    setViewMode("builder");
  };

  const handleAddSectionFromDropdown = () => {
    if (!selectedSectionDropdown) return;
    if (!enabledSections.includes(selectedSectionDropdown)) {
      setEnabledSections((prev) => [...prev, selectedSectionDropdown]);
      const mod = SECTION_MODULES.find((m) => m.key === selectedSectionDropdown);
      setToast({
        type: "success",
        text: `Added section "${mod?.label || selectedSectionDropdown}" to the document.`,
      });
    }
  };

  const handleRemoveSection = (key: string) => {
    setEnabledSections((prev) => prev.filter((k) => k !== key));
  };

  const handleSaveOrSubmit = async (saveAsDraft: boolean) => {
    setToast(null);
    if (!eventName.trim()) {
      setToast({ type: "error", text: "Please enter the Event Name." });
      return;
    }
    if (!background.trim()) {
      setToast({ type: "error", text: "Please provide the Event Background narrative." });
      return;
    }

    setSaving(true);
    try {
      const snapshot = buildLiveProposalSnapshot();
      const res = await dispatchGateway(GATEWAY_OPCODES.SAVE_EVENT_PROPOSAL, {
        ...snapshot,
        proposalId: editingId || undefined,
        saveAsDraft,
      });

      if (!res.ok) {
        setToast({
          type: "error",
          text: res.message || "Failed to save event proposal.",
        });
        return;
      }

      setToast({
        type: "success",
        text: saveAsDraft
          ? "Event proposal saved as Draft."
          : "Event proposal submitted to Dean KSAC for departmental review & email dispatch!",
      });
      await fetchProposals();
      setViewMode("list");
    } catch (err: any) {
      setToast({ type: "error", text: err?.message || "Unexpected error saving proposal." });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadSignedCopy = async (proposalId: string, file: File) => {
    setToast(null);
    if (file.size > 5 * 1024 * 1024) {
      setToast({
        type: "error",
        text: "File exceeds 5 MB limit. Please upload a compressed PDF or image scan.",
      });
      return;
    }

    setUploadingId(proposalId);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(file);
      });

      const res = await dispatchGateway(GATEWAY_OPCODES.UPLOAD_SIGNED_SOFTCOPY, {
        proposalId,
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        dataUrl,
      });

      if (!res.ok) {
        setToast({ type: "error", text: res.message || "Failed to upload signed softcopy." });
        return;
      }

      setToast({
        type: "success",
        text: "Signed hardcopy scan submitted to Dean KSAC's digital archive!",
      });
      await fetchProposals();
    } catch (err: any) {
      setToast({ type: "error", text: err?.message || "Upload failed." });
    } finally {
      setUploadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-slate-100 text-slate-700 border-slate-200 ring-1 ring-slate-200";
      case "SUBMITTED":
        return "bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-300/40";
      case "REVISION_REQUESTED":
        return "bg-orange-50 text-orange-800 border-orange-200 ring-1 ring-orange-300/40";
      case "APPROVED":
        return "bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-300/40";
      case "SIGNED_SOFTCOPY_SUBMITTED":
        return "bg-sky-50 text-sky-800 border-sky-200 ring-1 ring-sky-300/40";
      case "COMPLETED":
        return "bg-purple-50 text-purple-800 border-purple-200 ring-1 ring-purple-300/40";
      case "REJECTED":
        return "bg-rose-50 text-rose-800 border-rose-200 ring-1 ring-rose-300/40";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "📝 Draft";
      case "SUBMITTED":
        return "⏳ Pending Dean Review";
      case "REVISION_REQUESTED":
        return "↩️ Revision Requested";
      case "APPROVED":
        return "✅ Approved by Dean KSAC";
      case "SIGNED_SOFTCOPY_SUBMITTED":
        return "📎 Signed Scan Uploaded";
      case "COMPLETED":
        return "🏆 Formally Completed";
      case "REJECTED":
        return "❌ Rejected";
      default:
        return status.replace(/_/g, " ");
    }
  };

  // KPI Counts
  const pendingCount = proposals.filter((p) => p.status === "SUBMITTED").length;
  const approvedCount = proposals.filter((p) => p.status === "APPROVED").length;
  const softcopyCount = proposals.filter(
    (p) => p.status === "SIGNED_SOFTCOPY_SUBMITTED" || p.status === "COMPLETED"
  ).length;
  const revisionCount = proposals.filter((p) => p.status === "REVISION_REQUESTED").length;

  // Filtered Proposals
  const filteredProposals = proposals.filter((p) => {
    const matchesStatus = statusFilter === "ALL" ? true : p.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesStatus;
    const matchesSearch =
      (p.eventName || "").toLowerCase().includes(q) ||
      (p.society || "").toLowerCase().includes(q) ||
      (p.venueCampus || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. LUMINOUS HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-800">
                🎓 Society Leadership Portal &bull; Presidents &amp; VPs
              </span>
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                Official Event Proposal &amp; Notesheet System
              </span>
            </div>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Event Approval &amp; Notesheet Builder
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              1. Build modular proposal &amp; requirements &rarr; 2. Dean KSAC review &amp; department mail dispatch &rarr; 3. Print formal A4 Notesheet for physical signatures &rarr; 4. Upload signed softcopy scan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("rough")}
              className={`rounded-2xl border px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                viewMode === "rough"
                  ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              ⚡ Pre-Proposal Rough Requests ({roughRequests.length})
            </button>
            {viewMode !== "list" && (
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 shadow-xs cursor-pointer"
              >
                &larr; All Proposals ({proposals.length})
              </button>
            )}
            {viewMode === "builder" && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProposal(buildLiveProposalSnapshot());
                  setViewMode("preview");
                }}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>📄</span> Live Document Preview
              </button>
            )}
            {viewMode === "list" && (
              <button
                type="button"
                onClick={() => {
                  handleResetBuilder();
                  setViewMode("builder");
                }}
                className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span> Initiate New Event Proposal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div
          role="alert"
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-xs font-bold shadow-xs transition-all ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
            <span>{toast.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-4 text-slate-400 hover:text-slate-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ==================== VIEW: PRE-PROPOSAL ROUGH REQUESTS ==================== */}
      {viewMode === "rough" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black uppercase">
                  ⚡ Pre-Proposal Quick Intake
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  Submit Rough Event Idea Before Formal Filing
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Before investing time in drafting a 5-page formal proposal and detailed line-item budget, submit your preliminary concept with rough dates and budget. The Faculty In-Charge (FIC) or Dean KSAC will review and mark it as <strong>Approved</strong>, <strong>Disapproved</strong>, or <strong>Waiting</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewMode("builder")}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
              >
                + Go Directly to Proposal Builder
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveRoughRequest} className="mt-6 space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Event Title / Working Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KRONOS 2026 - Hack & Build"
                    value={roughForm.eventName}
                    onChange={(e) => setRoughForm({ ...roughForm, eventName: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tentative Event Date(s) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24th - 25th October 2026"
                    value={roughForm.eventDate}
                    onChange={(e) => setRoughForm({ ...roughForm, eventDate: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rough Estimated Budget (INR ₹) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 150000"
                    value={roughForm.estimatedBudget}
                    onChange={(e) => setRoughForm({ ...roughForm, estimatedBudget: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Society under KSAC
                  </label>
                  <select
                    value={society}
                    onChange={(e) => setSociety(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800"
                  >
                    {authorizedSocieties.map((s, idx) => (
                      <option key={idx} value={s.society}>
                        {s.society} ({s.position})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Brief Concept &amp; Target Participants
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline the core objective, expected footfall, and major speakers or sub-tracks..."
                  value={roughForm.description}
                  onChange={(e) => setRoughForm({ ...roughForm, description: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingRough}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingRough ? "Submitting..." : "⚡ Submit Rough Request for FIC / Dean Review"}
                </button>
              </div>
            </form>
          </div>

          {/* Rough Requests List Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
            <h4 className="text-base font-black text-slate-900">
              Submitted Rough Requests &amp; Review Status
            </h4>

            {roughRequests.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold text-xs">
                No rough pre-requests submitted yet. Fill the quick form above to get preliminary clearance!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-black">
                      <th className="p-3">Event Working Title</th>
                      <th className="p-3">Society</th>
                      <th className="p-3">Tentative Dates</th>
                      <th className="p-3">Rough Budget</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Review Remarks</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {roughRequests.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-bold text-slate-900">{r.eventName}</td>
                        <td className="p-3">{r.society}</td>
                        <td className="p-3">{r.eventDate}</td>
                        <td className="p-3 font-mono font-bold text-emerald-700">
                          Rs. {formatIndianCurrency(r.estimatedBudget || 0)}/-
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-md font-bold text-[10px] ${
                              r.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : r.status === "DISAPPROVED"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {r.status === "APPROVED"
                              ? "✓ Approved"
                              : r.status === "DISAPPROVED"
                              ? "✗ Disapproved"
                              : "⏳ Waiting Review"}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs">
                          {r.reviewRemarks || <span className="text-slate-400 italic">No notes yet</span>}
                          {r.reviewerName && (
                            <div className="text-[10px] text-slate-400 font-semibold">
                              Reviewed by: {r.reviewerName} ({r.reviewerRole?.toUpperCase()})
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {r.status === "APPROVED" ? (
                            <button
                              type="button"
                              onClick={() => handleCreateFromRough(r)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-xs transition active:scale-95 cursor-pointer"
                            >
                              Create Full Proposal &rarr;
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Awaiting clearance</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== VIEW 1: PROPOSALS LIST ==================== */}
      {viewMode === "list" && (
        <div className="space-y-5">
          {/* Executive KPI Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${
                statusFilter === "ALL"
                  ? "border-emerald-500 bg-emerald-50/50 shadow-xs"
                  : "border-slate-200/80 bg-white shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Proposals
                </span>
                <span className="text-base">📋</span>
              </div>
              <div className="mt-1.5 text-2xl font-black text-slate-900">{proposals.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Your society event submissions</div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("SUBMITTED")}
              className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${
                statusFilter === "SUBMITTED"
                  ? "border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-400"
                  : "border-amber-200/90 bg-amber-50/40 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Awaiting Dean
                </span>
                <span className="text-base">⏳</span>
              </div>
              <div className="mt-1.5 text-2xl font-black text-amber-700">{pendingCount}</div>
              <div className="text-[11px] text-amber-700/80 mt-0.5">Under Dean KSAC review</div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("APPROVED")}
              className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${
                statusFilter === "APPROVED"
                  ? "border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-400"
                  : "border-emerald-200/90 bg-emerald-50/30 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Approved &amp; Unlocked
                </span>
                <span className="text-base">✅</span>
              </div>
              <div className="mt-1.5 text-2xl font-black text-emerald-700">{approvedCount}</div>
              <div className="text-[11px] text-emerald-700/80 mt-0.5">Ready for A4 formal printout</div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("SIGNED_SOFTCOPY_SUBMITTED")}
              className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${
                statusFilter === "SIGNED_SOFTCOPY_SUBMITTED"
                  ? "border-sky-500 bg-sky-50/70 shadow-xs ring-1 ring-sky-400"
                  : "border-sky-200/90 bg-sky-50/30 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
                  Signed &amp; Archived
                </span>
                <span className="text-base">📎</span>
              </div>
              <div className="mt-1.5 text-2xl font-black text-sky-700">{softcopyCount}</div>
              <div className="text-[11px] text-sky-700/80 mt-0.5">Hardcopy scans uploaded</div>
            </button>
          </div>

          {/* Filter Bar & Search Input */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ALL", label: `All (${proposals.length})` },
                { id: "SUBMITTED", label: `⏳ Under Review (${pendingCount})` },
                { id: "APPROVED", label: `✅ Approved (${approvedCount})` },
                { id: "SIGNED_SOFTCOPY_SUBMITTED", label: `📎 Signed Scans (${softcopyCount})` },
                { id: "REVISION_REQUESTED", label: `↩️ Revision (${revisionCount})` },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    statusFilter === st.id
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search event name or campus..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
                />
              ))}
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 text-2xl">
                📋
              </div>
              <h3 className="text-base font-black text-slate-900">No Event Proposals Found</h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                Start a new Event Approval &amp; Requirement form using the builder. Once approved by Dean KSAC, you can print the official Notesheet &amp; Proposal for physical signatures.
              </p>
              <button
                type="button"
                onClick={() => {
                  handleResetBuilder();
                  setViewMode("builder");
                }}
                className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
              >
                + Initiate First Event Proposal
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProposals.map((p) => {
                const isPrintUnlocked =
                  p.status === "APPROVED" ||
                  p.status === "SIGNED_SOFTCOPY_SUBMITTED" ||
                  p.status === "COMPLETED";
                const sentMailsCount = (p.departmentMails || []).filter(
                  (m: any) => m.status === "SENT"
                ).length;
                const totalMailsCount = (p.departmentMails || []).length;

                return (
                  <div
                    key={p._id}
                    className={`rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md ${
                      p.status === "SUBMITTED"
                        ? "border-amber-300 ring-1 ring-amber-300/40"
                        : p.status === "APPROVED"
                        ? "border-emerald-300 ring-1 ring-emerald-300/40"
                        : "border-slate-200/90 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getStatusBadge(
                              p.status
                            )}`}
                          >
                            {getStatusLabel(p.status)}
                          </span>
                          <span className="rounded-md bg-slate-900 px-2.5 py-0.5 text-xs font-black text-white">
                            {p.society}
                          </span>
                          <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {p.eventMode || "OFFLINE"}
                          </span>
                          <span className="text-xs text-slate-500">
                            📅 <strong className="text-slate-800">{p.dateDisplay || p.startDate}</strong> &bull; 📍 {p.venueCampus}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-slate-900 tracking-tight">
                          {p.eventName}
                          {p.tagline ? (
                            <span className="ml-2 text-xs font-medium text-slate-500">
                              — {p.tagline}
                            </span>
                          ) : null}
                        </h3>

                        <p className="line-clamp-2 text-xs text-slate-600 leading-relaxed">
                          {p.background}
                        </p>
                      </div>

                      {/* Right Budget Summary Block */}
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-right sm:min-w-[190px] shrink-0">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {isPrintUnlocked ? "Approved Budget" : "Proposed Budget"}
                        </div>
                        <div className="text-lg font-black text-emerald-700">
                          Rs. {formatIndianCurrency(p.budgetTotal || 0)}/-
                        </div>
                        <div className="mt-1 text-[11px] font-bold text-slate-600">
                          Dept Mails: <span className="text-emerald-700">{sentMailsCount}</span>/{totalMailsCount} Sent
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Progress Roadmap Stepper */}
                    <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-[11px]">
                      <div className={`flex items-center gap-1.5 font-bold ${p.status === "DRAFT" ? "text-slate-500" : "text-emerald-700"}`}>
                        <span>{p.status === "DRAFT" ? "1. Draft Form" : "✓ 1. Proposal Submitted"}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-bold ${isPrintUnlocked ? "text-emerald-700" : p.status === "SUBMITTED" ? "text-amber-700" : "text-slate-400"}`}>
                        <span>{isPrintUnlocked ? "✓ 2. Dean Approved" : "2. Dean Review"}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-bold ${isPrintUnlocked ? "text-emerald-700" : "text-slate-400"}`}>
                        <span>{p.signedSoftcopy?.dataUrl ? "✓ 3. Printed & Signed" : "3. Print & Sign"}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-bold ${p.signedSoftcopy?.verifiedByDean ? "text-purple-700" : p.signedSoftcopy?.dataUrl ? "text-sky-700" : "text-slate-400"}`}>
                        <span>{p.signedSoftcopy?.verifiedByDean ? "✓ 4. Verified Archive" : "4. Upload Softcopy"}</span>
                      </div>
                    </div>

                    {p.deanNote && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs text-amber-900">
                        <strong>Dean KSAC Note:</strong> {p.deanNote}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProposal(p);
                            setViewMode("preview");
                          }}
                          className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                            isPrintUnlocked
                              ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
                              : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span>{isPrintUnlocked ? "🖨️" : "👁️"}</span>
                          <span>
                            {isPrintUnlocked
                              ? "View & Print Official Notesheet (A4)"
                              : "Preview Formal Document"}
                          </span>
                        </button>

                        {(p.status === "DRAFT" ||
                          p.status === "SUBMITTED" ||
                          p.status === "REVISION_REQUESTED") && (
                          <button
                            type="button"
                            onClick={() => handleEditProposal(p)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5"
                          >
                            <span>✏️</span> Edit Form &amp; Sections
                          </button>
                        )}
                      </div>

                      {/* Step 4: Upload Signed Hardcopy Scan (Softcopy) */}
                      {isPrintUnlocked && (
                        <div className="flex flex-wrap items-center gap-2">
                          {p.signedSoftcopy?.dataUrl && (
                            <a
                              href={p.signedSoftcopy.dataUrl}
                              download={p.signedSoftcopy.fileName || `${p.eventName}_Signed.pdf`}
                              className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-100 transition flex items-center gap-1"
                            >
                              <span>📎</span>
                              <span>
                                {p.signedSoftcopy.verifiedByDean ? "Verified Softcopy" : "Uploaded Signed Copy"}
                              </span>
                            </a>
                          )}
                          <label className="cursor-pointer rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 shadow-xs">
                            {uploadingId === p._id
                              ? "Uploading Scan..."
                              : p.signedSoftcopy?.dataUrl
                              ? "📤 Replace Signed Softcopy Scan"
                              : "📤 Upload Signed Hardcopy Scan (PDF/Image)"}
                            <input
                              type="file"
                              accept=".pdf,image/png,image/jpeg,image/webp"
                              className="hidden"
                              disabled={uploadingId === p._id}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadSignedCopy(p._id, file);
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== VIEW 2: FORM BUILDER ==================== */}
      {viewMode === "builder" && (
        <div className="space-y-6">
          {/* LEVEL 1 DROPDOWN: ADD / MANAGE DOCUMENT SECTIONS */}
          <div className="rounded-3xl border border-emerald-200/90 bg-white p-5 shadow-xs">
            <label
              htmlFor="section-module-dropdown"
              className="block text-xs font-black uppercase tracking-wider text-emerald-800"
            >
              Step 1: Select &amp; Toggle Document Modules (Dropdown Builder)
            </label>
            <p className="mt-0.5 text-xs text-slate-500">
              Choose which sections and departmental requirement tables belong in your event document.
            </p>

            <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
              <select
                id="section-module-dropdown"
                aria-label="Select Document Section to Add"
                value={selectedSectionDropdown}
                onChange={(e) => setSelectedSectionDropdown(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              >
                {SECTION_MODULES.map((mod) => (
                  <option key={mod.key} value={mod.key}>
                    {enabledSections.includes(mod.key) ? "✓ [Active] " : "+ [Add] "}
                    {mod.label} — {mod.description}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddSectionFromDropdown}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                + Add Selected Section
              </button>
            </div>

            {/* Active Section Pills */}
            <div className="mt-3 flex flex-wrap gap-2">
              {SECTION_MODULES.map((mod) => {
                const active = enabledSections.includes(mod.key);
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() =>
                      active
                        ? handleRemoveSection(mod.key)
                        : setEnabledSections((prev) => [...prev, mod.key])
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${
                      active
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <span>{active ? "✓" : "+"}</span>
                    <span>{mod.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CORE SECTION: NOTESHEET & EVENT OVERVIEW */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Core Section — Formal Notesheet &amp; Event Details (Mandatory)
            </h3>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Society</label>
                <select
                  aria-label="Society"
                  value={society}
                  onChange={(e) => {
                    setSociety(e.target.value);
                    setSocietyFullName(`${e.target.value} Society`);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                >
                  {authorizedSocieties.length > 0 ? (
                    authorizedSocieties.map((s, i) => (
                      <option key={i} value={s.society}>
                        {s.society} ({s.position})
                      </option>
                    ))
                  ) : (
                    <option value={society}>{society}</option>
                  )}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Full Society Name on Document Header
                </label>
                <input
                  type="text"
                  value={societyFullName}
                  onChange={(e) => setSocietyFullName(e.target.value)}
                  placeholder="e.g. Federation of Entrepreneurship Development (FED)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. OMEGA 6.0 / Codex 2.0 / KATADIGM 1.0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Event Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Think. Build. Pitch."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Event Mode</label>
                <select
                  aria-label="Event Mode"
                  value={eventMode}
                  onChange={(e) => setEventMode(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                >
                  <option value="OFFLINE">OFFLINE (On-Campus)</option>
                  <option value="ONLINE">ONLINE (Virtual)</option>
                  <option value="HYBRID">HYBRID</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Formatted Date Label on Printout
                </label>
                <input
                  type="text"
                  value={dateDisplay}
                  onChange={(e) => setDateDisplay(e.target.value)}
                  placeholder="e.g. 22nd - 23rd August 2026"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Primary Campus / Venue
                </label>
                <select
                  aria-label="Primary Campus"
                  value={
                    SMART_ITEM_PRESETS.CAMPUS.includes(venueCampus)
                      ? venueCampus
                      : "Custom Campus..."
                  }
                  onChange={(e) => {
                    if (e.target.value !== "Custom Campus...") setVenueCampus(e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                >
                  {SMART_ITEM_PRESETS.CAMPUS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Organising Committee (OC) Size
                </label>
                <input
                  type="number"
                  min={1}
                  value={ocHeadcount}
                  onChange={(e) => setOcHeadcount(parseInt(e.target.value, 10) || 30)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Notesheet Addressed To
                </label>
                <select
                  aria-label="Notesheet Recipient"
                  value={notesheetRecipient}
                  onChange={(e) => setNotesheetRecipient(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                >
                  <option value={"The Pro-Vice Chancellor (Admin)-cum-Registrar\nKIIT-DU"}>
                    The Pro-Vice Chancellor (Admin)-cum-Registrar, KIIT-DU
                  </option>
                  <option value={"The Registrar\nKIITDU"}>The Registrar, KIITDU</option>
                  <option value={"The Deputy Director, KSAC\nKIIT-DU"}>
                    The Deputy Director, KSAC, KIIT-DU
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                1. Event Background (Detailed Narrative) *
              </label>
              <textarea
                rows={4}
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="Describe the background, theme, and significance of the event (as printed in Section 1 of the KSAC proposal)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>

            {/* 2. Objectives List */}
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                2. Event Objectives (Bullet Points)
              </label>
              <div className="space-y-2">
                {objectives.map((obj, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">&bull;</span>
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => {
                        const updated = [...objectives];
                        updated[idx] = e.target.value;
                        setObjectives(updated);
                      }}
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setObjectives(objectives.filter((_, i) => i !== idx))}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Add another objective bullet point..."
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newObjective.trim()) {
                        setObjectives([...objectives, newObjective.trim()]);
                        setNewObjective("");
                      }
                    }}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    + Add Bullet
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* MODULE: SUB_EVENTS (EVENT FORMAT & SCHEDULE) */}
          {enabledSections.includes("SUB_EVENTS") && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Module: Event Format / Sub-Events &amp; Schedule
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setSubEvents([
                      ...subEvents,
                      {
                        name: "",
                        dayLabel: `Day ${subEvents.length + 1}`,
                        date: "",
                        timings: "09:00 AM - 05:00 PM",
                        description: "",
                      },
                    ])
                  }
                  className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                >
                  + Add Sub-Event / Round
                </button>
              </div>
              <input
                type="text"
                value={eventFormatSummary}
                onChange={(e) => setEventFormatSummary(e.target.value)}
                placeholder="Optional format overview (e.g. Quiz -> Hack -> Pitch -> Final (4 Stages))"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
              {subEvents.map((se, idx) => (
                <div
                  key={idx}
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-4"
                >
                  <input
                    type="text"
                    value={se.name}
                    onChange={(e) => {
                      const next = [...subEvents];
                      next[idx].name = e.target.value;
                      setSubEvents(next);
                    }}
                    placeholder="Sub-Event / Round Name (e.g. HACQUIRE)"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 sm:col-span-2"
                  />
                  <input
                    type="text"
                    value={se.dayLabel}
                    onChange={(e) => {
                      const next = [...subEvents];
                      next[idx].dayLabel = e.target.value;
                      setSubEvents(next);
                    }}
                    placeholder="Day 1 / 22 August 2026"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={se.timings}
                      onChange={(e) => {
                        const next = [...subEvents];
                        next[idx].timings = e.target.value;
                        setSubEvents(next);
                      }}
                      placeholder="8 AM to 6 PM"
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setSubEvents(subEvents.filter((_, i) => i !== idx))}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 transition"
                    >
                      ✕
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={se.description}
                    onChange={(e) => {
                      const next = [...subEvents];
                      next[idx].description = e.target.value;
                      setSubEvents(next);
                    }}
                    placeholder="Describe this sub-event or round..."
                    className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 focus:border-emerald-500 sm:col-span-4"
                  />
                </div>
              ))}
            </div>
          )}

          {/* MODULE: GUIDELINES */}
          {enabledSections.includes("GUIDELINES") && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-3 shadow-xs">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Module: Target Audience &amp; Participation Guidelines
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Target Participants</label>
                  <input
                    type="text"
                    value={guidelines.participantsYear}
                    onChange={(e) =>
                      setGuidelines({ ...guidelines, participantsYear: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Eligibility</label>
                  <input
                    type="text"
                    value={guidelines.eligibility}
                    onChange={(e) => setGuidelines({ ...guidelines, eligibility: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Team Size / Formation</label>
                  <input
                    type="text"
                    value={guidelines.teamSize}
                    onChange={(e) => setGuidelines({ ...guidelines, teamSize: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Advancement / Selection</label>
                  <input
                    type="text"
                    value={guidelines.advancementRules}
                    onChange={(e) =>
                      setGuidelines({ ...guidelines, advancementRules: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MODULE: VENUE REQUIREMENTS (Maps to VENUE Department Mail) */}
          {enabledSections.includes("VENUE") && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center">
                    A. Venue Requirements{" "}
                    <span className="ml-2.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                      Maps to Estate &amp; Venue Dept Mail
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Specify halls, auditoriums, or open grounds required for each day of the event.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setVenueRequirements([
                      ...venueRequirements,
                      {
                        date: dateDisplay || startDate,
                        campus: venueCampus || "Campus 25",
                        timings: "09:00 AM - 05:00 PM",
                        venueType: "Lecture Hall",
                        quantity: 1,
                        details: "",
                        departmentCategory: "VENUE",
                      },
                    ])
                  }
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
                >
                  + Add Venue Row
                </button>
              </div>

              <div className="space-y-2.5">
                {venueRequirements.map((v, idx) => (
                  <div
                    key={idx}
                    className="grid gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:grid-cols-6 items-center"
                  >
                    <select
                      aria-label="Venue Type Preset"
                      value={
                        SMART_ITEM_PRESETS.VENUE.includes(v.venueType)
                          ? v.venueType
                          : "Custom Venue..."
                      }
                      onChange={(e) => {
                        const next = [...venueRequirements];
                        if (e.target.value !== "Custom Venue...") {
                          next[idx].venueType = e.target.value;
                        } else {
                          next[idx].venueType = "";
                        }
                        setVenueRequirements(next);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition"
                    >
                      {SMART_ITEM_PRESETS.VENUE.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={v.venueType}
                      onChange={(e) => {
                        const next = [...venueRequirements];
                        next[idx].venueType = e.target.value;
                        setVenueRequirements(next);
                      }}
                      placeholder="Venue (e.g. Lecture Hall)"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition"
                    />
                    <input
                      type="text"
                      value={v.campus}
                      onChange={(e) => {
                        const next = [...venueRequirements];
                        next[idx].campus = e.target.value;
                        setVenueRequirements(next);
                      }}
                      placeholder="Campus (e.g. Campus 25)"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition"
                    />
                    <input
                      type="text"
                      value={v.date}
                      onChange={(e) => {
                        const next = [...venueRequirements];
                        next[idx].date = e.target.value;
                        setVenueRequirements(next);
                      }}
                      placeholder="Date (e.g. 20th Sept 2026)"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition"
                    />
                    <input
                      type="text"
                      value={v.timings}
                      onChange={(e) => {
                        const next = [...venueRequirements];
                        next[idx].timings = e.target.value;
                        setVenueRequirements(next);
                      }}
                      placeholder="Timings (e.g. 8:30 AM - 7:30 PM)"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={v.quantity}
                        onChange={(e) => {
                          const next = [...venueRequirements];
                          next[idx].quantity = parseInt(e.target.value, 10) || 1;
                          setVenueRequirements(next);
                        }}
                        placeholder="Qty"
                        className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition"
                      />
                      <input
                        type="text"
                        value={v.details}
                        onChange={(e) => {
                          const next = [...venueRequirements];
                          next[idx].details = e.target.value;
                          setVenueRequirements(next);
                        }}
                        placeholder="Details / Requirements"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setVenueRequirements(venueRequirements.filter((_, i) => i !== idx))
                        }
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE: TECHNICAL REQUIREMENTS (Maps to TECHNICAL Department Mail) */}
          {enabledSections.includes("TECHNICAL") && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center">
                    B. Technical, Sound &amp; Electrical Requirements{" "}
                    <span className="ml-2.5 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-800">
                      Maps to Technical &amp; Sound/AV Dept Mail
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Request microphones, projectors, PA sound systems, and electricity points.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setTechnicalRequirements([
                      ...technicalRequirements,
                      {
                        date: dateDisplay || startDate,
                        timings: "09:00 AM - 05:00 PM",
                        venue: venueCampus,
                        item: "Podium Microphone",
                        quantity: "2",
                        details: "",
                        departmentCategory: "TECHNICAL",
                      },
                    ])
                  }
                  className="rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-xs font-bold text-cyan-800 hover:bg-cyan-100 transition shadow-xs"
                >
                  + Add Technical Row
                </button>
              </div>

              <div className="space-y-2.5">
                {technicalRequirements.map((t, idx) => (
                  <div
                    key={idx}
                    className="grid gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:grid-cols-6 items-center"
                  >
                    <select
                      aria-label="Technical Item Preset"
                      value={
                        SMART_ITEM_PRESETS.TECHNICAL.includes(t.item)
                          ? t.item
                          : "Custom Technical Item..."
                      }
                      onChange={(e) => {
                        const next = [...technicalRequirements];
                        if (e.target.value !== "Custom Technical Item...") {
                          next[idx].item = e.target.value;
                        } else {
                          next[idx].item = "";
                        }
                        setTechnicalRequirements(next);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 transition"
                    >
                      {SMART_ITEM_PRESETS.TECHNICAL.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={t.item}
                      onChange={(e) => {
                        const next = [...technicalRequirements];
                        next[idx].item = e.target.value;
                        setTechnicalRequirements(next);
                      }}
                      placeholder="Item name"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 transition"
                    />
                    <input
                      type="text"
                      value={t.quantity}
                      onChange={(e) => {
                        const next = [...technicalRequirements];
                        next[idx].quantity = e.target.value;
                        setTechnicalRequirements(next);
                      }}
                      placeholder="Qty (e.g. 2)"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 transition"
                    />
                    <input
                      type="text"
                      value={t.date}
                      onChange={(e) => {
                        const next = [...technicalRequirements];
                        next[idx].date = e.target.value;
                        setTechnicalRequirements(next);
                      }}
                      placeholder="Dates"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 transition"
                    />
                    <input
                      type="text"
                      value={t.venue}
                      onChange={(e) => {
                        const next = [...technicalRequirements];
                        next[idx].venue = e.target.value;
                        setTechnicalRequirements(next);
                      }}
                      placeholder="Venue / Campus"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 transition"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={t.details}
                        onChange={(e) => {
                          const next = [...technicalRequirements];
                          next[idx].details = e.target.value;
                          setTechnicalRequirements(next);
                        }}
                        placeholder="Details"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 transition"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setTechnicalRequirements(technicalRequirements.filter((_, i) => i !== idx))
                        }
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE: FOOD & ACCOMMODATION REQUIREMENTS */}
          {enabledSections.includes("FOOD") && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center">
                    C. Accommodation &amp; Food Requirements{" "}
                    <span className="ml-2.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      Maps to Hospitality &amp; Catering Dept Mail
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Food packets, water bottles, and guest accommodation requirements.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFoodRequirements([
                      ...foodRequirements,
                      {
                        date: dateDisplay || startDate,
                        item: "Water Bottles (Participants & Volunteers)",
                        quantity: "100",
                        details: "",
                        departmentCategory: "FOOD",
                      },
                    ])
                  }
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-xs"
                >
                  + Add Food / Hospitality Row
                </button>
              </div>

              <div className="space-y-2.5">
                {foodRequirements.map((f, idx) => (
                  <div
                    key={idx}
                    className="grid gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:grid-cols-5 items-center"
                  >
                    <select
                      aria-label="Food Item Preset"
                      value={
                        SMART_ITEM_PRESETS.FOOD.includes(f.item)
                          ? f.item
                          : "Custom Food / Hospitality Item..."
                      }
                      onChange={(e) => {
                        const next = [...foodRequirements];
                        if (e.target.value !== "Custom Food / Hospitality Item...") {
                          next[idx].item = e.target.value;
                        } else {
                          next[idx].item = "";
                        }
                        setFoodRequirements(next);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 transition"
                    >
                      {SMART_ITEM_PRESETS.FOOD.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={f.item}
                      onChange={(e) => {
                        const next = [...foodRequirements];
                        next[idx].item = e.target.value;
                        setFoodRequirements(next);
                      }}
                      placeholder="Requirement Item"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 transition"
                    />
                    <input
                      type="text"
                      value={f.quantity}
                      onChange={(e) => {
                        const next = [...foodRequirements];
                        next[idx].quantity = e.target.value;
                        setFoodRequirements(next);
                      }}
                      placeholder="Qty (e.g. 250)"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 transition"
                    />
                    <input
                      type="text"
                      value={f.date}
                      onChange={(e) => {
                        const next = [...foodRequirements];
                        next[idx].date = e.target.value;
                        setFoodRequirements(next);
                      }}
                      placeholder="Dates"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 transition"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={f.details}
                        onChange={(e) => {
                          const next = [...foodRequirements];
                          next[idx].details = e.target.value;
                          setFoodRequirements(next);
                        }}
                        placeholder="Details"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 transition"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFoodRequirements(foodRequirements.filter((_, i) => i !== idx))
                        }
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE: MARKETING & LOGISTICS REQUIREMENTS */}
          {enabledSections.includes("MARKETING") && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center">
                    D. Marketing, Promotion &amp; Logistics Requirements{" "}
                    <span className="ml-2.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[10px] font-semibold text-purple-800">
                      Maps to Publicity &amp; Registrar Dept Mail
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standees, posters, desk marketing setup, social media blasts, and vehicle entry permissions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setMarketingRequirements([
                      ...marketingRequirements,
                      {
                        startDate,
                        endDate,
                        item: "Desk Marketing (Tables & Chairs at Campuses)",
                        campus: "Campus 3, 6, 25",
                        details: "",
                        departmentCategory: "MARKETING",
                      },
                    ])
                  }
                  className="rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-100 transition shadow-xs"
                >
                  + Add Marketing Row
                </button>
              </div>

              <div className="space-y-2.5">
                {marketingRequirements.map((m, idx) => (
                  <div
                    key={idx}
                    className="grid gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:grid-cols-5 items-center"
                  >
                    <select
                      aria-label="Marketing Item Preset"
                      value={
                        SMART_ITEM_PRESETS.MARKETING.includes(m.item)
                          ? m.item
                          : "Custom Marketing / Logistics Item..."
                      }
                      onChange={(e) => {
                        const next = [...marketingRequirements];
                        if (e.target.value !== "Custom Marketing / Logistics Item...") {
                          next[idx].item = e.target.value;
                        } else {
                          next[idx].item = "";
                        }
                        setMarketingRequirements(next);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition"
                    >
                      {SMART_ITEM_PRESETS.MARKETING.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={m.item}
                      onChange={(e) => {
                        const next = [...marketingRequirements];
                        next[idx].item = e.target.value;
                        setMarketingRequirements(next);
                      }}
                      placeholder="Item / Requirement"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition"
                    />
                    <input
                      type="text"
                      value={m.campus}
                      onChange={(e) => {
                        const next = [...marketingRequirements];
                        next[idx].campus = e.target.value;
                        setMarketingRequirements(next);
                      }}
                      placeholder="Campuses (e.g. Campus 3, 6, 25)"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition"
                    />
                    <input
                      type="text"
                      value={m.startDate}
                      onChange={(e) => {
                        const next = [...marketingRequirements];
                        next[idx].startDate = e.target.value;
                        setMarketingRequirements(next);
                      }}
                      placeholder="Date / Interval (e.g. 03/08 - 20/08)"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={m.details}
                        onChange={(e) => {
                          const next = [...marketingRequirements];
                          next[idx].details = e.target.value;
                          setMarketingRequirements(next);
                        }}
                        placeholder="Purpose / Details"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 transition"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setMarketingRequirements(marketingRequirements.filter((_, i) => i !== idx))
                        }
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE: BUDGET BREAKDOWN TABLE */}
          {enabledSections.includes("BUDGET") && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center">
                    Module: Budget Breakdown Table{" "}
                    <span className="ml-2.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                      Auto-Calculates INR Words &amp; Finance Mail
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Total:{" "}
                    <strong className="text-emerald-700 font-bold">
                      Rs. {formatIndianCurrency(computedBudgetTotal)}/-
                    </strong>{" "}
                    ({computedBudgetWords})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setBudgetItems([
                      ...budgetItems,
                      {
                        slNo: budgetItems.length + 1,
                        particulars: "Standee (5ft x 2ft)",
                        quantity: "1",
                        unitPrice: "300",
                        totalCost: 300,
                        category: "FINANCE",
                      },
                    ])
                  }
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
                >
                  + Add Budget Item
                </button>
              </div>

              <div className="space-y-2.5">
                {budgetItems.map((b, idx) => (
                  <div
                    key={idx}
                    className="grid gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:grid-cols-6 items-center"
                  >
                    <select
                      aria-label="Budget Item Preset"
                      value={
                        SMART_ITEM_PRESETS.BUDGET.some((p) => p.label === b.particulars)
                          ? b.particulars
                          : "Custom Budget Item..."
                      }
                      onChange={(e) => {
                        const next = [...budgetItems];
                        const preset = SMART_ITEM_PRESETS.BUDGET.find(
                          (p) => p.label === e.target.value
                        );
                        if (preset && preset.label !== "Custom Budget Item...") {
                          next[idx].particulars = preset.label;
                          next[idx].unitPrice = preset.defaultPrice;
                          const q = parseFloat(String(next[idx].quantity).replace(/[^0-9.]/g, "")) || 1;
                          const u = parseFloat(preset.defaultPrice) || 0;
                          next[idx].totalCost = Math.round(q * u);
                        } else {
                          next[idx].particulars = "";
                        }
                        setBudgetItems(next);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition"
                    >
                      {SMART_ITEM_PRESETS.BUDGET.map((p) => (
                        <option key={p.label} value={p.label}>
                          {p.label} {p.defaultPrice ? `(Rs.${p.defaultPrice})` : ""}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={b.particulars}
                      onChange={(e) => {
                        const next = [...budgetItems];
                        next[idx].particulars = e.target.value;
                        setBudgetItems(next);
                      }}
                      placeholder="Particulars / Item Name"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition sm:col-span-2"
                    />
                    <input
                      type="text"
                      value={b.quantity}
                      onChange={(e) => {
                        const next = [...budgetItems];
                        next[idx].quantity = e.target.value;
                        const q = parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 1;
                        const u =
                          parseFloat(String(next[idx].unitPrice).replace(/[^0-9.]/g, "")) || 0;
                        next[idx].totalCost = Math.round(q * u);
                        setBudgetItems(next);
                      }}
                      placeholder="Qty (e.g. 25)"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition"
                    />
                    <input
                      type="text"
                      value={b.unitPrice}
                      onChange={(e) => {
                        const next = [...budgetItems];
                        next[idx].unitPrice = e.target.value;
                        const q =
                          parseFloat(String(next[idx].quantity).replace(/[^0-9.]/g, "")) || 1;
                        const u = parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0;
                        next[idx].totalCost = Math.round(q * u);
                        setBudgetItems(next);
                      }}
                      placeholder="Unit Price (INR)"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={b.totalCost}
                        onChange={(e) => {
                          const next = [...budgetItems];
                          next[idx].totalCost = parseInt(e.target.value, 10) || 0;
                          setBudgetItems(next);
                        }}
                        className="flex-1 rounded-lg border border-emerald-300 bg-emerald-50/70 px-2.5 py-1.5 text-xs font-bold text-emerald-800 focus:border-emerald-500 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setBudgetItems(budgetItems.filter((_, i) => i !== idx))}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE: REVENUE MODEL */}
          {enabledSections.includes("REVENUE") && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center">
                    Module: Revenue Model (Registration Fees &amp; Sponsorships)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Estimated external funds or participant entry tickets offsetting the event budget.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setRevenueItems([
                      ...revenueItems,
                      { slNo: revenueItems.length + 1, source: "Sponsorship", amountFormula: "50000", total: 50000 },
                    ])
                  }
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
                >
                  + Add Revenue Source
                </button>
              </div>
              <div className="space-y-2.5">
                {revenueItems.map((r, idx) => (
                  <div key={idx} className="grid gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:grid-cols-4 items-center">
                    <input
                      type="text"
                      value={r.source}
                      onChange={(e) => {
                        const next = [...revenueItems];
                        next[idx].source = e.target.value;
                        setRevenueItems(next);
                      }}
                      placeholder="Source (e.g. Participants Registration)"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 transition sm:col-span-2"
                    />
                    <input
                      type="text"
                      value={r.amountFormula}
                      onChange={(e) => {
                        const next = [...revenueItems];
                        next[idx].amountFormula = e.target.value;
                        setRevenueItems(next);
                      }}
                      placeholder="Formula (e.g. 200x1000)"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 transition"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={r.total}
                        onChange={(e) => {
                          const next = [...revenueItems];
                          next[idx].total = parseInt(e.target.value, 10) || 0;
                          setRevenueItems(next);
                        }}
                        placeholder="Total Rs."
                        className="flex-1 rounded-lg border border-emerald-300 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-800 focus:border-emerald-500 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setRevenueItems(revenueItems.filter((_, i) => i !== idx))}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                        title="Remove source"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE: SPEAKER / GUEST DETAILS */}
          {enabledSections.includes("SPEAKER") && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Module: Speaker / Guest Profile &amp; Fee Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Guest background and point-of-contact details for institutional hospitality &amp; honorarium coordination.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  value={speakerDetails.name}
                  onChange={(e) => setSpeakerDetails({ ...speakerDetails, name: e.target.value })}
                  placeholder="Speaker Name (e.g. Rajat Sood)"
                  className="rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 transition"
                />
                <input
                  type="text"
                  value={speakerDetails.title}
                  onChange={(e) => setSpeakerDetails({ ...speakerDetails, title: e.target.value })}
                  placeholder="Title / Credentials"
                  className="rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 transition"
                />
                <input
                  type="text"
                  value={speakerDetails.managerContact}
                  onChange={(e) =>
                    setSpeakerDetails({ ...speakerDetails, managerContact: e.target.value })
                  }
                  placeholder="Manager Contact Info"
                  className="rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 transition"
                />
              </div>
              <textarea
                rows={2}
                value={speakerDetails.bio}
                onChange={(e) => setSpeakerDetails({ ...speakerDetails, bio: e.target.value })}
                placeholder="Speaker biography & achievements..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white p-3 text-xs text-slate-900 focus:border-emerald-500 transition"
              />
            </div>
          )}

          {/* MANUAL SIGNATORY BLOCK BUILDER */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Physical Signatory Blocks on Printed Document
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add, remove, or customize the signature placeholders printed on the Notesheet (Page 1) and Proposal Footer.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSignatories([
                    ...signatories,
                    {
                      roleTitle: "Associate Dean, KSAC",
                      name: "",
                      designation: "Associate Dean, KSAC",
                      location: "FOOTER",
                    },
                  ])
                }
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
              >
                + Add Signatory Block
              </button>
            </div>

            <div className="space-y-2.5">
              {signatories.map((sig, idx) => (
                <div
                  key={idx}
                  className="grid gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:grid-cols-4 items-center"
                >
                  <input
                    type="text"
                    value={sig.name}
                    onChange={(e) => {
                      const next = [...signatories];
                      next[idx].name = e.target.value;
                      setSignatories(next);
                    }}
                    placeholder="Optional Name (e.g. Dr. Ajit Kumar Pasayat)"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 transition"
                  />
                  <input
                    type="text"
                    value={sig.designation}
                    onChange={(e) => {
                      const next = [...signatories];
                      next[idx].designation = e.target.value;
                      next[idx].roleTitle = e.target.value;
                      setSignatories(next);
                    }}
                    placeholder="Designation (e.g. FIC, FED KIIT / Registrar)"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 transition sm:col-span-2"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Signatory Placement"
                      value={sig.location}
                      onChange={(e) => {
                        const next = [...signatories];
                        next[idx].location = e.target.value;
                        setSignatories(next);
                      }}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 transition"
                    >
                      <option value="FOOTER">Proposal Footer</option>
                      <option value="NOTESHEET">Page 1 Notesheet</option>
                      <option value="BOTH">Both Pages</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setSignatories(signatories.filter((_, i) => i !== idx))}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                      title="Remove block"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ==================== MODULE: SECURITY & CROWD MANAGEMENT REQUIREMENTS ==================== */}
          {enabledSections.includes("SECURITY") && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>🛡️</span> Module: Campus Security &amp; Crowd Control Requisitions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Requisition security personnel, gate access checkpoints, barricading, and night surveillance directly with Campus Security.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSecurityRequirements([
                      ...securityRequirements,
                      {
                        date: dateDisplay || startDate,
                        timings: "09:00 AM - 09:00 PM",
                        campus: venueCampus,
                        securityType: "Campus Security Guards",
                        quantity: 2,
                        details: "Main gate access & crowd marshals",
                      },
                    ])
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  + Add Security Row
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400">Quick Presets:</span>
                {SMART_ITEM_PRESETS.SECURITY.slice(0, 5).map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setSecurityRequirements([
                        ...securityRequirements,
                        {
                          date: dateDisplay || startDate,
                          timings: "09:00 AM - 09:00 PM",
                          campus: venueCampus,
                          securityType: preset,
                          quantity: 2,
                          details: `Arrangement for ${eventName || "KSAC event"}`,
                        },
                      ])
                    }
                    className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              {securityRequirements.map((sec, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 rounded-2xl bg-slate-50/70 border border-slate-200">
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Requisition Type</label>
                    <input
                      type="text"
                      value={sec.securityType}
                      onChange={(e) => {
                        const copy = [...securityRequirements];
                        copy[idx].securityType = e.target.value;
                        setSecurityRequirements(copy);
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Campus / Gate</label>
                    <input
                      type="text"
                      value={sec.campus}
                      onChange={(e) => {
                        const copy = [...securityRequirements];
                        copy[idx].campus = e.target.value;
                        setSecurityRequirements(copy);
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Timings</label>
                    <input
                      type="text"
                      value={sec.timings}
                      onChange={(e) => {
                        const copy = [...securityRequirements];
                        copy[idx].timings = e.target.value;
                        setSecurityRequirements(copy);
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={sec.quantity}
                      onChange={(e) => {
                        const copy = [...securityRequirements];
                        copy[idx].quantity = Number(e.target.value) || 1;
                        setSecurityRequirements(copy);
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-center"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Details / Gate Protocol</label>
                    <input
                      type="text"
                      value={sec.details}
                      onChange={(e) => {
                        const copy = [...securityRequirements];
                        copy[idx].details = e.target.value;
                        setSecurityRequirements(copy);
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => setSecurityRequirements(securityRequirements.filter((_, i) => i !== idx))}
                      className="text-rose-600 hover:text-rose-800 font-black text-sm"
                      title="Remove row"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ==================== MODULE: DIGNITARY FELICITATION & PROTOCOL MATERIAL ==================== */}
          {enabledSections.includes("FELICITATION") && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>💐</span> Module: Dignitary Felicitation &amp; Hospitality Protocol Material
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sambalpuri handloom shawls, brass diya lamps, floral bouquets, and official mementos for guests.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFelicitationRequirements([
                      ...felicitationRequirements,
                      {
                        date: dateDisplay || startDate,
                        item: "Fresh Floral Bouquet / Flower Basket",
                        quantity: 2,
                        recipientDignitary: "Hon'ble Chief Guest",
                        details: "Fresh flower floral arrangement",
                      },
                    ])
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  + Add Material Row
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400">Quick Presets:</span>
                {SMART_ITEM_PRESETS.FELICITATION.slice(0, 5).map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setFelicitationRequirements([
                        ...felicitationRequirements,
                        {
                          date: dateDisplay || startDate,
                          item: preset,
                          quantity: 1,
                          recipientDignitary: "Chief Guest / Keynote Speaker",
                          details: "Arranged through KSAC protocol cell",
                        },
                      ])
                    }
                    className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              {felicitationRequirements.map((fel, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 rounded-2xl bg-slate-50/70 border border-slate-200">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Felicitation Item</label>
                    <input
                      type="text"
                      value={fel.item}
                      onChange={(e) => {
                        const copy = [...felicitationRequirements];
                        copy[idx].item = e.target.value;
                        setFelicitationRequirements(copy);
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={fel.quantity}
                      onChange={(e) => {
                        const copy = [...felicitationRequirements];
                        copy[idx].quantity = Number(e.target.value) || 1;
                        setFelicitationRequirements(copy);
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-center"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Recipient Dignitary</label>
                    <input
                      type="text"
                      value={fel.recipientDignitary}
                      onChange={(e) => {
                        const copy = [...felicitationRequirements];
                        copy[idx].recipientDignitary = e.target.value;
                        setFelicitationRequirements(copy);
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Specifications / Notes</label>
                    <input
                      type="text"
                      value={fel.details}
                      onChange={(e) => {
                        const copy = [...felicitationRequirements];
                        copy[idx].details = e.target.value;
                        setFelicitationRequirements(copy);
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => setFelicitationRequirements(felicitationRequirements.filter((_, i) => i !== idx))}
                      className="text-rose-600 hover:text-rose-800 font-black text-sm"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ==================== MODULE: SPONSORS & MEMORANDUM OF UNDERSTANDING (MoU) ==================== */}
          {enabledSections.includes("SPONSORS") && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>🤝</span> Module: Event Sponsors &amp; Memorandum of Understanding (MoU)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track corporate partners, title sponsors, cash/kind contributions, and attach signed MoU copies.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSponsors([
                      ...sponsors,
                      {
                        name: "",
                        tier: "Associate Sponsor",
                        contributionAmount: 25000,
                        mouFileName: "",
                        mouDataUrl: "",
                        mouMimeType: "application/pdf",
                        contactPerson: "",
                        contactEmail: "",
                      },
                    ])
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  + Add Sponsor Partner
                </button>
              </div>

              {sponsors.map((sp, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 uppercase">Sponsor #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setSponsors(sponsors.filter((_, i) => i !== idx))}
                      className="text-rose-600 hover:text-rose-800 font-bold text-xs"
                    >
                      Remove Sponsor
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Sponsor Company Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Red Bull / GitHub"
                        value={sp.name}
                        onChange={(e) => {
                          const copy = [...sponsors];
                          copy[idx].name = e.target.value;
                          setSponsors(copy);
                        }}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Partnership Tier</label>
                      <select
                        value={sp.tier}
                        onChange={(e) => {
                          const copy = [...sponsors];
                          copy[idx].tier = e.target.value;
                          setSponsors(copy);
                        }}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                      >
                        {SPONSOR_TIERS.map((tier, tIdx) => (
                          <option key={tIdx} value={tier}>
                            {tier}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Contribution Amount (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={sp.contributionAmount}
                        onChange={(e) => {
                          const copy = [...sponsors];
                          copy[idx].contributionAmount = Number(e.target.value) || 0;
                          setSponsors(copy);
                        }}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Contact Person &amp; Email</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe (partner@company.com)"
                        value={sp.contactPerson}
                        onChange={(e) => {
                          const copy = [...sponsors];
                          copy[idx].contactPerson = e.target.value;
                          setSponsors(copy);
                        }}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Upload Signed MoU (PDF / Scan)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              const copy = [...sponsors];
                              copy[idx].mouFileName = file.name;
                              copy[idx].mouDataUrl = reader.result as string;
                              copy[idx].mouMimeType = file.type || "application/pdf";
                              setSponsors(copy);
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                        />
                        {sp.mouFileName && (
                          <span className="text-[11px] font-bold text-emerald-700 truncate max-w-[140px]">
                            ✓ {sp.mouFileName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ==================== MODULE: PROMOTIONAL BANNERS, POSTERS & SOCIETY LOGO ARTWORK ==================== */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>🎨</span> Module: Promotional Banners, Posters &amp; Society Letterhead Branding
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload production-ready flex banners (with standard dimensions), official posters, and society emblems for printable letterheads.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1. Event Banner Flex */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                <span className="text-xs font-black uppercase text-emerald-800 block">
                  1. Stage &amp; Entrance Banner Flex
                </span>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Standard Format &amp; Sizing</label>
                  <select
                    value={bannerDetails.format}
                    onChange={(e) => {
                      const selected = BANNER_FORMAT_PRESETS.find((b) => b.label === e.target.value);
                      setBannerDetails({
                        ...bannerDetails,
                        format: e.target.value,
                        dimensions: selected?.dimensions || "12x8 ft",
                        material: selected?.material || "Star Flex",
                      });
                    }}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    {BANNER_FORMAT_PRESETS.map((bp, bIdx) => (
                      <option key={bIdx} value={bp.label}>
                        {bp.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Dimensions</label>
                    <input
                      type="text"
                      value={bannerDetails.dimensions}
                      onChange={(e) => setBannerDetails({ ...bannerDetails, dimensions: e.target.value })}
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Flex Material</label>
                    <input
                      type="text"
                      value={bannerDetails.material}
                      onChange={(e) => setBannerDetails({ ...bannerDetails, material: e.target.value })}
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Upload Banner Artwork</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setBannerDetails({
                          ...bannerDetails,
                          fileName: file.name,
                          dataUrl: reader.result as string,
                          mimeType: file.type || "image/png",
                        });
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                  />
                </div>

                {bannerDetails.dataUrl && bannerDetails.dataUrl.startsWith("data:image") && (
                  <img
                    src={bannerDetails.dataUrl}
                    alt="Banner preview"
                    className="w-full h-24 object-contain rounded-xl bg-white border border-slate-200"
                  />
                )}
              </div>

              {/* 2. Official Poster */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                <span className="text-xs font-black uppercase text-indigo-800 block">
                  2. Official Event Poster
                </span>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Print / Digital Format</label>
                  <select
                    value={posterDetails.format}
                    onChange={(e) => setPosterDetails({ ...posterDetails, format: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    {POSTER_FORMAT_PRESETS.map((pp, pIdx) => (
                      <option key={pIdx} value={pp.label}>
                        {pp.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Upload Poster Artwork</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setPosterDetails({
                          ...posterDetails,
                          fileName: file.name,
                          dataUrl: reader.result as string,
                          mimeType: file.type || "image/png",
                        });
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-800 hover:file:bg-indigo-200 cursor-pointer"
                  />
                </div>

                {posterDetails.dataUrl && posterDetails.dataUrl.startsWith("data:image") && (
                  <img
                    src={posterDetails.dataUrl}
                    alt="Poster preview"
                    className="w-full h-24 object-contain rounded-xl bg-white border border-slate-200"
                  />
                )}
              </div>

              {/* 3. Society Emblem (For Printable Header) */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                <span className="text-xs font-black uppercase text-purple-800 block">
                  3. Society Logo (Document Header)
                </span>
                <p className="text-[11px] text-slate-500">
                  Embeds your society crest right into the printable A4 letterhead alongside the KIIT &amp; KSAC logos.
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Upload Transparent Logo (PNG)</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setSocietyLogo({
                          fileName: file.name,
                          dataUrl: reader.result as string,
                          mimeType: file.type || "image/png",
                        });
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-800 hover:file:bg-purple-200 cursor-pointer"
                  />
                </div>

                {societyLogo.dataUrl && (
                  <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200">
                    <img
                      src={societyLogo.dataUrl}
                      alt="Society Logo preview"
                      className="w-12 h-12 object-contain rounded"
                    />
                    <div className="text-xs">
                      <strong className="block text-slate-800 truncate">{societyLogo.fileName}</strong>
                      <span className="text-[10px] text-emerald-700 font-bold">✓ Ready for Letterhead Print</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* SUBMIT / SAVE ACTIONS */}
          <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-lg backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                setSelectedProposal(buildLiveProposalSnapshot());
                setViewMode("preview");
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs flex items-center gap-1.5"
            >
              <span>👁️</span> Preview Formal Document (A4)
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveOrSubmit(true)}
              className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition shadow-xs flex items-center gap-1.5"
            >
              <span>💾</span> Save as Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveOrSubmit(false)}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-700/20 hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              <span>🚀</span>
              {saving
                ? "Submitting to Dean KSAC..."
                : "Submit Event Proposal to Dean KSAC"}
            </button>
          </div>
        </div>
      )}

      {/* ==================== VIEW 3: FORMAL DOCUMENT PREVIEW & PRINT ==================== */}
      {viewMode === "preview" && selectedProposal && (
        <EventProposalDocument
          proposal={selectedProposal}
          canPrint={true}
          onClose={() => setViewMode("list")}
        />
      )}
    </div>
  );
}
