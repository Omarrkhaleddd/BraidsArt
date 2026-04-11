import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { verifyAdminToken, clearAdminToken } from "@/lib/admin-auth";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"checking" | "authorized" | "unauthorized">("checking");

  useEffect(() => {
    verifyAdminToken().then((valid) => {
      if (valid) {
        setStatus("authorized");
      } else {
        clearAdminToken();
        setStatus("unauthorized");
        setLocation("/admin/login");
      }
    });
  }, [setLocation]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Verifying access...</div>
      </div>
    );
  }

  if (status === "unauthorized") return null;

  return <>{children}</>;
}
