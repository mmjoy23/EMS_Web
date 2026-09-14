import { useState } from "react";
import { motion } from "motion/react";
import { Zap, AtSign, Lock, ArrowRight, Mail, CheckCircle, Tag } from "lucide-react";
import { toast } from "sonner";
import { Btn, InputField } from "@/components/shared";
import { useAuth } from "@/context/AuthContext";
import { homeScreen, type ScreenProps } from "@/lib/nav";
import type { Role } from "@/lib/types";

const DEMO_PASSWORD = "password123";
const DEMO_EMAIL: Record<Role, string> = {
  student: "student@uni.edu",
  organizer: "organizer@uni.edu",
  admin: "admin@uni.edu",
};

// ─── AuthCard ─────────────────────────────────────────────────────────────────
function AuthCard({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3"><Zap className="w-6 h-6" /></div>
          <h1 className="text-xl font-extrabold">{title}</h1>
          <p className="text-blue-100 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
}

// ─── Login ──────────────────────────────────────────────────────────────────
export function Login({ nav }: ScreenProps) {
  const { login } = useAuth();
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState(DEMO_EMAIL.student);
  const [pass, setPass] = useState(DEMO_PASSWORD);
  const [busy, setBusy] = useState(false);

  const pickRole = (r: Role) => {
    setRole(r);
    setEmail(DEMO_EMAIL[r]);
    setPass(DEMO_PASSWORD);
  };

  const signIn = async () => {
    setBusy(true);
    try {
      const user = await login(email.trim(), pass);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      nav(homeScreen(user.role));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Welcome Back" subtitle="Sign in to your UniEvents account">
      <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 mb-5">
        {(["student", "organizer", "admin"] as Role[]).map((r) => (
          <button key={r} onClick={() => pickRole(r)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${role === r ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            {r}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        <InputField label="Email Address" type="email" icon={AtSign} placeholder="your@university.edu" value={email} onChange={setEmail} />
        <InputField label="Password" type="password" icon={Lock} placeholder="••••••••" value={pass} onChange={setPass}
          extra={<button onClick={() => nav("forgot-password")} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">Forgot password?</button>}
        />
        <Btn variant="primary" className="w-full justify-center py-3" onClick={signIn} disabled={busy}>
          {busy ? "Signing in…" : "Sign In"} <ArrowRight className="w-4 h-4" />
        </Btn>
        <p className="text-center text-sm text-slate-500">New to UniEvents? <button onClick={() => nav("signup")} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Create Account</button></p>
      </div>
      <div className="mt-5 p-3 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-100 dark:border-blue-900">
        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium text-center">Demo accounts — pick a role above to autofill. Shared password: <span className="font-bold">{DEMO_PASSWORD}</span></p>
      </div>
    </AuthCard>
  );
}

// ─── Signup ─────────────────────────────────────────────────────────────────
const DEPARTMENTS = ["Computer Science", "Engineering", "Business", "Arts & Humanities", "Medicine", "Law"];

export function Signup({ nav }: ScreenProps) {
  const { register } = useAuth();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const name = `${first} ${last}`.trim();
    if (!name || !email.trim() || pass.length < 8) {
      toast.error("Enter your name, email, and a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const user = await register({
        name,
        email: email.trim(),
        password: pass,
        department,
        studentId: studentId.trim() || undefined,
      });
      toast.success("Account created — welcome to UniEvents!");
      nav(homeScreen(user.role));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Create Account" subtitle="Join thousands of students on UniEvents">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InputField label="First Name" placeholder="Alex" value={first} onChange={setFirst} />
          <InputField label="Last Name" placeholder="Johnson" value={last} onChange={setLast} />
        </div>
        <InputField label="Student ID" icon={Tag} placeholder="STU-2024-XXXX" value={studentId} onChange={setStudentId} />
        <InputField label="University Email" type="email" icon={AtSign} placeholder="alex@university.edu" value={email} onChange={setEmail} />
        <InputField label="Password" type="password" icon={Lock} placeholder="Min. 8 characters" value={pass} onChange={setPass} />
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Department</label>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <Btn variant="primary" className="w-full justify-center py-3" onClick={submit} disabled={busy}>
          {busy ? "Creating…" : "Create Account"} <ArrowRight className="w-4 h-4" />
        </Btn>
        <p className="text-center text-sm text-slate-500">Already have an account? <button onClick={() => nav("login")} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Sign In</button></p>
      </div>
    </AuthCard>
  );
}

// ─── ForgotPassword (visual — no reset backend) ───────────────────────────────
export function ForgotPassword({ nav }: ScreenProps) {
  const [sent, setSent] = useState(false);
  return (
    <AuthCard title="Reset Password" subtitle="We will send you a recovery link">
      {!sent ? (
        <div className="space-y-4">
          <div className="text-center py-4"><div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto mb-3"><Mail className="w-8 h-8 text-blue-600" /></div><p className="text-sm text-slate-500 dark:text-slate-400">Enter your university email and we will send password reset instructions.</p></div>
          <InputField label="University Email" type="email" icon={AtSign} placeholder="alex@university.edu" />
          <Btn variant="primary" className="w-full justify-center py-3" onClick={() => setSent(true)}>Send Reset Link <ArrowRight className="w-4 h-4" /></Btn>
          <button onClick={() => nav("login")} className="w-full text-center text-sm text-slate-500 hover:text-blue-600 transition-colors">Back to Sign In</button>
        </div>
      ) : (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto"><CheckCircle className="w-8 h-8 text-emerald-600" /></div>
          <div><h3 className="font-bold text-slate-900 dark:text-white">Email Sent!</h3><p className="text-sm text-slate-500 mt-1">Check your inbox for the password reset link. It expires in 30 minutes.</p></div>
          <Btn variant="primary" className="w-full justify-center py-3" onClick={() => nav("login")}>Back to Sign In</Btn>
        </div>
      )}
    </AuthCard>
  );
}

// ─── VerifyEmail (visual) ─────────────────────────────────────────────────────
export function VerifyEmail({ nav }: ScreenProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  return (
    <AuthCard title="Verify Your Email" subtitle="Enter the 6-digit code we sent to your inbox">
      <div className="space-y-5">
        <div className="flex justify-center gap-2">
          {code.map((v, i) => (
            <input key={i} maxLength={1} value={v} onChange={(e) => { const n = [...code]; n[i] = e.target.value; setCode(n); }}
              className="w-12 h-14 text-center text-xl font-bold bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all" />
          ))}
        </div>
        <Btn variant="primary" className="w-full justify-center py-3" onClick={() => nav("login")}>Verify Email <CheckCircle className="w-4 h-4" /></Btn>
        <div className="text-center"><p className="text-sm text-slate-500">Did not receive the code?</p><button className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-1">Resend Code</button></div>
      </div>
    </AuthCard>
  );
}
