"use client";

import { useEffect, useState } from "react";

import styles from "./page.module.css";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/");
      } else {
        setUser(session.user);
        fetchBookmarks(session.user.id);
      }
      setLoading(false);
    });

    // Set up real-time subscription
    const channel = supabase
      .channel("realtime-bookmarks")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "bookmarks" 
        },
        () => {
          // Refetch bookmarks when any change occurs
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              fetchBookmarks(session.user.id);
            }
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [router]);

  const fetchBookmarks = async (userId) => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookmarks:", error);
    } else {
      setBookmarks(data || []);
    }
  };

  const addBookmark = async () => {
    if (!title || !url) {
      alert("Please fill in both title and URL");
      return;
    }

    // Basic URL validation
    let validUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      validUrl = 'https://' + url;
    }

    const { error } = await supabase.from("bookmarks").insert({ 
      title, 
      url: validUrl,
      user_id: user.id 
    });
    
    if (error) {
      console.error("Error adding bookmark:", error);
      alert("Error adding bookmark");
    } else {
      setTitle("");
      setUrl("");
    }
  };

  const deleteBookmark = async (id) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (error) {
      console.error("Error deleting bookmark:", error);
      alert("Error deleting bookmark");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${styles.page}`}>
      <div className={`p-6 max-w-xl mx-auto ${styles.card}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Bookmarks</h1>
          <button 
            onClick={handleLogout}
            className={`bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200 ${styles.logoutBtn}`}
          >
            Logout
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Bookmark</h2>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`border border-gray-300 p-3 w-full mb-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${styles.input}`}
          />

          <input
            placeholder="URL (e.g., example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={`border border-gray-300 p-3 w-full mb-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${styles.input}`}
          />

          <button
            onClick={addBookmark}
            className={`${styles.primaryBtn} w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded font-semibold transition duration-200`}
          >
            Add Bookmark
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Your Bookmarks</h2>
          {bookmarks.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No bookmarks yet. Add your first bookmark!</p>
          ) : (
            <div className={`${styles.bookmarks}`}>
              {bookmarks.map((b) => (
                <div 
                  key={b.id} 
                  className={`${styles.bookmarkItem} border border-gray-200 p-4 rounded-lg flex justify-between items-center hover:bg-gray-50 transition duration-200`}
                >
                  <a 
                    href={b.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`${styles.bookmarkLink} text-blue-600 hover:underline font-medium`}
                  >
                    {b.title}
                  </a>
                  <button 
                    onClick={() => deleteBookmark(b.id)}
                    className={`${styles.deleteBtn} text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition duration-200`}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}