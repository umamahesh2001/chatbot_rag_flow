"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { registerUser, clearError, setError } from "@/store/authSlice";

function IconBolt({ size = 24 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" /></svg>);
}
function IconEye({ size = 18 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>);
}
function IconEyeOff({ size = 18 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>);
}
function IconCheck({ size = 14 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>);
}

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { error, isLoading } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);

  const passwordChecks = {
    length: form.password.length >= 6,
    match: form.password && form.confirmPassword && form.password === form.confirmPassword,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    if (form.password !== form.confirmPassword) {
      dispatch(setError("Passwords do not match"));
      return;
    }
    const result = await dispatch(registerUser({ name: form.name, email: form.email, password: form.password }));
    if (registerUser.fulfilled.match(result)) {
      router.push("/verify-otp");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-flash to-turbo speed-shadow-lg mb-4">
            <IconBolt size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ghost">Create your account</h1>
          <p className="text-muted text-sm mt-1">Join Connect Fast in seconds</p>
        </div>
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 speed-shadow-lg space-y-5">
          {error && <div className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm animate-fade-in-up">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-void/80 border border-flash/10 text-ghost placeholder-muted/50 focus:outline-none focus:border-flash/30 focus:ring-1 focus:ring-flash/20 transition-all text-sm"
              placeholder="Your name" required minLength={2} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-void/80 border border-flash/10 text-ghost placeholder-muted/50 focus:outline-none focus:border-flash/30 focus:ring-1 focus:ring-flash/20 transition-all text-sm"
              placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 pr-11 rounded-xl bg-void/80 border border-flash/10 text-ghost placeholder-muted/50 focus:outline-none focus:border-flash/30 focus:ring-1 focus:ring-flash/20 transition-all text-sm"
                placeholder="Min. 6 characters" required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-silver transition-colors">
                {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-2">Confirm Password</label>
            <input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-void/80 border border-flash/10 text-ghost placeholder-muted/50 focus:outline-none focus:border-flash/30 focus:ring-1 focus:ring-flash/20 transition-all text-sm"
              placeholder="Re-enter password" required />
          </div>
          {form.password && (
            <div className="space-y-1.5 animate-fade-in-up">
              <div className={`flex items-center gap-2 text-xs ${passwordChecks.length ? "text-success" : "text-muted"}`}><IconCheck size={12} />At least 6 characters</div>
              {form.confirmPassword && <div className={`flex items-center gap-2 text-xs ${passwordChecks.match ? "text-success" : "text-danger"}`}><IconCheck size={12} />Passwords match</div>}
            </div>
          )}
          <button type="submit" disabled={isLoading || !passwordChecks.length}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-flash to-turbo text-white font-semibold text-sm hover:shadow-lg hover:shadow-flash/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</span> : "Create Account"}
          </button>
          <p className="text-center text-sm text-muted">Already have an account?{" "}<Link href="/login" className="text-flash hover:text-bolt transition-colors font-medium">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
