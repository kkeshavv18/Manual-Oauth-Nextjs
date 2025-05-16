"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  provider: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/check");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // If not authenticated, redirect to login
          router.replace("/login");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };
  console.log("user information: ", user);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {user ? (
        <div className="bg-black shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Your Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-600">ID</p>
              <p className="font-medium">{user.id}</p>
            </div>
            <div>
              <p className="text-gray-600">Role</p>
              <p className="font-medium capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-gray-600">Authentication Provider</p>
              <p className="font-medium capitalize">{user.provider}</p>
            </div>
          </div>
        </div>
      ) : (
        <div>Failed to fetch user</div>
      )}
    </div>
  );
}
