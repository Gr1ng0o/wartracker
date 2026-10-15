import { requireSession } from "@/lib/auth-server";
import ImportForm from "@/app/_components/import-form";

export default async function ImportPage() {
  await requireSession();
  return <ImportForm />;
}
