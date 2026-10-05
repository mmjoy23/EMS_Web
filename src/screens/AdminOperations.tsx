import { useEffect, useState } from "react";
import { Check, FileText, Gavel, X } from "lucide-react";
import { toast } from "sonner";
import { BackBtn, Badge, Btn, EmptyState, Loading } from "@/components/shared";
import { api } from "@/lib/api";
import type { ComplaintEntry, EventDTO, FineEntry } from "@/lib/types";
import type { ScreenProps } from "@/lib/nav";

const tabs = ["requests", "complaints", "fines"] as const;
type Tab = (typeof tabs)[number];
const requestStatuses = ["all", "pending", "accepted", "rejected"] as const;
type RequestStatus = (typeof requestStatuses)[number];

function eventMeta(event: EventDTO) {
  return `${new Date(event.startsAt).toLocaleString()} · ${event.location}`;
}

export function AdminOperations({ nav }: ScreenProps) {
  const [tab, setTab] = useState<Tab>("requests");
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("pending");
  const [requests, setRequests] = useState<EventDTO[]>([]);
  const [complaints, setComplaints] = useState<ComplaintEntry[]>([]);
  const [fines, setFines] = useState<FineEntry[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EventDTO | null>(null);
  const [selectedComplaint, setSelectedComplaint] =
    useState<ComplaintEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [fineAmount, setFineAmount] = useState("");
  const [fineReason, setFineReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [requestResult, complaintResult, fineResult] = await Promise.all([
        api.admin.eventRequests(requestStatus),
        api.admin.complaints("all"),
        api.admin.fines(),
      ]);
      setRequests(requestResult.requests);
      setComplaints(complaintResult.complaints);
      setFines(fineResult.fines);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load admin operations",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [requestStatus]);

  const decide = async (decision: "accepted" | "rejected") => {
    if (!selectedRequest) return;
    const reason =
      decision === "rejected"
        ? (window.prompt("Rejection reason")?.trim() ?? "")
        : "";
    if (decision === "rejected" && !reason) return;
    setBusy(true);
    try {
      await api.admin.decideEventRequest(selectedRequest.id, decision, reason);
      toast.success(
        decision === "accepted"
          ? "Event request accepted"
          : "Event request rejected",
      );
      setSelectedRequest(null);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not review request",
      );
    } finally {
      setBusy(false);
    }
  };

  const updateComplaint = async (status: ComplaintEntry["status"]) => {
    if (!selectedComplaint) return;
    setBusy(true);
    try {
      const result = await api.admin.updateComplaint(
        selectedComplaint.id,
        status,
        note,
      );
      setSelectedComplaint(result.complaint);
      setComplaints((current) =>
        current.map((item) =>
          item.id === result.complaint.id ? result.complaint : item,
        ),
      );
      toast.success("Complaint updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update complaint",
      );
    } finally {
      setBusy(false);
    }
  };

  const issueFine = async () => {
    if (!selectedComplaint) return;
    const amount = Number(fineAmount);
    if (!Number.isInteger(amount) || amount <= 0 || !fineReason.trim()) {
      toast.error("Enter a positive whole amount and a reason");
      return;
    }
    setBusy(true);
    try {
      await api.admin.createFine(
        selectedComplaint.id,
        amount,
        fineReason.trim(),
      );
      toast.success("Fine issued");
      setFineAmount("");
      setFineReason("");
      await load();
      const refreshed = (await api.admin.complaints("all")).complaints.find(
        (item) => item.id === selectedComplaint.id,
      );
      setSelectedComplaint(refreshed ?? null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not issue fine",
      );
    } finally {
      setBusy(false);
    }
  };

  const updateFine = async (id: string, status: FineEntry["status"]) => {
    setBusy(true);
    try {
      const result = await api.admin.updateFine(id, status);
      setFines((current) =>
        current.map((fine) =>
          fine.id === result.fine.id ? result.fine : fine,
        ),
      );
      toast.success(`Fine marked ${status}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update fine",
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-5">
      <BackBtn onClick={() => nav("landing")} label="Admin Console" />
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Admin Operations
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review event requests, complaints, and creator fines.
          </p>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize ${tab === item ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {tab === "requests" && (
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
          <div className="space-y-3">
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              {requestStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setRequestStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${requestStatus === status ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"}`}
                >
                  {status}
                </button>
              ))}
            </div>
            {requests.length === 0 ? (
              <EmptyState
                title="No event requests"
                subtitle="Submitted organizer requests will appear here."
              />
            ) : (
              requests.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedRequest(event)}
                  className="w-full text-left bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {event.title}
                    </p>
                    <Badge
                      color={
                        event.approvalStatus === "accepted"
                          ? "green"
                          : event.approvalStatus === "rejected"
                            ? "red"
                            : "amber"
                      }
                    >
                      {event.approvalStatus ?? "pending"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {event.host?.name ?? "Unknown organizer"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {eventMeta(event)}
                  </p>
                </button>
              ))
            )}
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
            {!selectedRequest ? (
              <EmptyState
                title="Select a request"
                subtitle="Open an event request to review its details."
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {selectedRequest.title}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedRequest.host?.name} ·{" "}
                      {selectedRequest.host?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="p-2 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {selectedRequest.coverImage && (
                  <img
                    src={selectedRequest.coverImage}
                    alt="Event banner"
                    className="w-full h-36 object-cover rounded-xl"
                  />
                )}
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <p>
                    <strong>Category:</strong> {selectedRequest.category?.name}
                  </p>
                  <p>
                    <strong>Capacity:</strong> {selectedRequest.seatLimit}
                  </p>
                  <p>
                    <strong>When:</strong> {eventMeta(selectedRequest)}
                  </p>
                  <p>
                    <strong>Registration deadline:</strong>{" "}
                    {selectedRequest.registrationDeadline
                      ? new Date(
                          selectedRequest.registrationDeadline,
                        ).toLocaleString()
                      : "None"}
                  </p>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {selectedRequest.description}
                </p>
                {selectedRequest.rejectionReason && (
                  <p className="text-sm text-red-600">
                    Previous rejection: {selectedRequest.rejectionReason}
                  </p>
                )}
                {selectedRequest.approvalStatus === "pending" && (
                  <div className="flex gap-2">
                    <Btn
                      onClick={() => void decide("accepted")}
                      disabled={busy}
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </Btn>
                    <Btn
                      variant="outline"
                      onClick={() => void decide("rejected")}
                      disabled={busy}
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </Btn>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "complaints" && (
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
          <div className="space-y-3">
            {complaints.length === 0 ? (
              <EmptyState
                title="No complaints"
                subtitle="Participant complaints will appear here."
              />
            ) : (
              complaints.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedComplaint(item);
                    setNote(item.adminNote ?? "");
                  }}
                  className="w-full text-left bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4"
                >
                  <div className="flex justify-between gap-2">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {item.subject}
                    </p>
                    <Badge
                      color={
                        item.status === "resolved"
                          ? "green"
                          : item.status === "dismissed"
                            ? "slate"
                            : "amber"
                      }
                    >
                      {item.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.event?.title} · {item.participant?.name}
                  </p>
                </button>
              ))
            )}
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
            {!selectedComplaint ? (
              <EmptyState
                title="Select a complaint"
                subtitle="Review the participant's report and record an outcome."
              />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {selectedComplaint.subject}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedComplaint.event?.title} ·{" "}
                      {selectedComplaint.participant?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="p-2 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {selectedComplaint.description}
                </p>
                {selectedComplaint.evidencePath && (
                  <a
                    className="text-sm text-blue-600 underline"
                    href={selectedComplaint.evidencePath}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open supporting evidence
                  </a>
                )}
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="Investigation note or decision"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3 text-sm"
                />
                <div className="flex gap-2 flex-wrap">
                  <Btn
                    size="sm"
                    onClick={() => void updateComplaint("under_review")}
                    disabled={busy}
                  >
                    Under review
                  </Btn>
                  <Btn
                    size="sm"
                    variant="success"
                    onClick={() => void updateComplaint("resolved")}
                    disabled={busy}
                  >
                    Resolve
                  </Btn>
                  <Btn
                    size="sm"
                    variant="outline"
                    onClick={() => void updateComplaint("dismissed")}
                    disabled={busy}
                  >
                    Dismiss
                  </Btn>
                </div>
                {selectedComplaint.status === "resolved" &&
                  !selectedComplaint.fine && (
                    <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-2">
                      <p className="font-bold text-slate-900 dark:text-white">
                        Issue creator fine
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={fineAmount}
                          onChange={(event) =>
                            setFineAmount(event.target.value)
                          }
                          type="number"
                          min="1"
                          placeholder="Amount"
                          className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-2.5 text-sm"
                        />
                        <input
                          value={fineReason}
                          onChange={(event) =>
                            setFineReason(event.target.value)
                          }
                          placeholder="Reason"
                          className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-2.5 text-sm"
                        />
                      </div>
                      <Btn
                        size="sm"
                        onClick={() => void issueFine()}
                        disabled={busy}
                      >
                        <Gavel className="w-4 h-4" />
                        Issue fine
                      </Btn>
                    </div>
                  )}
                {selectedComplaint.fine && (
                  <p className="text-sm text-amber-700">
                    Fine: {selectedComplaint.fine.amount} ·{" "}
                    {selectedComplaint.fine.reason}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "fines" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Fine history
            </h3>
          </div>
          {fines.length === 0 ? (
            <EmptyState
              title="No fines issued"
              subtitle="Fines issued after complaint review will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {fines.map((fine) => (
                <div
                  key={fine.id}
                  className="p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {fine.event?.title}
                    </p>
                    <p className="text-sm text-slate-500">
                      {fine.eventCreator?.name} · {fine.reason}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {fine.amount}
                    </p>
                    <Badge
                      color={
                        fine.status === "waived"
                          ? "slate"
                          : fine.status === "paid"
                            ? "green"
                            : "amber"
                      }
                    >
                      {fine.status}
                    </Badge>
                    <div className="flex gap-1 mt-2 justify-end">
                      {fine.status === "issued" && (
                        <>
                          <Btn
                            size="xs"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void updateFine(fine.id, "paid")}
                          >
                            Mark paid
                          </Btn>
                          <Btn
                            size="xs"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void updateFine(fine.id, "waived")}
                          >
                            Waive
                          </Btn>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="hidden">
        <FileText />
      </div>
    </div>
  );
}
