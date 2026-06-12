import { useRouter } from "next/router";
import { BlogPostPage } from "../../src/screens/BlogPostPage";

export default function PreviewPage() {
  const router = useRouter();
  const slug = router.query.slug || "";
  const previewToken = router.query.token || "";
  return <BlogPostPage slug={slug} previewToken={previewToken} />;
}
