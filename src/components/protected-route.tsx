"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ProtectedRouteProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function ProtectedRoute({
  children,
  fallback = <div>Loading...</div>,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if the user is authenticated by making a request to an API endpoint
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check");
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.replace("/login");
        }
      } catch (error) {
        setIsAuthenticated(false);
        router.replace("/login");
      }
    };

    checkAuth();
  }, [router]);

  // Show fallback while checking authentication
  if (isAuthenticated === null) {
    return <>{fallback}</>;
  }

  // If authenticated, render children
  return isAuthenticated ? <>{children}</> : null;
}
