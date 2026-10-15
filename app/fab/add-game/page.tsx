import { requireSession } from "@/lib/auth-server";
import FabForm from "./fab-form";

export default async function FabAddGamePage() {
  await requireSession();
  return <FabForm />;
}
