import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function Home() {
  const newRoomId = crypto.randomUUID();

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    await supabase.from("boards").insert({
      id: newRoomId,
      user_id: session.user.id,
      title: "Untitled Board",
      link_access: "edit",
    });
  }

  redirect(`/b/${newRoomId}`);
}
