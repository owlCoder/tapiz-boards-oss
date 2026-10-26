import { redirect } from "next/navigation";

/** Open the classroom demo immediately. No session or database access. */
export default function HomePage() {
  redirect("/demo");
}
