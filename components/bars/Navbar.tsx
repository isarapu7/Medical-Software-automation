"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" }); // Redirects to /login after logout
  };

  return (
    <nav className="p-4 bg-blue-500 text-white flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-bold">Pharmacy Management</h1>
      </div>
      <div>
        {status === "authenticated" ? (
          <>
            <span className="mr-4">Welcome, {session.user?.name || session.user?.email}</span>
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => router.push("/login")}>
            Login
          </Button>
        )}
      </div>
    </nav>
  );
}