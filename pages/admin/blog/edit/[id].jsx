import { useRouter } from "next/router";
import { AdminPostEditorPage } from "../../../../src/screens/admin/AdminPostEditorPage";

export default function EditAdminPostRoute() {
  const router = useRouter();
  return <AdminPostEditorPage mode="edit" id={router.query.id || ""} />;
}
