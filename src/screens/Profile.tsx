import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Mail,
  Phone,
  Check,
  Edit,
  Ticket,
  CheckCircle,
  Calendar,
  Lock,
  LogOut,
  Sun,
  Moon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Btn, StatCard, InputField, BackBtn, cn } from "@/components/shared";
import { useAuth } from "@/context/AuthContext";
import { useMyRegistrations } from "@/hooks";
import { initials, isUpcoming } from "@/lib/format";
import { homeScreen, type ScreenProps } from "@/lib/nav";

export function Profile({ nav, isDark, setIsDark }: ScreenProps) {
  const { user, logout } = useAuth();
  const { registrations } = useMyRegistrations();

  const role = user?.role;

  const [editing, setEditing] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [pwFields, setPwFields] = useState({ current: "", next: "", confirm: "" });

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+1 (555) 0123");

  useEffect(() => {
    if (!user) return;
    const parts = user.name.trim().split(/\s+/);
    setFirst(parts[0] ?? "");
    setLast(parts.slice(1).join(" "));
    setStudentId(user.studentId ?? "");
    setDepartment(user.department ?? "");
    setEmail(user.email);
  }, [user]);

  const [prefs, setPrefs] = useState([
    { label: "Registration Confirmation Emails", on: true },
    { label: "Event Reminder Emails", on: true },
    { label: "Feedback Request Emails", on: true },
    { label: "Event Cancellation Notifications", on: false },
    { label: "New Event Announcements", on: false },
  ]);

  const togglePref = (i: number) => {
    setPrefs((p) => p.map((item, idx) => (idx === i ? { ...item, on: !item.on } : item)));
    toast.success("Preference updated");
  };

  const onEditSave = () => {
    if (editing) {
      toast.success("Saved (demo — not persisted)");
      setEditing(false);
    } else {
      setEditing(true);
    }
  };

  const handleUpdatePw = () => {
    toast.success("Password updated (demo — not persisted)");
    setShowChangePw(false);
    setPwFields({ current: "", next: "", confirm: "" });
  };

  const handleSignOut = async () => {
    try {
      await logout();
      nav("landing");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sign out");
    }
  };

  const totalCount = registrations.length;
  const upcomingCount = registrations.filter((r) => r.event && isUpcoming(r.event.startsAt)).length;
  const attendedCount = registrations.filter((r) => r.checkedIn).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <BackBtn onClick={() => nav(user ? homeScreen(user.role) : "landing")} label="Dashboard" />
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className={cn("w-20 h-20 rounded-2xl border-4 border-white dark:border-slate-800 flex items-center justify-center text-xl font-extrabold shadow-lg",
              role === "student" ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300" :
              role === "organizer" ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300" :
              "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            )}>
              {initials(user?.name ?? "")}
            </div>
            <Btn variant={editing ? "success" : "outline"} size="sm" onClick={onEditSave}>{editing ? <><Check className="w-4 h-4" />Save Changes</> : <><Edit className="w-4 h-4" />Edit Profile</>}</Btn>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {user?.name}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm capitalize">
            {user?.department ?? "No department"} · {user?.role}
          </p>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1.5 text-slate-500"><Mail className="w-4 h-4 text-blue-500" />
              {user?.email}
            </span>
            <span className="flex items-center gap-1.5 text-slate-500"><Phone className="w-4 h-4 text-blue-500" />+1 (555) 0123</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Ticket} label="Events Registered" value={String(totalCount)} color="blue" />
        <StatCard icon={CheckCircle} label="Events Attended" value={String(attendedCount)} color="green" />
        <StatCard icon={Calendar} label="Upcoming Events" value={String(upcomingCount)} color="amber" />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="First Name" value={first} onChange={setFirst} />
          <InputField label="Last Name" value={last} onChange={setLast} />
          <InputField label="Student ID" value={studentId} onChange={setStudentId} />
          <InputField label="Email" icon={Mail} value={email} onChange={setEmail} />
          <InputField label="Department" value={department} onChange={setDepartment} />
          <InputField label="Phone" icon={Phone} value={phone} onChange={setPhone} />
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Notification Preferences</h4>
          {prefs.map((pref, i) => (
            <div key={pref.label} className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">{pref.label}</span>
              <button
                onClick={() => togglePref(i)}
                className={cn("w-10 h-5 rounded-full relative transition-colors duration-300 focus:outline-none", pref.on ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700")}
                aria-pressed={pref.on}
              >
                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform duration-300", pref.on ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <h3 className="font-bold text-slate-900 dark:text-white mb-3">Security</h3>
        <div className="space-y-2">
          <Btn variant="outline" className="w-full justify-start" onClick={() => setShowChangePw(true)}><Lock className="w-4 h-4" />Change Password</Btn>
          <Btn variant="outline" className="w-full justify-start text-red-600 border-red-100 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => setShowSignOut(true)}><LogOut className="w-4 h-4" />Sign Out All Devices</Btn>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <h3 className="font-bold text-slate-900 dark:text-white mb-3">Appearance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div key={isDark ? "sun" : "moon"} initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3, ease: [0, 0, 0.58, 1] }}>
              {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-500" />}
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Dark Mode</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{isDark ? "Using dark theme" : "Using light theme"}</p>
            </div>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className={cn("w-10 h-5 rounded-full relative transition-colors duration-300 focus:outline-none", isDark ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700")}
            aria-pressed={isDark}
          >
            <div className={cn("w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform duration-300", isDark ? "translate-x-5" : "translate-x-0.5")} />
          </button>
        </div>
      </div>

      {/* Change Password modal */}
      {showChangePw && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{ animation: "fadeIn 300ms cubic-bezier(0,0,0.58,1) forwards" }}
          onClick={() => { setShowChangePw(false); setPwFields({ current: "", next: "", confirm: "" }); }}>
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            style={{ animation: "slideUp 300ms cubic-bezier(0,0,0.58,1) forwards" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Change Password</h3>
              <button onClick={() => { setShowChangePw(false); setPwFields({ current: "", next: "", confirm: "" }); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              {[
                { label: "Current Password", key: "current" as const },
                { label: "New Password", key: "next" as const },
                { label: "Confirm New Password", key: "confirm" as const },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{f.label}</label>
                  <input type="password" value={pwFields[f.key]}
                    onChange={(e) => setPwFields((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Btn variant="outline" className="flex-1 justify-center" onClick={() => { setShowChangePw(false); setPwFields({ current: "", next: "", confirm: "" }); }}>Cancel</Btn>
              <Btn variant="primary" className="flex-1 justify-center" onClick={handleUpdatePw}>Update Password</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out All Devices dialog */}
      {showSignOut && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{ animation: "fadeIn 300ms cubic-bezier(0,0,0.58,1) forwards" }}
          onClick={() => setShowSignOut(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            style={{ animation: "slideUp 300ms cubic-bezier(0,0,0.58,1) forwards" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Sign Out All Devices</h3>
              <button onClick={() => setShowSignOut(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Are you sure you want to sign out from all devices? You will need to sign in again on each device.</p>
            <div className="flex gap-3">
              <Btn variant="outline" className="flex-1 justify-center" onClick={() => setShowSignOut(false)}>Cancel</Btn>
              <Btn variant="outline" className="flex-1 justify-center text-red-600 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />Sign Out
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
