import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function Home() {
  const newRoomId = crypto.randomUUID();
  
  // Try to associate this new board with the current user
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user) {
    // We intentionally ignore errors here so that if the table doesn't exist yet, 
    // it won't crash the homepage entirely and blocks them from drawing.
    await supabase.from('boards').insert({
      id: newRoomId,
      user_id: session.user.id,
      title: "Untitled Board",
      link_access: "edit"
    });
  }
  
  // Instantly bump the user into their fresh new canvas
  redirect(`/b/${newRoomId}`);
}