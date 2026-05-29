import { notFound } from "next/navigation";
import { getFormBySlug } from "@/lib/forms-store";
import { PublicFormView } from "./public-form-view";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const form = await getFormBySlug(decodeURIComponent(slug));
  return {
    title: form?.name || "Formulário — Jay Academy",
    description: form?.description,
  };
}

export default async function PublicFormPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const form = await getFormBySlug(decodeURIComponent(slug));
  if (!form) notFound();

  return (
    <PublicFormView
      slug={form.slug}
      name={form.name}
      description={form.description}
      buttonLabel={form.buttonLabel}
    />
  );
}
