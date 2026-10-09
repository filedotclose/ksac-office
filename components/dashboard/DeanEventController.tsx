"use client";

import React, { useEffect, useState } from "react";
import { dispatchGateway, GATEWAY_OPCODES } from "@/lib/gatewayClient";
import { formatIndianCurrency, numberToIndianRupeeWords } from "@/lib/eventProposalPresets";
import EventProposalDocument from "./EventProposalDocument";

export default function DeanEventController() {
  const [subTab, setSubTab] = useState<"proposals" | "rough_requests" | "budget_table" | "society_files" | "directory">("proposals");
  const [roughRequests, setRoughRequests] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [totalSanctioned, setTotalSanctioned] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [societyFiles, setSocietyFiles] = useState<any[]>([]);
  const [roughRemarks, setRoughRemarks] = useState<string>("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("ALL");
  const [fileSocietyFilter, setFileSocietyFilter] = useState<string>("ALL");
  const [proposals, setProposals] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active Proposal Modal / Drawer state
  const [activeProposal, setActiveProposal] = useState<any | null>(null);
  const [detailMode, setDetailMode] = useState<"overview" | "document" | "mails" | "signatories" | "softcopy">("overview");
  const [selectedMailIdx, setSelectedMailIdx] = useState<number>(0);
  const [deanNoteInput, setDeanNoteInput] = useState<string>("");
  const [sendingMail, setSendingMail] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [showSenderConfig, setShowSenderConfig] = useState(false);

  // Editable mail fields for the currently selected department tab
  const [editRecipient, setEditRecipient] = useState("");
  const [editCc, setEditCc] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editBodyText, setEditBodyText] = useState("");

  // Institutional Dean KSAC Sender & Reply-To configuration
  const [senderDisplayName, setSenderDisplayName] = useState("Office of the Dean, KSAC");
  const [senderOfficialEmail, setSenderOfficialEmail] = useState("ksac.office@kiit.ac.in");
  const [replyToEmail, setReplyToEmail] = useState("deanksac@kiit.ac.in");

  // Signatories editor inside Dean view
  const [editSignatories, setEditSignatories] = useState<any[]>([]);

  // Custom Department Directory Form State
  const [deptForm, setDeptForm] = useState({
    categoryKey: "VENUE",
    name: "",
    primaryEmail: "",
    ccEmails: "",
    contactPerson: "",
    defaultSubjectTemplate:
      "KSAC Event Requirement [{category}] — {eventName} ({society}) on {dateDisplay}",
    defaultHeaderNote:
      "Kindly arrange the following approved requirements for the upcoming KSAC society event:",
  });
  const [savingDept, setSavingDept] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await dispatchGateway(GATEWAY_OPCODES.FETCH_EVENT_PROPOSALS);
      if (res.ok && res.data) {
        if (Array.isArray(res.data.proposals)) {
          setProposals(res.data.proposals);
          if (activeProposal) {
            const updated = res.data.proposals.find((p: any) => p._id === activeProposal._id);
            if (updated) setActiveProposal(updated);
          }
        }
        if (Array.isArray(res.data.departments)) {
          setDepartments(res.data.departments);
        }
      }

      // Fetch Rough Requests
      const roughRes = await dispatchGateway<{ requests: any[] }>(GATEWAY_OPCODES.FETCH_ROUGH_REQUESTS);
      if (roughRes.ok && roughRes.data?.requests) {
        setRoughRequests(roughRes.data.requests);
      }

      // Fetch Budgets Table
      const budRes = await dispatchGateway<{ budgets: any[]; totalSanctionedBudget: number; totalProjectedRevenue: number }>(GATEWAY_OPCODES.FETCH_EVENT_BUDGETS);
      if (budRes.ok && budRes.data) {
        setBudgets(budRes.data.budgets || []);
        setTotalSanctioned(budRes.data.totalSanctionedBudget || 0);
        setTotalRevenue(budRes.data.totalProjectedRevenue || 0);
      }

      // Fetch Society Files
      const fileRes = await dispatchGateway<{ files: any[] }>(GATEWAY_OPCODES.FETCH_SOCIETY_FILES);
      if (fileRes.ok && fileRes.data?.files) {
        setSocietyFiles(fileRes.data.files);
      }
    } catch (err) {
      console.error("Failed to fetch Dean event proposals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Sync editable mail fields when switching proposal or department mail tab
  useEffect(() => {
    if (!activeProposal) return;
    setDeanNoteInput(activeProposal.deanNote || "");
    setEditSignatories(Array.isArray(activeProposal.signatories) ? activeProposal.signatories : []);
    const mails = activeProposal.departmentMails || [];
    const mail = mails[selectedMailIdx] || mails[0];
    if (mail) {
      setEditRecipient(mail.recipientEmail || "");
      setEditCc(Array.isArray(mail.ccEmails) ? mail.ccEmails.join(", ") : "");
      setEditSubject(mail.subject || "");
      setEditBodyText(mail.bodyText || "");
      if (mail.replyToAddress) {
        setReplyToEmail(mail.replyToAddress);
      }
    }
  }, [activeProposal, selectedMailIdx]);

  const handleRoughRequestAction = async (requestId: string, action: "APPROVE" | "DISAPPROVE" | "WAITING") => {
    try {
      const res = await dispatchGateway(GATEWAY_OPCODES.ACTION_ROUGH_REQUEST, {
        requestId,
        action,
        reviewRemarks: roughRemarks,
      });
      if (res.ok) {
        setToast({ type: "success", text: `Rough request marked as ${action}.` });
        setRoughRemarks("");
        fetchAll();
      } else {
        setToast({ type: "error", text: res.message || "Failed to update rough request." });
      }
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Action failed." });
    }
  };

  const handleOpenProposal = (p: any, mode: "overview" | "document" | "mails" | "signatories" | "softcopy" = "overview") => {
    setActiveProposal(p);
    setDetailMode(mode);
    setSelectedMailIdx(0);
  };

  const handleSendDepartmentMail = async (sendAll: boolean) => {
    if (!activeProposal) return;
    setSendingMail(true);
    setToast(null);
    try {
      const mails = activeProposal.departmentMails || [];
      const currentMail = mails[selectedMailIdx];

      const res = await dispatchGateway(GATEWAY_OPCODES.SEND_DEPARTMENT_EMAILS, {
        proposalId: activeProposal._id,
        categoryKey: sendAll ? "ALL" : currentMail?.categoryKey,
        approveOnSend: true,
        senderDisplayName,
        officialSenderEmail: senderOfficialEmail,
        replyToEmail,
        updatedMail: currentMail
          ? {
              categoryKey: currentMail.categoryKey,
              recipientEmail: editRecipient,
              ccEmails: editCc
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              subject: editSubject,
              bodyText: editBodyText,
              bodyHtml: currentMail.bodyHtml,
              senderDisplayName,
              officialSenderEmail: senderOfficialEmail,
              replyToEmail,
            }
          : undefined,
      });

      if (!res.ok) {
        setToast({ type: "error", text: res.message || "Failed to dispatch department emails." });
        return;
      }

      const sentCount = res.data?.sentCount || 0;
      setToast({
        type: "success",
        text: sendAll
          ? `Dispatched ${sentCount} department email(s) and confirmed Official Print Format for ${activeProposal.society}!`
          : `Sent requirement email to ${currentMail?.departmentName || "Department"} (${editRecipient})!`,
      });
      if (res.data?.proposal) {
        setActiveProposal(res.data.proposal);
      }
      await fetchAll();
    } catch (err: any) {
      setToast({ type: "error", text: err?.message || "Failed to send mail." });
    } finally {
      setSendingMail(false);
    }
  };

  const handleProposalAction = async (
    action: "APPROVE" | "REQUEST_REVISION" | "REJECT" | "VERIFY_SOFTCOPY" | "REGENERATE_MAILS",
    customSignatories?: any[]
  ) => {
    if (!activeProposal) return;
    setProcessingAction(true);
    setToast(null);
    try {
      const res = await dispatchGateway(GATEWAY_OPCODES.ACTION_EVENT_PROPOSAL, {
        proposalId: activeProposal._id,
        action,
        deanNote: deanNoteInput,
        signatories: customSignatories || editSignatories,
      });

      if (!res.ok) {
        setToast({ type: "error", text: res.message || "Controller action failed." });
        return;
      }

      const actionLabels: Record<string, string> = {
        APPROVE: "Proposal approved & Official Formal Printout unlocked for the society!",
        REQUEST_REVISION: "Revision requested. Student leaders will see your remarks.",
        REJECT: "Proposal rejected.",
        VERIFY_SOFTCOPY: "Signed softcopy verified and archived! Event marked COMPLETED.",
        REGENERATE_MAILS: "Department email templates refreshed from current Department Directory.",
      };

      setToast({
        type: "success",
        text: actionLabels[action] || "Updated successfully.",
      });

      if (res.data?.proposal) {
        setActiveProposal(res.data.proposal);
      }
      await fetchAll();
    } catch (err: any) {
      setToast({ type: "error", text: err?.message || "Action failed." });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDept(true);
    setToast(null);
    try {
      const res = await dispatchGateway(GATEWAY_OPCODES.SAVE_DEPARTMENT_CONFIG, {
        mode: "UPSERT",
        department: {
          ...deptForm,
          ccEmails: deptForm.ccEmails
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
      });
      if (!res.ok) {
        setToast({ type: "error", text: res.message || "Failed to save department." });
        return;
      }
      if (Array.isArray(res.data?.departments)) {
        setDepartments(res.data.departments);
      }
      setToast({
        type: "success",
        text: `Saved "${deptForm.name}" (${deptForm.categoryKey}) in Department Directory!`,
      });
    } catch (err: any) {
      setToast({ type: "error", text: err?.message || "Failed to save department." });
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDepartment = async (categoryKey: string) => {
    const res = await dispatchGateway(GATEWAY_OPCODES.SAVE_DEPARTMENT_CONFIG, {
      mode: "DELETE",
      department: { categoryKey },
    });
    if (res.ok && Array.isArray(res.data?.departments)) {
      setDepartments(res.data.departments);
      setToast({ type: "success", text: `Removed ${categoryKey} from Department Directory.` });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-300/40";
      case "APPROVED":
        return "bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-300/40";
      case "SIGNED_SOFTCOPY_SUBMITTED":
        return "bg-sky-50 text-sky-800 border-sky-200 ring-1 ring-sky-300/40";
      case "COMPLETED":
        return "bg-purple-50 text-purple-800 border-purple-200 ring-1 ring-purple-300/40";
      case "REVISION_REQUESTED":
        return "bg-orange-50 text-orange-800 border-orange-200 ring-1 ring-orange-300/40";
      case "REJECTED":
        return "bg-rose-50 text-rose-800 border-rose-200 ring-1 ring-rose-300/40";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "⏳ Pending Review";
      case "APPROVED":
        return "✅ Approved";
      case "SIGNED_SOFTCOPY_SUBMITTED":
        return "📎 Softcopy Uploaded";
      case "COMPLETED":
        return "🏆 Completed";
      case "REVISION_REQUESTED":
        return "↩️ Revision Requested";
      case "REJECTED":
        return "❌ Rejected";
      default:
        return status.replace(/_/g, " ");
    }
  };

  // Filtered Proposals list
  const filteredProposals = proposals.filter((p) => {
    const matchesStatus = statusFilter === "ALL" ? true : p.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesStatus;
    const matchesSearch =
      (p.eventName || "").toLowerCase().includes(q) ||
      (p.society || "").toLowerCase().includes(q) ||
      (p.studentName || "").toLowerCase().includes(q) ||
      (p.venueCampus || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // KPI Counts
  const pendingCount = proposals.filter((p) => p.status === "SUBMITTED").length;
  const approvedCount = proposals.filter((p) => p.status === "APPROVED").length;
  const softcopyCount = proposals.filter((p) => p.status === "SIGNED_SOFTCOPY_SUBMITTED").length;
  const completedCount = proposals.filter((p) => p.status === "COMPLETED").length;
  const revisionCount = proposals.filter((p) => p.status === "REVISION_REQUESTED").length;

  return (
    <div className="space-y-6">
      {/* ==================== 1. LUMINOUS EXECUTIVE CONTROLLER HEADER ==================== */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-800">
                🏛️ Dean KSAC Authority Center
              </span>
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                Official Approval &amp; Dispatch Portal
              </span>
            </div>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Event Approvals &amp; Department Mails
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Review society event proposals, approve formal Notesheets to unlock physical signatures, dispatch official requirement emails to university departments, and archive verified softcopies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveProposal(null);
                setSubTab("proposals");
              }}
              className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                subTab === "proposals"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>📋</span> Event Proposals ({proposals.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveProposal(null);
                setSubTab("rough_requests");
              }}
              className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                subTab === "rough_requests"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>⚡</span> Rough Requests ({roughRequests.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveProposal(null);
                setSubTab("budget_table");
              }}
              className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                subTab === "budget_table"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>💰</span> Budget Ledger ({budgets.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveProposal(null);
                setSubTab("society_files");
              }}
              className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                subTab === "society_files"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>📁</span> Society Files ({societyFiles.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveProposal(null);
                setSubTab("directory");
              }}
              className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                subTab === "directory"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>🏛️</span> Department Directory ({departments.length})
            </button>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
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

      {/* ==================== SUB-TAB 1: PROPOSALS CONTROLLER ==================== */}
      {subTab === "proposals" && !activeProposal && (
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
              <div className="text-[11px] text-slate-400 mt-0.5">Across all student societies</div>
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
                  Awaiting Review
                </span>
                <span className="rounded-full bg-amber-200/70 px-1.5 py-0.2 text-[10px] font-black text-amber-900">
                  Action
                </span>
              </div>
              <div className="mt-1.5 text-2xl font-black text-amber-700">{pendingCount}</div>
              <div className="text-[11px] text-amber-700/80 mt-0.5">Needs Dean approval</div>
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
                  Approved &amp; Ready
                </span>
                <span className="text-base">✅</span>
              </div>
              <div className="mt-1.5 text-2xl font-black text-emerald-700">{approvedCount}</div>
              <div className="text-[11px] text-emerald-700/80 mt-0.5">Notesheet print unlocked</div>
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
                  Softcopies Uploaded
                </span>
                <span className="text-base">📎</span>
              </div>
              <div className="mt-1.5 text-2xl font-black text-sky-700">{softcopyCount + completedCount}</div>
              <div className="text-[11px] text-sky-700/80 mt-0.5">{completedCount} fully archived</div>
            </button>
          </div>

          {/* Filter Bar & Search Input */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ALL", label: `All (${proposals.length})` },
                { id: "SUBMITTED", label: `⏳ Pending (${pendingCount})` },
                { id: "APPROVED", label: `✅ Approved (${approvedCount})` },
                { id: "SIGNED_SOFTCOPY_SUBMITTED", label: `📎 Softcopy (${softcopyCount})` },
                { id: "COMPLETED", label: `🏆 Completed (${completedCount})` },
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
                placeholder="Search event, society, or student..."
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

          {/* Proposals List Cards */}
          {loading ? (
            <div className="grid gap-4">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
                />
              ))}
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-2xl">
                📂
              </div>
              <h3 className="text-base font-black text-slate-800">No proposals match your selection</h3>
              <p className="mt-1 text-xs text-slate-500">
                Try switching the status filter or clearing your search term.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProposals.map((p) => {
                const mails = p.departmentMails || [];
                const sentCount = mails.filter((m: any) => m.status === "SENT").length;
                const isPendingAction = p.status === "SUBMITTED";

                return (
                  <div
                    key={p._id}
                    className={`rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md ${
                      isPendingAction
                        ? "border-amber-300 ring-1 ring-amber-300/40"
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
                          {p.tagline && (
                            <span className="ml-2 text-xs font-medium text-slate-500">
                              — {p.tagline}
                            </span>
                          )}
                        </h3>

                        <p className="line-clamp-2 text-xs text-slate-600 leading-relaxed">
                          {p.background}
                        </p>

                        <div className="text-xs text-slate-500 pt-0.5">
                          Initiated by Student Lead: <strong className="text-slate-800">{p.studentName}</strong> ({p.position} &bull; {p.studentRollNo})
                        </div>
                      </div>

                      {/* Right Quick Summary Column */}
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-right sm:min-w-[190px] shrink-0">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Proposed Budget
                        </div>
                        <div className="text-lg font-black text-emerald-700">
                          Rs. {formatIndianCurrency(p.budgetTotal || 0)}/-
                        </div>
                        <div className="mt-1 text-[11px] font-bold text-slate-600">
                          Dept Mails: <span className="text-emerald-700">{sentCount}</span>/{mails.length} Dispatched
                        </div>
                      </div>
                    </div>

                    {p.deanNote && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs text-amber-900">
                        <strong>Dean Remarks:</strong> {p.deanNote}
                      </div>
                    )}

                    {/* Action Hub */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {isPendingAction ? (
                          <button
                            type="button"
                            onClick={() => handleOpenProposal(p, "overview")}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition flex items-center gap-1.5"
                          >
                            <span>⚡</span> Review &amp; Take Action
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenProposal(p, "overview")}
                            className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition flex items-center gap-1.5"
                          >
                            <span>📋</span> Full Overview &amp; Review
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenProposal(p, "mails")}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1.5"
                        >
                          <span>📧</span> Department Mails ({mails.length})
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenProposal(p, "document")}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5"
                        >
                          <span>📄</span> Notesheet (A4 Print)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenProposal(p, "signatories")}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                        >
                          ✍️ Signatories
                        </button>
                      </div>

                      {p.signedSoftcopy?.dataUrl && (
                        <button
                          type="button"
                          onClick={() => handleOpenProposal(p, "softcopy")}
                          className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                            p.signedSoftcopy.verifiedByDean
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                              : "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100"
                          }`}
                        >
                          <span>📎</span>
                          <span>Signed Softcopy</span>
                          <span className="text-[10px] font-bold">
                            {p.signedSoftcopy.verifiedByDean ? "(Verified ✓)" : "(Pending Verification)"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== ACTIVE PROPOSAL WORKSPACE ==================== */}
      {subTab === "proposals" && activeProposal && (
        <div className="space-y-5">
          {/* Top Bar Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveProposal(null)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                &larr; Back to Queue
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {activeProposal.eventName}
                  </h3>
                  <span className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
                    {activeProposal.society}
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getStatusBadge(activeProposal.status)}`}>
                    {getStatusLabel(activeProposal.status)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Budget: <strong className="text-emerald-700">Rs. {formatIndianCurrency(activeProposal.budgetTotal || 0)}/-</strong> &bull; Date: <strong className="text-slate-700">{activeProposal.dateDisplay || activeProposal.startDate}</strong> &bull; Campus: <strong className="text-slate-700">{activeProposal.venueCampus}</strong>
                </p>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDetailMode("overview")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                  detailMode === "overview"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>📋</span> Overview &amp; Review
              </button>

              <button
                type="button"
                onClick={() => setDetailMode("document")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                  detailMode === "document"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>📄</span> Notesheet (A4 Print)
              </button>

              <button
                type="button"
                onClick={() => setDetailMode("mails")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                  detailMode === "mails"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>📧</span> Dept Mails ({(activeProposal.departmentMails || []).length})
              </button>

              <button
                type="button"
                onClick={() => setDetailMode("signatories")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                  detailMode === "signatories"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>✍️</span> Signatories
              </button>

              {activeProposal.signedSoftcopy?.dataUrl && (
                <button
                  type="button"
                  onClick={() => setDetailMode("softcopy")}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                    detailMode === "softcopy"
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200"
                  }`}
                >
                  <span>📎</span> Signed Softcopy
                </button>
              )}
            </div>
          </div>

          {/* ==================== DETAIL MODE 1: PROPOSAL OVERVIEW & REVIEW ==================== */}
          {detailMode === "overview" && (
            <div className="space-y-5">
              {/* Dean Decision & Action Hub */}
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white p-5 shadow-xs">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">⚖️</span>
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">
                        Dean KSAC Decision &amp; Action Hub
                      </h4>
                      <span className={`rounded-full border px-2 py-0.2 text-[10px] font-bold ${getStatusBadge(activeProposal.status)}`}>
                        {getStatusLabel(activeProposal.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enter official approval remarks or revision feedback for society leadership.
                    </p>
                    <div className="mt-2.5">
                      <input
                        type="text"
                        value={deanNoteInput}
                        onChange={(e) => setDeanNoteInput(e.target.value)}
                        placeholder="Add remarks for President/VP (e.g. Approved with standard university campus guidelines)..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:self-end">
                    <button
                      type="button"
                      disabled={processingAction}
                      onClick={() => handleProposalAction("APPROVE")}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 transition active:scale-95 flex items-center gap-1.5"
                    >
                      <span>✅</span> Approve &amp; Unlock Print
                    </button>
                    <button
                      type="button"
                      disabled={processingAction}
                      onClick={() => handleProposalAction("REQUEST_REVISION")}
                      className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition flex items-center gap-1.5"
                    >
                      <span>↩️</span> Request Revision
                    </button>
                    <button
                      type="button"
                      disabled={processingAction}
                      onClick={() => handleProposalAction("REGENERATE_MAILS")}
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                      title="Sync department email templates from directory"
                    >
                      <span>🔄</span> Sync Dept Mails
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Executive Briefing Grid */}
              <div className="grid gap-5 lg:grid-cols-12">
                {/* Left 8 Columns: Narrative, Schedule, Requirements */}
                <div className="space-y-5 lg:col-span-8">
                  {/* Event Overview Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                          Section 1: Executive Overview
                        </span>
                        <h4 className="text-base font-black text-slate-900 mt-0.5">
                          {activeProposal.eventName}
                        </h4>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                        OC Size: {activeProposal.ocHeadcount || 30} Members
                      </span>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-700">Event Narrative &amp; Background</h5>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                        {activeProposal.background || "No background narrative provided."}
                      </p>
                    </div>

                    {Array.isArray(activeProposal.objectives) && activeProposal.objectives.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold text-slate-700">Core Objectives</h5>
                        <ul className="mt-1.5 space-y-1">
                          {activeProposal.objectives.map((obj: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                              <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Schedule & Format Card */}
                  {Array.isArray(activeProposal.subEvents) && activeProposal.subEvents.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                      <div className="border-b border-slate-100 pb-2.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                          Section 2: Event Format &amp; Schedule
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-0.5">
                          Planned Rounds &amp; Sub-Events ({activeProposal.subEvents.length})
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {activeProposal.subEvents.map((se: any, i: number) => (
                          <div key={i} className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900">{se.name}</span>
                              <span className="rounded bg-emerald-100/70 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                                {se.dayLabel || `Day ${i + 1}`} &bull; {se.timings}
                              </span>
                            </div>
                            {se.description && (
                              <p className="mt-1 text-xs text-slate-600">{se.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resource Demands Matrix */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                          Section 3: Departmental Resource Demands
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-0.5">
                          Extracted University Department Requirements
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetailMode("mails")}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                      >
                        Open Dept Mailer &rarr;
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Venue Requirements */}
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span>🏛️</span> Estate &amp; Venues
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {(activeProposal.venueRequirements || []).length} items
                          </span>
                        </div>
                        {(activeProposal.venueRequirements || []).length > 0 ? (
                          <div className="space-y-1">
                            {activeProposal.venueRequirements.slice(0, 3).map((v: any, i: number) => (
                              <div key={i} className="text-[11px] text-slate-600 flex justify-between">
                                <span>{v.venueType} ({v.campus})</span>
                                <span className="font-semibold text-slate-700">{v.timings}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">No specific venue rows requested.</div>
                        )}
                      </div>

                      {/* Technical Requirements */}
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span>🔊</span> Technical &amp; AV
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {(activeProposal.technicalRequirements || []).length} items
                          </span>
                        </div>
                        {(activeProposal.technicalRequirements || []).length > 0 ? (
                          <div className="space-y-1">
                            {activeProposal.technicalRequirements.slice(0, 3).map((t: any, i: number) => (
                              <div key={i} className="text-[11px] text-slate-600 flex justify-between">
                                <span>{t.item}</span>
                                <span className="font-semibold text-slate-700">Qty: {t.quantity}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">No technical equipment requested.</div>
                        )}
                      </div>

                      {/* Food Requirements */}
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span>🍱</span> Hospitality &amp; Catering
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {(activeProposal.foodRequirements || []).length} items
                          </span>
                        </div>
                        {(activeProposal.foodRequirements || []).length > 0 ? (
                          <div className="space-y-1">
                            {activeProposal.foodRequirements.slice(0, 3).map((f: any, i: number) => (
                              <div key={i} className="text-[11px] text-slate-600 flex justify-between">
                                <span>{f.item}</span>
                                <span className="font-semibold text-slate-700">Qty: {f.quantity}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">No catering/food rows requested.</div>
                        )}
                      </div>

                      {/* Marketing Requirements */}
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span>📢</span> Publicity &amp; PR
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {(activeProposal.marketingRequirements || []).length} items
                          </span>
                        </div>
                        {(activeProposal.marketingRequirements || []).length > 0 ? (
                          <div className="space-y-1">
                            {activeProposal.marketingRequirements.slice(0, 3).map((m: any, i: number) => (
                              <div key={i} className="text-[11px] text-slate-600 flex justify-between">
                                <span>{m.item}</span>
                                <span className="font-semibold text-slate-700">{m.campus}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">No marketing desks/standees requested.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 4 Columns: Budget Breakdown & Signatories */}
                <div className="space-y-5 lg:col-span-4">
                  {/* Budget Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                    <div className="border-b border-slate-100 pb-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                        Section 4: Financial Summary
                      </span>
                      <h4 className="text-sm font-black text-slate-900 mt-0.5">Budget Breakdown</h4>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-center">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Total Proposed Expenditure
                      </div>
                      <div className="text-xl font-black text-emerald-700 mt-0.5">
                        Rs. {formatIndianCurrency(activeProposal.budgetTotal || 0)}/-
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 italic leading-tight">
                        {activeProposal.budgetInWords || numberToIndianRupeeWords(activeProposal.budgetTotal || 0)}
                      </div>
                    </div>

                    {Array.isArray(activeProposal.budgetItems) && activeProposal.budgetItems.length > 0 && (
                      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                        {activeProposal.budgetItems.map((b: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                            <span className="text-slate-700 truncate max-w-[140px]">{b.particulars}</span>
                            <span className="font-bold text-slate-900">
                              Rs. {formatIndianCurrency(b.totalCost || 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Signatories Summary Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                          Section 5: Signatories
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-0.5">Configured Signatories</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetailMode("signatories")}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                      >
                        Edit &rarr;
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {(activeProposal.signatories || []).map((s: any, i: number) => (
                        <div key={i} className="rounded-lg bg-slate-50 p-2 text-xs border border-slate-100">
                          <div className="font-bold text-slate-900">{s.roleTitle || s.designation}</div>
                          {s.name && <div className="text-[11px] text-slate-500">{s.name}</div>}
                          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                            Placement: {s.location || "FOOTER"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Action Shortcuts */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setDetailMode("document")}
                      className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition flex items-center justify-center gap-2"
                    >
                      <span>📄</span> View &amp; Print Notesheet (A4)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailMode("mails")}
                      className="w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition flex items-center justify-center gap-2"
                    >
                      <span>📧</span> Review Department Emails
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== DETAIL MODE 2: FORMAL DOCUMENT PREVIEW ==================== */}
          {detailMode === "document" && (
            <EventProposalDocument proposal={activeProposal} canPrint={true} />
          )}

          {/* ==================== DETAIL MODE 3: DEPARTMENT MAILS DISPATCH ==================== */}
          {detailMode === "mails" && (
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left Sidebar: Extracted Departments */}
              <div className="space-y-3 lg:col-span-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Extracted Department Mails
                  </h4>
                  <button
                    type="button"
                    disabled={sendingMail}
                    onClick={() => handleSendDepartmentMail(true)}
                    className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    🚀 Send All Dept Mails
                  </button>
                </div>

                {(activeProposal.departmentMails || []).map((m: any, idx: number) => (
                  <button
                    key={m.categoryKey}
                    type="button"
                    onClick={() => setSelectedMailIdx(idx)}
                    className={`w-full rounded-2xl border p-3.5 text-left transition ${
                      selectedMailIdx === idx
                        ? "border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500"
                        : "border-slate-200 bg-white hover:bg-slate-50 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-black uppercase text-slate-800">
                        {m.categoryKey}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          m.status === "SENT"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : m.status === "FAILED"
                            ? "border-rose-200 bg-rose-50 text-rose-800"
                            : "border-amber-200 bg-amber-50 text-amber-800"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs font-bold text-slate-900">{m.departmentName}</div>
                    <div className="mt-0.5 truncate text-[11px] text-slate-500">
                      To: {m.recipientEmail}
                    </div>
                  </button>
                ))}
              </div>

              {/* Right Pane: Mail Editor & HTML Table Preview */}
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-8">
                {activeProposal.departmentMails?.[selectedMailIdx] ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-sm font-black text-slate-900">
                          {activeProposal.departmentMails[selectedMailIdx].departmentName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Review recipient details, customized requirements, and send official notification.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={sendingMail}
                        onClick={() => handleSendDepartmentMail(false)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
                      >
                        {sendingMail
                          ? "Sending..."
                          : `📨 Send Mail to ${activeProposal.departmentMails[selectedMailIdx].categoryKey} Dept`}
                      </button>
                    </div>

                    {/* Collapsible Institutional Authority & Sender Identity Card */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs">🏛️</span>
                          <span className="text-xs font-bold text-emerald-900">
                            Dispatched via Office of the Dean, KSAC Authority
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSenderConfig(!showSenderConfig)}
                          className="text-[11px] font-semibold text-emerald-800 underline hover:text-emerald-900"
                        >
                          {showSenderConfig ? "Hide Sender Config ▲" : "Configure Authority & Reply-To ▼"}
                        </button>
                      </div>

                      {showSenderConfig && (
                        <div className="mt-3 grid gap-3 sm:grid-cols-3 pt-3 border-t border-emerald-200/60">
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                              Sender Display Name
                            </label>
                            <input
                              type="text"
                              value={senderDisplayName}
                              onChange={(e) => setSenderDisplayName(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              placeholder="Office of the Dean, KSAC"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                              Official Sender Email
                            </label>
                            <select
                              value={senderOfficialEmail}
                              onChange={(e) => setSenderOfficialEmail(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="ksac.office@kiit.ac.in">ksac.office@kiit.ac.in (Central KSAC)</option>
                              <option value="deanksac@kiit.ac.in">deanksac@kiit.ac.in (Dean KSAC Authority)</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                              Dean Reply-To Address
                            </label>
                            <select
                              value={replyToEmail}
                              onChange={(e) => setReplyToEmail(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="deanksac@kiit.ac.in">deanksac@kiit.ac.in (Dean KSAC Inbox)</option>
                              <option value="ksac.office@kiit.ac.in">ksac.office@kiit.ac.in (KSAC Office Inbox)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">
                            To (Department Email)
                          </label>
                          <span className="text-[10px] font-semibold text-emerald-700">
                            Prefilled
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <select
                            aria-label="Department Recipient Selector"
                            value={
                              departments.some((d) => d.primaryEmail === editRecipient) ||
                              editRecipient === activeProposal.departmentMails[selectedMailIdx].recipientEmail
                                ? editRecipient
                                : "CUSTOM"
                            }
                            onChange={(e) => {
                              if (e.target.value !== "CUSTOM") {
                                setEditRecipient(e.target.value);
                                const matched = departments.find((d) => d.primaryEmail === e.target.value);
                                if (matched && Array.isArray(matched.ccEmails) && matched.ccEmails.length > 0) {
                                  setEditCc(matched.ccEmails.join(", "));
                                }
                              }
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          >
                            <option value={activeProposal.departmentMails[selectedMailIdx].recipientEmail}>
                              ⭐ Suggested: {activeProposal.departmentMails[selectedMailIdx].departmentName} ({activeProposal.departmentMails[selectedMailIdx].recipientEmail})
                            </option>
                            {departments.length > 0 && (
                              <optgroup label="University Department Directory">
                                {departments.map((d: any) => (
                                  <option key={d.categoryKey} value={d.primaryEmail}>
                                    {d.name} ({d.primaryEmail})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <optgroup label="Other University Service Desks">
                              <option value="venue@kiit.ac.in">Central Venue &amp; Auditorium (venue@kiit.ac.in)</option>
                              <option value="audiovisual@kiit.ac.in">Sound &amp; Technical AV (audiovisual@kiit.ac.in)</option>
                              <option value="hospitality@kiit.ac.in">Hospitality &amp; Catering (hospitality@kiit.ac.in)</option>
                              <option value="publicity@kiit.ac.in">Public Relations &amp; Standees (publicity@kiit.ac.in)</option>
                              <option value="accounts@kiit.ac.in">Finance &amp; Accounts (accounts@kiit.ac.in)</option>
                              <option value="ksac.office@kiit.ac.in">KSAC Central Office (ksac.office@kiit.ac.in)</option>
                              <option value="transport@kiit.ac.in">Transport &amp; Vehicles (transport@kiit.ac.in)</option>
                              <option value="security@kiit.ac.in">Campus Security (security@kiit.ac.in)</option>
                            </optgroup>
                            <option value="CUSTOM">Custom Address (type below)</option>
                          </select>

                          <input
                            type="email"
                            value={editRecipient}
                            onChange={(e) => setEditRecipient(e.target.value)}
                            placeholder="Recipient email address..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">CC Emails (comma-separated)</label>
                        <input
                          type="text"
                          value={editCc}
                          onChange={(e) => setEditCc(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          placeholder="ksac.office@kiit.ac.in, hod@kiit.ac.in"
                        />
                        <p className="mt-1 text-[10px] text-slate-500">
                          Replies route directly to Dean KSAC ({replyToEmail}).
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">Email Subject</label>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">
                        Formatted Requirement Table Preview (Delivered to Department)
                      </label>
                      <div
                        className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-slate-900 shadow-inner"
                        dangerouslySetInnerHTML={{
                          __html: activeProposal.departmentMails[selectedMailIdx].bodyHtml,
                        }}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">
                        Editable Plain-Text Body
                      </label>
                      <textarea
                        rows={6}
                        value={editBodyText}
                        onChange={(e) => setEditBodyText(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white p-3 font-mono text-xs text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No department requirement rows found in this proposal.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== DETAIL MODE 4: SIGNATORIES CUSTOMIZATION ==================== */}
          {detailMode === "signatories" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Customize Signatory Blocks on Formal Printout
                  </h4>
                  <p className="text-xs text-slate-500">
                    Add or remove signatory placeholders for Page 1 (Notesheet) and the Proposal Footer.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditSignatories([
                        ...editSignatories,
                        {
                          roleTitle: "Associate Dean, KSAC",
                          name: "",
                          designation: "Associate Dean, KSAC",
                          location: "FOOTER",
                        },
                      ])
                    }
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-slate-100 transition"
                  >
                    + Add Signatory
                  </button>
                  <button
                    type="button"
                    disabled={processingAction}
                    onClick={() => handleProposalAction("APPROVE", editSignatories)}
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition"
                  >
                    💾 Save Signatories
                  </button>
                </div>
              </div>

              {editSignatories.map((sig, idx) => (
                <div key={idx} className="grid gap-3 sm:grid-cols-4">
                  <input
                    type="text"
                    value={sig.name || ""}
                    onChange={(e) => {
                      const next = [...editSignatories];
                      next[idx] = { ...next[idx], name: e.target.value };
                      setEditSignatories(next);
                    }}
                    placeholder="Optional Name"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={sig.designation || sig.roleTitle || ""}
                    onChange={(e) => {
                      const next = [...editSignatories];
                      next[idx] = {
                        ...next[idx],
                        designation: e.target.value,
                        roleTitle: e.target.value,
                      };
                      setEditSignatories(next);
                    }}
                    placeholder="Designation"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 sm:col-span-2"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Signatory Placement"
                      value={sig.location || "FOOTER"}
                      onChange={(e) => {
                        const next = [...editSignatories];
                        next[idx] = { ...next[idx], location: e.target.value };
                        setEditSignatories(next);
                      }}
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500"
                    >
                      <option value="FOOTER">Proposal Footer</option>
                      <option value="NOTESHEET">Page 1 Notesheet</option>
                      <option value="BOTH">Both Pages</option>
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setEditSignatories(editSignatories.filter((_, i) => i !== idx))
                      }
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ==================== DETAIL MODE 5: SIGNED SOFTCOPY ARCHIVE ==================== */}
          {detailMode === "softcopy" && activeProposal.signedSoftcopy?.dataUrl && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Uploaded Signed Hardcopy Scan: {activeProposal.signedSoftcopy.fileName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Uploaded by {activeProposal.signedSoftcopy.uploadedByName || activeProposal.studentName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={activeProposal.signedSoftcopy.dataUrl}
                    download={activeProposal.signedSoftcopy.fileName || "Signed_Approval.pdf"}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    ⬇️ Download Signed Copy
                  </a>
                  {!activeProposal.signedSoftcopy.verifiedByDean && (
                    <button
                      type="button"
                      disabled={processingAction}
                      onClick={() => handleProposalAction("VERIFY_SOFTCOPY")}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition"
                    >
                      ✅ Verify Signed Softcopy &amp; Complete
                    </button>
                  )}
                </div>
              </div>

              {activeProposal.signedSoftcopy.mimeType === "application/pdf" ? (
                <iframe
                  title="Signed Softcopy PDF"
                  src={activeProposal.signedSoftcopy.dataUrl}
                  className="h-[650px] w-full rounded-xl border border-slate-200 bg-slate-100"
                />
              ) : (
                <img
                  src={activeProposal.signedSoftcopy.dataUrl}
                  alt="Signed Hardcopy Scan"
                  className="mx-auto max-h-[700px] rounded-xl border border-slate-200"
                />
              )}
            </div>
          )}
        </div>
      )}

            {/* ==================== SUB-TAB: ROUGH PRE-REQUESTS ==================== */}
      {subTab === "rough_requests" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">Pre-Proposal Rough Requests Queue</h2>
              <p className="text-xs text-slate-500">Rapid review of concept, date, and estimated budget before official notesheet compilation.</p>
            </div>
            <button
              type="button"
              onClick={fetchAll}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Dean Review Remarks / Note (Applied on action):</label>
            <input
              type="text"
              value={roughRemarks}
              onChange={(e) => setRoughRemarks(e.target.value)}
              placeholder="e.g. Approved. Dates verified with central auditorium schedule."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-500"
            />
          </div>

          {roughRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold text-xs">No rough requests submitted yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-black">
                    <th className="p-3">Event Name</th>
                    <th className="p-3">Society</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Rough Budget</th>
                    <th className="p-3">Lead Coordinator</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Dean Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roughRequests.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-900">{r.eventName}</td>
                      <td className="p-3">{r.society}</td>
                      <td className="p-3">{r.eventDate}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">Rs. {formatIndianCurrency(r.estimatedBudget || 0)}/-</td>
                      <td className="p-3">{r.studentName} ({r.position || "Lead"})</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            r.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.status === "DISAPPROVED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRoughRequestAction(r._id, "APPROVE")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRoughRequestAction(r._id, "DISAPPROVE")}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition cursor-pointer"
                          >
                            Disapprove
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRoughRequestAction(r._id, "WAITING")}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition cursor-pointer"
                          >
                            Waiting
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== SUB-TAB: BUDGET TABLE LEDGER ==================== */}
      {subTab === "budget_table" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">Event Budgets Ledger &amp; Allocation</h2>
              <p className="text-xs text-slate-500">Institutional tracking of sanctioned event budgets, revenue models, and expenditure breakdowns.</p>
            </div>
            <button
              type="button"
              onClick={fetchAll}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
            >
              Refresh Ledger
            </button>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <span className="block text-xs font-bold uppercase text-emerald-800">Total Sanctioned Budget</span>
              <span className="text-2xl font-black font-mono text-emerald-700">Rs. {formatIndianCurrency(totalSanctioned)}/-</span>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
              <span className="block text-xs font-bold uppercase text-indigo-800">Total Projected Revenue</span>
              <span className="text-2xl font-black font-mono text-indigo-700">Rs. {formatIndianCurrency(totalRevenue)}/-</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <span className="block text-xs font-bold uppercase text-slate-700">Tracked Budget Records</span>
              <span className="text-2xl font-black text-slate-800">{budgets.length} Events</span>
            </div>
          </div>

          {budgets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold text-xs">No event budgets recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-black">
                    <th className="p-3">Event Name</th>
                    <th className="p-3">Society</th>
                    <th className="p-3">Academic Year</th>
                    <th className="p-3">Budget Total</th>
                    <th className="p-3">Budget in Words</th>
                    <th className="p-3">Revenue Total</th>
                    <th className="p-3">Items Count</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {budgets.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-900">{b.eventName}</td>
                      <td className="p-3">{b.society}</td>
                      <td className="p-3 text-slate-500">{b.academicYear || "2025-2026"}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">Rs. {formatIndianCurrency(b.budgetTotal || 0)}/-</td>
                      <td className="p-3 text-[11px] text-slate-500 max-w-xs truncate">{b.budgetInWords}</td>
                      <td className="p-3 font-mono text-slate-700">Rs. {formatIndianCurrency(b.revenueTotal || 0)}/-</td>
                      <td className="p-3 font-bold text-slate-600">{b.itemsCount || 0}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px]">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== SUB-TAB: SOCIETY FILE VAULT ==================== */}
      {subTab === "society_files" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">Society-Wise Administrative File Storage</h2>
              <p className="text-xs text-slate-500">Access stage backdrops (12x8 ft), posters, signed MoUs, and society logos cataloged by society.</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700"
              >
                <option value="ALL">All File Types</option>
                <option value="BANNER">Banners (Stage 12x8, Gate 8x4)</option>
                <option value="POSTER">Posters (A3, A4, Digital)</option>
                <option value="MOU">Sponsor MoUs</option>
                <option value="SOCIETY_LOGO">Society Logos</option>
                <option value="SIGNED_COPY">Signed Copies</option>
              </select>

              <button
                type="button"
                onClick={fetchAll}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
              >
                Refresh
              </button>
            </div>
          </div>

          {societyFiles.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold text-xs">No files uploaded across societies yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {societyFiles
                .filter((f) => fileTypeFilter === "ALL" || f.fileType === fileTypeFilter)
                .map((file) => (
                  <div
                    key={file._id}
                    className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-white transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        {file.fileType}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {file.fileDimensions || file.mimeType}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-slate-900 truncate">{file.fileName}</h4>
                      <p className="text-xs text-slate-500">
                        <strong>Society:</strong> {file.society} &bull; {file.eventName || "General Asset"}
                      </p>
                    </div>

                    {file.dataUrl && file.dataUrl.startsWith("data:image") ? (
                      <img
                        src={file.dataUrl}
                        alt={file.fileName}
                        className="w-full h-32 object-contain bg-slate-100 rounded-xl border border-slate-200"
                      />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200 text-slate-400 text-xs font-bold">
                        Attached PDF / Document
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between text-xs">
                      <a
                        href={file.dataUrl}
                        download={file.fileName}
                        className="text-emerald-600 hover:text-emerald-800 font-bold hover:underline"
                      >
                        Download Asset
                      </a>
                      <span className="text-slate-400 text-[10px]">{file.uploadedByName}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== SUB-TAB 2: DEPARTMENT DIRECTORY MANAGER ==================== */}

      {/* ==================== SUB-TAB 2: DEPARTMENT DIRECTORY MANAGER ==================== */}
      {subTab === "directory" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Directory List */}
          <div className="space-y-3 lg:col-span-7">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Configured KIIT Departments &amp; Requirement Mappings
              </h3>
              <button
                type="button"
                onClick={async () => {
                  const res = await dispatchGateway(GATEWAY_OPCODES.SAVE_DEPARTMENT_CONFIG, {
                    mode: "RESET_DEFAULTS",
                  });
                  if (res.ok && res.data?.departments) {
                    setDepartments(res.data.departments);
                    setToast({
                      type: "success",
                      text: "Reset Department Directory to standard KIIT defaults.",
                    });
                  }
                }}
                className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-800"
              >
                Reset to Defaults
              </button>
            </div>

            {departments.map((d) => (
              <div
                key={d.categoryKey}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800">
                      Category Key: {d.categoryKey}
                    </span>
                    <h4 className="mt-1 text-sm font-black text-slate-900">{d.name}</h4>
                    <p className="text-xs font-semibold text-emerald-700">To: {d.primaryEmail}</p>
                    {Array.isArray(d.ccEmails) && d.ccEmails.length > 0 && (
                      <p className="text-[11px] text-slate-500">CC: {d.ccEmails.join(", ")}</p>
                    )}
                    {d.contactPerson && (
                      <p className="text-[11px] text-slate-600 font-medium">Attention: {d.contactPerson}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDeptForm({
                          categoryKey: d.categoryKey,
                          name: d.name,
                          primaryEmail: d.primaryEmail,
                          ccEmails: Array.isArray(d.ccEmails) ? d.ccEmails.join(", ") : "",
                          contactPerson: d.contactPerson || "",
                          defaultSubjectTemplate: d.defaultSubjectTemplate || "",
                          defaultHeaderNote: d.defaultHeaderNote || "",
                        })
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDepartment(d.categoryKey)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add / Edit Department Form */}
          <form
            onSubmit={handleSaveDepartment}
            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5"
          >
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
              Add / Update Department Mapping
            </h3>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Requirement Category Key (e.g. VENUE, TECHNICAL, FOOD, MARKETING, FINANCE)
              </label>
              <input
                type="text"
                required
                value={deptForm.categoryKey}
                onChange={(e) =>
                  setDeptForm({ ...deptForm, categoryKey: e.target.value.toUpperCase() })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Department Name *</label>
              <input
                type="text"
                required
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="e.g. Estate & Campus Venue Department"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Primary Department Email *
              </label>
              <input
                type="email"
                required
                value={deptForm.primaryEmail}
                onChange={(e) => setDeptForm({ ...deptForm, primaryEmail: e.target.value })}
                placeholder="e.g. estate.venues@kiit.ac.in"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                CC Emails (comma-separated)
              </label>
              <input
                type="text"
                value={deptForm.ccEmails}
                onChange={(e) => setDeptForm({ ...deptForm, ccEmails: e.target.value })}
                placeholder="ksac.office@kiit.ac.in, registrar@kiit.ac.in"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Recipient Title / Contact Person
              </label>
              <input
                type="text"
                value={deptForm.contactPerson}
                onChange={(e) => setDeptForm({ ...deptForm, contactPerson: e.target.value })}
                placeholder="e.g. Deputy Director (Estate)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Default Email Subject Template
              </label>
              <input
                type="text"
                value={deptForm.defaultSubjectTemplate}
                onChange={(e) =>
                  setDeptForm({ ...deptForm, defaultSubjectTemplate: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Default Opening Paragraph
              </label>
              <textarea
                rows={2}
                value={deptForm.defaultHeaderNote}
                onChange={(e) => setDeptForm({ ...deptForm, defaultHeaderNote: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>
            <button
              type="submit"
              disabled={savingDept}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition active:scale-95"
            >
              {savingDept ? "Saving..." : "💾 Save Department Configuration"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
