// This file extracts the Board-fetching logic so it can be cleanly used inside Tldraw Menu.
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export type Board = {
  id: string;
  title: string;
  created_at: string;
};

export function useBoardsList() {
  const { user, loading } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);

  useEffect(() => {
    if (user) {
      supabase
        .from("boards")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setBoards(data);
        });
    }
  }, [user]);

  return { boards, user, loading };
}
