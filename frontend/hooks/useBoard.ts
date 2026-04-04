import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export type BoardConfig = {
  id: string;
  user_id: string;
  title: string;
  link_access: "edit" | "view";
};

export function useBoard(roomId: string) {
  const { user } = useAuth();
  const [board, setBoard] = useState<BoardConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Re-fetch board whenever it changes
  const fetchBoard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("id", roomId)
      .single();
      
    if (!error && data) {
      setBoard(data as BoardConfig);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (roomId) {
      fetchBoard();
    }
  }, [roomId]);

  const updateAccess = async (access: "edit" | "view") => {
    if (!board || board.user_id !== user?.id) return;
    
    // Optimistic update
    setBoard({ ...board, link_access: access });
    
    await supabase
      .from("boards")
      .update({ link_access: access })
      .eq("id", roomId);
  };

  const isOwner = user ? user.id === board?.user_id : false;
  const isReadonly = !isOwner && board?.link_access === "view";

  return { board, loading, isOwner, updateAccess, isReadonly, fetchBoard };
}
