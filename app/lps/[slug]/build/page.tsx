import { notFound, redirect } from "next/navigation";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { getLpFromStore } from "@/lib/lp-store";
import {
  emptyPage,
  loadBuilderPage,
  saveBuilderPage,
} from "@/lib/page-builder-store";
import { BuilderEditor } from "@/components/page-builder/builder-editor";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";

export default async function BuildPage({ params }: { params: Params }) {
  const { slug } = await params;
  const me = await getCurrentUser();
  if (!me) redirect(`/login?redirect=/lps/${slug}/build`);
  if (!canEdit(me)) redirect(`/lps/${slug}`);

  const lp = await getLpFromStore(slug);
  if (!lp) notFound();

  let page = await loadBuilderPage(slug);
  if (!page) {
    page = emptyPage(slug);
    await saveBuilderPage(page);
  }

  return <BuilderEditor slug={slug} lpName={lp.name} initialPage={page} />;
}
