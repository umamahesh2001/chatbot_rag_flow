"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { initializeAuth } from "@/store/authSlice";

const PUBLIC_ROUTES = ["/login", "/register", "/verify-otp"];

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-void relative z-10">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-flash to-turbo speed-shadow-lg mb-4 animate-pulse">
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
          </svg>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <span className="w-4 h-4 border-2 border-flash/30 border-t-flash rounded-full animate-spin" />
          <span className="text-muted text-sm">Loading...</span>
        </div>
      </div>
    </div>
  );
}

export default function AuthGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, token, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isLoading) return;
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    if (!token && !isPublicRoute) {
      router.push("/login");
    } else if (token && user && isPublicRoute) {
      router.push("/");
    }
  }, [token, user, isLoading, pathname, router]);

  if (isLoading) return <LoadingScreen />;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  if (!token && !isPublicRoute) return <LoadingScreen />;
  if (token && user && isPublicRoute) return <LoadingScreen />;

  return children;
}
