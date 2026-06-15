import { SidebarShell } from "./sidebar-shell";
import { getCurrentUser } from "@/lib/auth";

export async function Sidebar() {
  const user = await getCurrentUser();
  return <SidebarShell user={user} />;
}
