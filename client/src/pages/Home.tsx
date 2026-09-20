import React, { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

/** The public Pages site and signed-out welcome share one static source. */
export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) navigate("/repos");
    else window.location.replace("/welcome/");
  }, [isAuthenticated, loading, navigate]);
  return (
    <main
      className="min-h-screen bg-background text-foreground flex items-center justify-center"
      aria-busy="true"
    >
      <p role="status">Opening Jekyll Forge…</p>
    </main>
  );
}
