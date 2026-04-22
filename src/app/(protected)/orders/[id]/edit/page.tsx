import Link from "next/link";
import { notFound } from "next/navigation";
import { UserProfileType } from "@prisma/client";

import { updateOrder } from "@/app/actions";
import { OrderForm } from "@/components/admin-forms";
import { FeedbackBanner } from "@/components/feedback-banner";
import { FormCard } from "@/components/form-card";
import { PageHeader } from "@/components/page-header";
import { requireAnyProfile } from "@/lib/auth";
import { getOrderFormData } from "@/server/services/order-service";

type PageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function EditOrderPage({ params, searchParams }: PageProps) {
  await requireAnyProfile([UserProfileType.ADMIN]);
  const data = await getOrderFormData(params.id);
  const successMessage = typeof searchParams?.success === "string" ? searchParams.success : "";

  if (!data.item) {
    notFound();
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={`Editar ${data.item.title}`}
        description="Atualize os dados do pedido."
        action={
          <Link className="ghost-button" href="/orders">
            Voltar para pesquisa
          </Link>
        }
      />
      {successMessage ? <FeedbackBanner message={successMessage} /> : null}
      <FormCard title="Edição" description="Altere vínculo, status, datas e composição do pedido.">
        <OrderForm
          action={updateOrder}
          submitLabel="Salvar alterações"
          redirectPath={`/orders/${data.item.id}/edit`}
          {...data}
        />
      </FormCard>
    </div>
  );
}
