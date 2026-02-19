"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

import { useRouter } from "next/navigation";

export default function Callback() {
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth error:", error);
          setError(error.message);
          setTimeout(() => router.push("/"), 3000);
        } else if (session) {
          router.push("/bookmarks");
        } else {
          router.push("/");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred");
        setTimeout(() => router.push("/"), 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center">
      {error ? (
        <div className="text-center">
          <p className="text-red-500 mb-2">Error: {error}</p>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Logging you in...</p>
        </div>
      )}
    </div>
  );
}