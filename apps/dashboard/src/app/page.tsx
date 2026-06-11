import { redirect } from "next/navigation";

/** Default entry: send visitors into the telemetry overview. */
export default function HomePage() {
  redirect("/overview");
}
