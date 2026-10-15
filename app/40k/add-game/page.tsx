import Add40kForm from "./40k-form";
import { requireSession } from "@/lib/auth-server";

export default async function Add40kPage() {
  await requireSession();
  return <Add40kForm />;
}
