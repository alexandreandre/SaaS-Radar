import { redirect } from "next/navigation";
import { MAP_EXPLORE_HREF } from "@/lib/map-routes";

export default function WorldPage() {
  redirect(MAP_EXPLORE_HREF);
}
