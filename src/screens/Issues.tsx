import { useEffect, useState } from "react";
import { AlertTriangle, Eye, Gavel, X } from "lucide-react";
import { toast } from "sonner";
import { BackBtn, Badge, Btn, EmptyState, Loading } from "@/components/shared";
import { api } from "@/lib/api";
import { useMyRegistrations } from "@/hooks";
import { useAuth } from "@/context/AuthContext";
import type { ComplaintEntry, FineEntry } from "@/lib/types";
import type { ScreenProps } from "@/lib/nav";

export function Issues({ nav }: ScreenProps) {
  const { role } = useAuth();
  const { registrations } = useMyRegistrations();
  const [complaints, setComplaints] = useState<ComplaintEntry[]>([]);
  const [fines, setFines] = useState<FineEntry[]>([]);
  const [eventId, setEventId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [evidencePath, setEvidencePath] = useState("");
  const [category, setCategory] = useState("venue_problem");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<ComplaintEntry | null>(null);
  const [summary, setSummary] = useState({
    total: 0,
    underReview: 0,
    resolved: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [complaintResult, fineResult] = await Promise.all([
        role === "organizer"
          ? api.admin.managedComplaints()
          : api.complaints.mine(),
        role === "organizer"
          ? api.admin.fines()
          : Promise.resolve({ fines: [] as FineEntry[] }),
      ]);
      setComplaints(complaintResult.complaints);
      if ("summary" in complaintResult) setSummary(complaintResult.summary);
      setFines(fineResult.fines);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load issues",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async () => {
    if (!eventId || !subject.trim() || !description.trim()) {
      toast.error("Choose an event and complete the complaint details");
      return;
    }
    setSubmitting(true);
    try {
      await api.complaints.create(
        eventId,
        category,
        subject.trim(),
        description.trim(),
        evidencePath || undefined,
      );
      setSubject("");
      setDescription("");
      setEvidencePath("");
      setShowForm(false);
      toast.success("Complaint submitted");
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit complaint",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <BackBtn
        onClick={() =>
          nav(
            role === "organizer" ? "organizer-dashboard" : "student-dashboard",
          )
        }
        label="Dashboard"
      />
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Complaints & Fines
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {role === "organizer"
            ? "Review complaint outcomes and fines associated with your events."
            : "Report an issue or review your complaint outcomes."}
        </p>
      </div>
      {role === "student" && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Total Complaints", summary.total, "blue"],
              ["Under Review", summary.underReview, "amber"],
              ["Resolved", summary.resolved, "green"],
            ].map(([label, value, color]) => (
              <div
                key={String(label)}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4"
              >
                <p
                  className={`text-2xl font-extrabold ${
                    color === "blue"
                      ? "text-blue-600"
                      : color === "amber"
                        ? "text-amber-600"
                        : "text-emerald-600"
                  }`}
                >
                  {value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
          {showForm && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Submit a complaint
              </h3>
              <select
                value={eventId}
                onChange={(event) => setEventId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3 text-sm"
              >
                <option value="">Select a registered event</option>
                {registrations
                  .filter(
                    (registration) =>
                      registration.status === "registered" &&
                      registration.event,
                  )
                  .map((registration) => (
                    <option
                      key={registration.event!.id}
                      value={registration.event!.id}
                    >
                      {registration.event!.title}
                    </option>
                  ))}
              </select>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3 text-sm"
              >
                <option value="event_cancelled">
                  Event Cancelled Without Notice
                </option>
                <option value="misleading_information">
                  Misleading Event Information
                </option>
                <option value="organizer_misconduct">
                  Organizer Misconduct
                </option>
                <option value="venue_problem">Venue or Location Problem</option>
                <option value="registration_problem">
                  Registration or Entry Problem
                </option>
                <option value="poor_management">Poor Event Management</option>
                <option value="payment_issue">Payment-Related Issue</option>
                <option value="other">Other</option>
              </select>
              {/* Subject and description remain unchanged below. */}
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Subject or category"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3 text-sm"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Describe what happened"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3 text-sm"
              />
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Supporting evidence (optional)
                <input
                  type="file"
                  accept="image/*,.pdf,.txt"
                  className="mt-1 block w-full text-sm font-normal"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      toast.error("Evidence must be smaller than 2MB");
                      event.currentTarget.value = "";
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () =>
                      setEvidencePath(String(reader.result));
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              <Btn disabled={submitting} onClick={() => void submit()}>
                {submitting ? "Submitting…" : "Submit complaint"}
              </Btn>
            </div>
          )}
        </>
      )}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 dark:text-white">
            My complaints
          </h3>
          {role === "student" && (
            <Btn size="sm" onClick={() => setShowForm((open) => !open)}>
              <AlertTriangle className="w-4 h-4" />
              {showForm ? "Close form" : "Submit New Complaint"}
            </Btn>
          )}
        </div>
        {complaints.length === 0 ? (
          <EmptyState
            title="No complaints submitted"
            subtitle="Your complaint history will appear here."
          />
        ) : (
          complaints.map((complaint) => (
            <div
              key={complaint.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {complaint.subject}
                  </p>
                  <p className="text-xs text-slate-500">
                    {complaint.event?.title}
                  </p>
                </div>
                <Badge
                  color={
                    complaint.status === "resolved"
                      ? "green"
                      : complaint.status === "dismissed"
                        ? "slate"
                        : "amber"
                  }
                >
                  {complaint.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                {complaint.description}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </span>
                <Btn
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    void api.complaints
                      .get(complaint.id)
                      .then(({ complaint: details }) => setSelected(details))
                      .catch(() =>
                        toast.error("Could not load complaint details"),
                      )
                  }
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </Btn>
              </div>
            </div>
          ))
        )}
      </div>
      {fines.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Gavel className="w-4 h-4" />
            Fines issued against you
          </h3>
          {fines.map((fine) => (
            <div
              key={fine.id}
              className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900 p-4 flex justify-between"
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  {fine.event?.title}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {fine.reason}
                </p>
              </div>
              <div className="text-right">
                <p className="font-extrabold">{fine.amount}</p>
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
              </div>
            </div>
          ))}
        </div>
      )}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 p-4 flex items-center justify-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl p-5 space-y-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Complaint Details
              </h3>
              <button onClick={() => setSelected(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <Badge
              color={
                selected.status === "resolved"
                  ? "green"
                  : selected.status === "dismissed"
                    ? "red"
                    : selected.status === "under_review"
                      ? "amber"
                      : "blue"
              }
            >
              {selected.status.replace("_", " ")}
            </Badge>
            <p className="text-sm text-slate-500">ID: {selected.id}</p>
            <p>
              <strong>Event:</strong> {selected.event?.title}
            </p>
            <p>
              <strong>Category:</strong>{" "}
              {selected.category.replaceAll("_", " ")}
            </p>
            <p>
              <strong>Subject:</strong> {selected.subject}
            </p>
            <p className="whitespace-pre-wrap text-sm">
              {selected.description}
            </p>
            <p className="text-sm text-slate-500">
              Submitted: {new Date(selected.createdAt).toLocaleString()}
            </p>
            {selected.adminNote && (
              <p className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-3 text-sm">
                Admin response: {selected.adminNote}
              </p>
            )}
            {selected.fineOutcome && (
              <p className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-sm">
                {selected.fineOutcome}
              </p>
            )}
            {selected.evidencePath && (
              <a
                className="text-sm text-blue-600 underline"
                href={selected.evidencePath}
                target="_blank"
                rel="noreferrer"
              >
                Open submitted evidence
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
