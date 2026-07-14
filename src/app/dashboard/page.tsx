import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardIndex() {
  const session = await auth();
  if (!session) redirect("/login");

  switch (session.user.role) {
    case "COUNCILLOR":
      redirect("/dashboard/councillor");
    case "TEAM_MEMBER":
      redirect("/dashboard/team");
    default:
      redirect("/dashboard/citizen");
  }
}
