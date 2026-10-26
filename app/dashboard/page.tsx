import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  const user = getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardClient user={user} />;
}
