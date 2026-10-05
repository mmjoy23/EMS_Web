import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle, ScanLine, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";
import {
  BackBtn,
  Badge,
  Btn,
  EmptyState,
  Loading,
  StatCard,
} from "@/components/shared";
import { useEvents, useParticipants } from "@/hooks";
import { api } from "@/lib/api";
import type { CheckinResponse } from "@/lib/types";
import type { ScreenProps } from "@/lib/nav";

export function OrganizerQrAttendance({ nav }: ScreenProps) {
  const { events, loading: eventsLoading } = useEvents({ mine: true });
  const [eventId, setEventId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CheckinResponse | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const activeEventId = eventId || events[0]?.id || "";
  const {
    participants,
    loading: participantsLoading,
    refetch,
  } = useParticipants(activeEventId);
  const checkedIn = participants.filter((participant) => participant.checkedIn);

  useEffect(() => {
    if (!eventId && events[0]) setEventId(events[0].id);
  }, [eventId, events]);

  useEffect(
    () => () => {
      void stopScanner();
    },
    [],
  );

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      await scanner.stop();
      scanner.clear();
    } catch {
      // The camera may already have stopped after a successful decode.
    }
    setScanning(false);
  };

  const handleCode = async (code: string) => {
    if (!activeEventId || !code.trim()) return;
    await stopScanner();
    try {
      const response = await api.checkin(code.trim(), activeEventId);
      setResult(response);
      if (response.result === "success") {
        toast.success("Participant checked in");
        await refetch();
      } else if (response.result === "already_checked_in") {
        toast.message("Already checked in");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not process QR code",
      );
    }
  };

  const startScanner = async () => {
    if (!activeEventId) return;
    setResult(null);
    const scanner = new Html5Qrcode("organizer-qr-reader");
    scannerRef.current = scanner;
    setScanning(true);
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          void handleCode(decodedText);
        },
        () => undefined,
      );
    } catch (error) {
      await stopScanner();
      toast.error(
        error instanceof Error
          ? error.message
          : "Camera access was unavailable",
      );
    }
  };

  if (eventsLoading) return <Loading />;
  if (!events.length)
    return (
      <EmptyState
        title="No assigned events"
        subtitle="You can scan registrations only for events you manage."
      />
    );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <BackBtn
        onClick={() => nav("organizer-dashboard")}
        label="Organizer Hub"
      />
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          QR Attendance
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Scan registration passes for an assigned event.
        </p>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
          Assigned event
        </label>
        <select
          value={activeEventId}
          onChange={(event) => {
            void stopScanner();
            setEventId(event.target.value);
            setResult(null);
          }}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3 text-sm text-slate-900 dark:text-white"
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Users}
          label="Registered"
          value={String(participants.length)}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Checked In"
          value={String(checkedIn.length)}
          color="green"
        />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4">
        <div
          id="organizer-qr-reader"
          className="overflow-hidden rounded-xl bg-slate-950 min-h-16"
        />
        {!scanning ? (
          <Btn
            onClick={() => void startScanner()}
            className="w-full justify-center"
          >
            <Camera className="w-4 h-4" />
            Open camera scanner
          </Btn>
        ) : (
          <Btn
            variant="outline"
            onClick={() => void stopScanner()}
            className="w-full justify-center"
          >
            <ScanLine className="w-4 h-4" />
            Stop scanner
          </Btn>
        )}
        <div className="flex gap-2">
          <input
            id="organizer-ticket-code"
            placeholder="Or enter ticket code"
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3 text-sm"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleCode(event.currentTarget.value);
                event.currentTarget.value = "";
              }
            }}
          />
          <Btn
            variant="outline"
            onClick={() => {
              const input = document.getElementById(
                "organizer-ticket-code",
              ) as HTMLInputElement | null;
              if (input) {
                void handleCode(input.value);
                input.value = "";
              }
            }}
          >
            Check
          </Btn>
        </div>
        {result && (
          <div
            className={`flex gap-3 items-start rounded-xl p-4 ${result.result === "success" ? "bg-emerald-50 text-emerald-800" : result.result === "already_checked_in" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-800"}`}
          >
            {result.result === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <div>
              <p className="font-bold">
                {result.result === "already_checked_in"
                  ? "Already Checked In"
                  : result.message}
              </p>
              {result.attendee && (
                <p className="text-sm">
                  {result.attendee.name} · {result.attendee.email}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-5 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Attendance list
          </h3>
          <Badge color="green">{checkedIn.length} checked in</Badge>
        </div>
        {participantsLoading ? (
          <Loading />
        ) : checkedIn.length === 0 ? (
          <EmptyState
            title="No check-ins yet"
            subtitle="Successful scans will appear here."
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {checkedIn.map((participant) => (
              <div
                key={participant.id}
                className="p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {participant.user.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {participant.user.email}
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  {participant.checkedInAt
                    ? new Date(participant.checkedInAt).toLocaleTimeString()
                    : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
