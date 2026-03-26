"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { verifyOTP, resendOTP, clearError } from "@/store/authSlice";

function IconBolt({ size = 24 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" /></svg>);
}
function IconMail({ size = 40 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 4l-10 8L2 4" /></svg>);
}

export default function VerifyOtpPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { pendingEmail, error, isLoading } = useSelector((state) => state.auth);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const inputRefs = useRef([]);

  useEffect(() => { if (!pendingEmail) router.push("/register"); }, [pendingEmail, router]);
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    dispatch(clearError());
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return;
    dispatch(clearError());
    const result = await dispatch(verifyOTP({ email: pendingEmail, otp: code }));
    if (verifyOTP.fulfilled.match(result)) router.push("/");
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendMessage("");
    dispatch(clearError());
    const result = await dispatch(resendOTP({ email: pendingEmail }));
    if (resendOTP.fulfilled.match(result)) {
      setResendCooldown(60);
      setResendMessage("A new code has been sent to your email.");
    } else if (result.payload?.retryAfter) {
      setResendCooldown(result.payload.retryAfter);
    }
  };

  if (!pendingEmail) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-flash to-turbo speed-shadow-lg mb-4"><IconBolt size={28} className="text-white" /></div>
          <h1 className="text-2xl font-bold text-ghost">Check your email</h1>
          <p className="text-muted text-sm mt-1">We sent a 6-digit code to</p>
          <p className="text-flash text-sm font-medium mt-0.5">{pendingEmail}</p>
        </div>
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 speed-shadow-lg space-y-6">
          <div className="flex justify-center"><div className="w-20 h-20 rounded-2xl bg-flash/8 border border-flash/15 flex items-center justify-center"><IconMail size={36} className="text-flash" /></div></div>
          {error && <div className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm animate-fade-in-up text-center">{error}</div>}
          {resendMessage && <div className="px-4 py-3 rounded-xl bg-success/10 border border-success/20 text-success text-sm animate-fade-in-up text-center">{resendMessage}</div>}
          <div className="flex justify-center gap-3">
            {otp.map((digit, i) => (
              <input key={i} ref={(el) => (inputRefs.current[i] = el)} type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} onPaste={i === 0 ? handlePaste : undefined}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl bg-void/80 border text-ghost focus:outline-none focus:border-flash/50 focus:ring-2 focus:ring-flash/20 transition-all ${digit ? "border-flash/30" : "border-flash/10"}`} />
            ))}
          </div>
          <button type="submit" disabled={isLoading || otp.join("").length !== 6}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-flash to-turbo text-white font-semibold text-sm hover:shadow-lg hover:shadow-flash/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</span> : "Verify Email"}
          </button>
          <div className="text-center">
            <p className="text-muted text-xs mb-2">Didn&apos;t receive the code?</p>
            <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
              className="text-flash hover:text-bolt text-sm font-medium transition-colors disabled:text-muted disabled:cursor-not-allowed">
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
            </button>
          </div>
          <p className="text-center text-sm text-muted">Wrong email?{" "}<button type="button" onClick={() => router.push("/register")} className="text-flash hover:text-bolt transition-colors font-medium">Go back</button></p>
        </form>
      </div>
    </div>
  );
}
