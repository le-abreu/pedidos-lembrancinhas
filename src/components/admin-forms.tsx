import { ExpectedFileType, SupplierType, UserProfileType } from "@prisma/client";

import { formatCurrency, formatWeight } from "@/lib/format";

type BaseFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  redirectPath: string;
};

type Option = {
  id: string;
  name: string;
};

export function CompanyForm({
  action,
  submitLabel,
  redirectPath,
  item,
}: BaseFormProps & {
  item?: {
    id: string;
    legalName: string;
    tradeName: string;
    cnpj: string;
    email: string;
    phone: string | null;
  } | null;
}) {
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="redirectPath" value={redirectPath} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <label className="field">
        <span>Razão social</span>
        <input name="legalName" required defaultValue={item?.legalName ?? ""} />
      </label>
      <label className="field">
        <span>Nome fantasia</span>
        <input name="tradeName" required defaultValue={item?.tradeName ?? ""} />
      </label>
      <label className="field">
        <span>CNPJ</span>
        <input name="cnpj" required defaultValue={item?.cnpj ?? ""} />
      </label>
      <label className="field">
        <span>E-mail</span>
        <input name="email" type="email" required defaultValue={item?.email ?? ""} />
      </label>
      <label className="field">
        <span>Telefone</span>
        <input name="phone" defaultValue={item?.phone ?? ""} />
      </label>
      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

export function CustomerForm({
  action,
  submitLabel,
  redirectPath,
  item,
  companies,
}: BaseFormProps & {
  item?: {
    id: string;
    companyId: string;
    name: string;
    document: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
  } | null;
  companies: Array<{ id: string; tradeName: string }>;
}) {
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="redirectPath" value={redirectPath} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <label className="field">
        <span>Empresa</span>
        <select name="companyId" required defaultValue={item?.companyId ?? ""}>
          <option value="">Selecione</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.tradeName}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Nome</span>
        <input name="name" required defaultValue={item?.name ?? ""} />
      </label>
      <label className="field">
        <span>Documento</span>
        <input name="document" defaultValue={item?.document ?? ""} />
      </label>
      <label className="field">
        <span>E-mail</span>
        <input name="email" type="email" defaultValue={item?.email ?? ""} />
      </label>
      <label className="field">
        <span>Telefone</span>
        <input name="phone" defaultValue={item?.phone ?? ""} />
      </label>
      <label className="field">
        <span>Observação</span>
        <textarea name="notes" rows={4} defaultValue={item?.notes ?? ""} />
      </label>
      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

export function SupplierForm({
  action,
  submitLabel,
  redirectPath,
  item,
}: BaseFormProps & {
  item?: {
    id: string;
    name: string;
    document: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
    type: SupplierType;
  } | null;
}) {
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="redirectPath" value={redirectPath} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <label className="field">
        <span>Nome / razão social</span>
        <input name="name" required defaultValue={item?.name ?? ""} />
      </label>
      <label className="field">
        <span>Documento</span>
        <input name="document" defaultValue={item?.document ?? ""} />
      </label>
      <label className="field">
        <span>E-mail</span>
        <input name="email" type="email" defaultValue={item?.email ?? ""} />
      </label>
      <label className="field">
        <span>Telefone</span>
        <input name="phone" defaultValue={item?.phone ?? ""} />
      </label>
      <label className="field">
        <span>Tipo</span>
        <select name="type" defaultValue={item?.type ?? SupplierType.BOTH}>
          {Object.values(SupplierType).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Observação</span>
        <textarea name="notes" rows={4} defaultValue={item?.notes ?? ""} />
      </label>
      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

export function UserForm({
  action,
  submitLabel,
  redirectPath,
  item,
  companies,
  customers,
  suppliers,
}: BaseFormProps & {
  item?: {
    id: string;
    name: string;
    email: string;
    password: string;
    companyId: string | null;
    customerId: string | null;
    supplierId: string | null;
    profiles?: Array<{ profile: UserProfileType }>;
  } | null;
  companies: Array<{ id: string; tradeName: string }>;
  customers: Option[];
  suppliers: Option[];
}) {
  const selectedProfiles = item?.profiles?.map((profile) => profile.profile) ?? [];

  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="redirectPath" value={redirectPath} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <label className="field">
        <span>Nome</span>
        <input name="name" required defaultValue={item?.name ?? ""} />
      </label>
      <label className="field">
        <span>E-mail</span>
        <input name="email" type="email" required defaultValue={item?.email ?? ""} />
      </label>
      <label className="field">
        <span>Senha</span>
        <input name="password" type="password" required defaultValue={item?.password ?? "123456"} />
      </label>
      <label className="field">
        <span>Empresa</span>
        <select name="companyId" defaultValue={item?.companyId ?? ""}>
          <option value="">Sem vínculo</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.tradeName}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Cliente</span>
        <select name="customerId" defaultValue={item?.customerId ?? ""}>
          <option value="">Sem vínculo</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Fornecedor</span>
        <select name="supplierId" defaultValue={item?.supplierId ?? ""}>
          <option value="">Sem vínculo</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </label>
      <div className="card">
        <p className="eyebrow">Perfis</p>
        {Object.values(UserProfileType).map((profile) => (
          <label key={profile} className="field-checkbox">
            <input
              type="checkbox"
              name="profiles"
              value={profile}
              defaultChecked={selectedProfiles.includes(profile)}
            />
            <span>{profile}</span>
          </label>
        ))}
      </div>
      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

export function StatusForm({
  action,
  submitLabel,
  redirectPath,
  item,
}: BaseFormProps & {
  item?: {
    id: string;
    name: string;
    description: string | null;
    color: string;
  } | null;
}) {
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="redirectPath" value={redirectPath} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <label className="field">
        <span>Nome</span>
        <input name="name" required defaultValue={item?.name ?? ""} />
      </label>
      <label className="field">
        <span>Cor</span>
        <input name="color" type="color" required defaultValue={item?.color ?? "#a8562a"} />
      </label>
      <label className="field">
        <span>Descrição</span>
        <textarea name="description" rows={4} defaultValue={item?.description ?? ""} />
      </label>
      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

export function ShippingMethodForm({
  action,
  submitLabel,
  redirectPath,
  item,
}: BaseFormProps & {
  item?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}) {
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="redirectPath" value={redirectPath} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <label className="field">
        <span>Nome</span>
        <input name="name" required defaultValue={item?.name ?? ""} />
      </label>
      <label className="field">
        <span>Descrição</span>
        <textarea name="description" rows={4} defaultValue={item?.description ?? ""} />
      </label>
      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

export function OrderTypeForm({
  action,
  submitLabel,
  redirectPath,
  item,
}: BaseFormProps & {
  item?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}) {
  const formId = item ? `order-type-form-${item.id}` : "order-type-form-new";

  return (
    <>
      <form id={formId} action={action} className="form-grid order-type-form">
        <input type="hidden" name="redirectPath" value={redirectPath} />
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        <label className="field">
          <span>Nome</span>
          <input name="name" required defaultValue={item?.name ?? ""} />
        </label>
        <label className="field order-type-description-field">
          <span>Descrição</span>
          <textarea name="description" rows={4} defaultValue={item?.description ?? ""} />
        </label>
      </form>
      <div className="action-toolbar">
        <div className="toolbar-group">
          <button className="primary-button" type="submit" form={formId}>
            {submitLabel}
          </button>
        </div>
      </div>
    </>
  );
}

export function OrderTypeProductForm({
  action,
  submitLabel,
  redirectPath,
  orderTypeId,
  item,
}: BaseFormProps & {
  orderTypeId: string;
  item?: {
    id: string;
    name: string;
    description: string | null;
    defaultQuantity: number | null;
    defaultUnitPrice: { toString(): string } | null;
    defaultUnitWeight: { toString(): string } | null;
    required: boolean;
  } | null;
}) {
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="redirectPath" value={redirectPath} />
      <input type="hidden" name="orderTypeId" value={orderTypeId} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <label className="field">
        <span>Produto</span>
        <input name="name" required defaultValue={item?.name ?? ""} />
      </label>
      <label className="field">
        <span>Descrição</span>
        <textarea name="description" rows={3} defaultValue={item?.description ?? ""} />
      </label>
      <label className="field">
        <span>Qtd por lembrancinha</span>
        <input name="defaultQuantity" type="number" min="1" defaultValue={item?.defaultQuantity ?? ""} />
      </label>
      <label className="field">
        <span>Custo padrão</span>
        <input
          name="defaultUnitPrice"
          type="number"
          min="0"
          step="0.01"
          defaultValue={item?.defaultUnitPrice?.toString() ?? ""}
        />
      </label>
      <label className="field">
        <span>Peso por unidade (kg)</span>
        <input
          name="defaultUnitWeight"
          type="number"
          min="0"
          step="0.001"
          defaultValue={item?.defaultUnitWeight?.toString() ?? ""}
        />
      </label>
      <label className="field-checkbox">
        <input type="checkbox" name="required" defaultChecked={item?.required ?? false} />
        <span>Obrigatório</span>
      </label>
      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

export function WorkflowForm({
  action,
  submitLabel,
  redirectPath,
  item,
  orderTypes,
}: BaseFormProps & {
  item?: {
    id: string;
    orderTypeId: string;
    name: string;
    description: string | null;
  } | null;
  orderTypes: Array<{ id: string; name: string }>;
}) {
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="redirectPath" value={redirectPath} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <label className="field">
        <span>Tipo de pedido</span>
        <select name="orderTypeId" required defaultValue={item?.orderTypeId ?? ""}>
          <option value="">Selecione</option>
          {orderTypes.map((orderType) => (
            <option key={orderType.id} value={orderType.id}>
              {orderType.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Nome</span>
        <input name="name" required defaultValue={item?.name ?? ""} />
      </label>
      <label className="field">
        <span>Descrição</span>
        <textarea name="description" rows={4} defaultValue={item?.description ?? ""} />
      </label>
      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

export function WorkflowPhaseForm({
  action,
  submitLabel,
  redirectPath,
  workflowId,
  statuses,
  suppliers,
  item,
}: BaseFormProps & {
  workflowId: string;
  statuses: Array<{ id: string; name: string }>;
  suppliers: Array<{ id: string; name: string }>;
  item?: {
    id: string;
    name: string;
    description: string | null;
    order: number;
    guidanceMessage: string | null;
    expectedFileType: ExpectedFileType | null;
    targetStatusId: string | null;
    responsibleSupplierId: string | null;
    allowsFileUpload: boolean;
    requiresSupplier: boolean;
    changesOrderStatus: boolean;
    allowsInvoice: boolean;
    requiresComment: boolean;
    active: boolean;
  } | null;
}) {
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="redirectPath" value={redirectPath} />
      <input type="hidden" name="workflowId" value={workflowId} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <label className="field">
        <span>Fase</span>
        <input name="name" required defaultValue={item?.name ?? ""} />
      </label>
      <label className="field">
        <span>Ordem</span>
        <input name="order" type="number" min="1" required defaultValue={item?.order ?? ""} />
      </label>
      <label className="field">
        <span>Descrição</span>
        <textarea name="description" rows={3} defaultValue={item?.description ?? ""} />
      </label>
      <label className="field">
        <span>Mensagem orientativa</span>
        <textarea name="guidanceMessage" rows={3} defaultValue={item?.guidanceMessage ?? ""} />
      </label>
      <label className="field">
        <span>Tipo de arquivo esperado</span>
        <select name="expectedFileType" defaultValue={item?.expectedFileType ?? ExpectedFileType.ANY}>
          {Object.values(ExpectedFileType).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Fornecedor responsável</span>
        <select name="responsibleSupplierId" defaultValue={item?.responsibleSupplierId ?? ""}>
          <option value="">Sem fornecedor fixo</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Status de destino</span>
        <select name="targetStatusId" defaultValue={item?.targetStatusId ?? ""}>
          <option value="">Sem alteração</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field-checkbox">
        <input type="checkbox" name="allowsFileUpload" defaultChecked={item?.allowsFileUpload ?? false} />
        <span>Permite upload</span>
      </label>
      <label className="field-checkbox">
        <input type="checkbox" name="requiresSupplier" defaultChecked={item?.requiresSupplier ?? false} />
        <span>Exige fornecedor responsável</span>
      </label>
      <label className="field-checkbox">
        <input
          type="checkbox"
          name="changesOrderStatus"
          defaultChecked={item?.changesOrderStatus ?? false}
        />
        <span>Altera status do pedido</span>
      </label>
      <label className="field-checkbox">
        <input type="checkbox" name="allowsInvoice" defaultChecked={item?.allowsInvoice ?? false} />
        <span>Permite nota fiscal</span>
      </label>
      <label className="field-checkbox">
        <input type="checkbox" name="requiresComment" defaultChecked={item?.requiresComment ?? false} />
        <span>Exige comentário</span>
      </label>
      <label className="field-checkbox">
        <input type="checkbox" name="active" defaultChecked={item?.active ?? true} />
        <span>Ativa</span>
      </label>
      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

export function OrderForm({
  action,
  submitLabel,
  redirectPath,
  item,
  companies,
  customers,
  statuses,
  shippingMethods,
  users,
  orderTypes,
  suppliers,
}: BaseFormProps & {
  item?: {
    id: string;
    companyId: string;
    customerId: string;
    orderTypeId: string;
    currentStatusId: string;
    createdById: string;
    requestedQuantity: number;
    shippingMethodId: string;
    shippingPrice: { toString(): string } | string | null;
    deliveryAddress: string | null;
    title: string;
    description: string | null;
    requestedAt: Date;
    expectedAt: Date | null;
    notes: string | null;
    items?: Array<{ productId: string }>;
    suppliers?: Array<{ supplierId: string }>;
  } | null;
  companies: Array<{ id: string; tradeName: string }>;
  customers: Option[];
  statuses: Option[];
  shippingMethods: Option[];
  users: Option[];
  orderTypes: Array<{
    id: string;
    name: string;
    products: Array<{
      id: string;
      name: string;
      defaultQuantity: number | null;
      defaultUnitPrice?: { toString(): string } | null;
      defaultUnitWeight?: { toString(): string } | null;
    }>;
  }>;
  suppliers: Option[];
}) {
  const selectedProducts = new Set(item?.items?.map((orderItem) => orderItem.productId) ?? []);
  const selectedSuppliers = new Set(item?.suppliers?.map((supplier) => supplier.supplierId) ?? []);
  const defaultOrderTypeId = item?.orderTypeId ?? orderTypes[0]?.id ?? "";
  const selectedOrderType =
    orderTypes.find((orderType) => orderType.id === defaultOrderTypeId) ?? orderTypes[0] ?? null;
  const requestedQuantity = item?.requestedQuantity ?? 1;
  const selectedOrderProducts = selectedOrderType
    ? selectedOrderType.products.filter((product) =>
        selectedProducts.size ? selectedProducts.has(product.id) : true,
      )
    : [];
  const itemsTotal = selectedOrderProducts.reduce((sum, product) => {
    const quantityPerGift = product.defaultQuantity ?? 1;
    return sum + requestedQuantity * quantityPerGift * Number(product.defaultUnitPrice?.toString() ?? 0);
  }, 0);
  const itemsWeight = selectedOrderProducts.reduce((sum, product) => {
    const quantityPerGift = product.defaultQuantity ?? 1;
    return sum + requestedQuantity * quantityPerGift * Number(product.defaultUnitWeight?.toString() ?? 0);
  }, 0);
  const shippingPrice = Number(item?.shippingPrice?.toString() ?? 0);
  const finalTotal = itemsTotal + shippingPrice;

  return (
    <form action={action} className="order-form-layout">
      <input type="hidden" name="redirectPath" value={redirectPath} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className="card page-stack order-form-section">
        <div className="section-heading">
          <h3>Dados principais</h3>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Empresa</span>
            <select name="companyId" required defaultValue={item?.companyId ?? ""}>
              <option value="">Selecione</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.tradeName}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Cliente</span>
            <select name="customerId" required defaultValue={item?.customerId ?? ""}>
              <option value="">Selecione</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Tipo de pedido</span>
            <select name="orderTypeId" required defaultValue={item?.orderTypeId ?? ""}>
              <option value="">Selecione</option>
              {orderTypes.map((orderType) => (
                <option key={orderType.id} value={orderType.id}>
                  {orderType.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status atual</span>
            <select name="currentStatusId" required defaultValue={item?.currentStatusId ?? ""}>
              <option value="">Selecione</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Responsável pelo cadastro</span>
            <select name="createdById" required defaultValue={item?.createdById ?? ""}>
              <option value="">Selecione</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Título</span>
            <input name="title" required defaultValue={item?.title ?? ""} />
          </label>
          <label className="field">
            <span>Qtd de lembrancinhas</span>
            <input
              name="requestedQuantity"
              type="number"
              min="1"
              required
              defaultValue={item?.requestedQuantity ?? 1}
            />
          </label>
          <label className="field">
            <span>Data da solicitação</span>
            <input
              type="date"
              name="requestedAt"
              required
              defaultValue={item?.requestedAt.toISOString().slice(0, 10) ?? ""}
            />
          </label>
          <label className="field">
            <span>Data prevista</span>
            <input
              type="date"
              name="expectedAt"
              defaultValue={item?.expectedAt?.toISOString().slice(0, 10) ?? ""}
            />
          </label>
          <label className="field order-form-wide">
            <span>Descrição</span>
            <textarea name="description" rows={4} defaultValue={item?.description ?? ""} />
          </label>
          <label className="field order-form-wide">
            <span>Observação</span>
            <textarea name="notes" rows={4} defaultValue={item?.notes ?? ""} />
          </label>
        </div>
      </div>

      <div className="order-form-split">
        <div className="card page-stack order-form-section">
          <div className="section-heading">
            <h3>Entrega e totalização</h3>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Tipo de frete</span>
              <select name="shippingMethodId" required defaultValue={item?.shippingMethodId ?? ""}>
                <option value="">Selecione</option>
                {shippingMethods.map((shippingMethod) => (
                  <option key={shippingMethod.id} value={shippingMethod.id}>
                    {shippingMethod.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Valor do frete</span>
              <input
                name="shippingPrice"
                type="number"
                min="0"
                step="0.01"
                defaultValue={item?.shippingPrice?.toString() ?? "0"}
              />
            </label>
            <label className="field order-form-wide">
              <span>Endereço de entrega</span>
              <textarea name="deliveryAddress" rows={4} defaultValue={item?.deliveryAddress ?? ""} />
            </label>
          </div>

          <div className="order-summary-card">
            <p className="eyebrow">Resumo inicial</p>
            <div className="order-summary-list">
              <div className="detail-block">
                <strong>Totalizador dos itens</strong>
                <span>{formatCurrency(itemsTotal)}</span>
              </div>
              <div className="detail-block">
                <strong>Peso estimado</strong>
                <span>{formatWeight(itemsWeight)}</span>
              </div>
              <div className="detail-block">
                <strong>Frete informado</strong>
                <span>{formatCurrency(shippingPrice)}</span>
              </div>
              <div className="detail-block">
                <strong>Total final previsto</strong>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card page-stack order-form-section">
          <div className="section-heading">
            <h3>Composição do pedido</h3>
          </div>
          <div className="compact-stack">
            <p className="eyebrow">Produtos do template</p>
            {selectedOrderType ? (
              <span className="muted">
                Template base: {selectedOrderType.name}. O valor final usa o total dos itens selecionados mais o
                frete informado.
              </span>
            ) : (
              <span className="muted">Selecione um tipo de pedido para montar o template.</span>
            )}
          </div>
          <div className="order-products-list">
            {orderTypes.flatMap((orderType) =>
              orderType.products.map((product) => (
                <label key={product.id} className="field-checkbox">
                  <input
                    type="checkbox"
                    name="productId"
                    value={product.id}
                    defaultChecked={selectedProducts.has(product.id)}
                  />
                  <span>
                    {orderType.name}: {product.name}
                    {" | "}
                    {product.defaultQuantity ?? 1} por lembrancinha
                    {" | "}
                    custo {formatCurrency(product.defaultUnitPrice?.toString() ?? null)}
                    {" | "}
                    peso {formatWeight(product.defaultUnitWeight?.toString() ?? null)}
                  </span>
                </label>
              )),
            )}
          </div>
        </div>
      </div>

      <div className="card page-stack order-form-section">
        <p className="eyebrow">Fornecedores vinculados</p>
        <div className="order-products-list">
          {suppliers.map((supplier) => (
            <label key={supplier.id} className="field-checkbox">
              <input
                type="checkbox"
                name="supplierId"
                value={supplier.id}
                defaultChecked={selectedSuppliers.has(supplier.id)}
              />
              <span>{supplier.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="action-toolbar">
        <div className="toolbar-group">
          <button className="primary-button" type="submit">
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
