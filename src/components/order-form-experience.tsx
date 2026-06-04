"use client";

import { useEffect, useState } from "react";

import {
  calculateFreight,
  formatFreightAddress,
  type FreightAddress,
} from "@/lib/freight-calculator";
import { formatCurrency, formatWeight } from "@/lib/format";

type Option = {
  id: string;
  name: string;
};

type OrderTypeProduct = {
  id: string;
  name: string;
  description?: string | null;
  required: boolean;
  defaultQuantity: number | null;
  defaultUnitPrice?: { toString(): string } | null;
  defaultUnitWeight?: { toString(): string } | null;
  fileStoredFile?: {
    id: string;
    originalName: string;
  } | null;
};

type OrderTypeOption = {
  id: string;
  name: string;
  minimumQuantity: number;
  products: OrderTypeProduct[];
};

type CustomerOption = {
  id: string;
  name: string;
  companyId?: string;
  addressZipCode?: string | null;
  addressStreet?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  addressNeighborhood?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressReference?: string | null;
};

type ShippingMethodOption = Option & {
  calculationType?: string | null;
  fixedPrice?: { toString(): string } | string | number | null;
};

type OrderItemInput = {
  productId: string;
  quantity: number;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  redirectPath: string;
  mode: "create" | "edit";
  isAdminView?: boolean;
  isClientView?: boolean;
  item?: {
    id: string;
    companyId: string;
    customerId: string;
    orderTypeId: string;
    currentStatusId: string;
    requestedQuantity: number;
    shippingMethodId: string;
    shippingPrice: { toString(): string } | string | null;
    itemsSubtotal?: { toString(): string } | string | null;
    finalTotal?: { toString(): string } | string | null;
    additionalChargeAmount?: { toString(): string } | string | null;
    additionalChargeReason?: string | null;
    deliveryAddress: string | null;
    deliveryZipCode?: string | null;
    deliveryStreet?: string | null;
    deliveryNumber?: string | null;
    deliveryComplement?: string | null;
    deliveryNeighborhood?: string | null;
    deliveryCity?: string | null;
    deliveryState?: string | null;
    deliveryReference?: string | null;
    title: string;
    description: string | null;
    requestedAt: Date | string;
    expectedAt: Date | null | string;
    notes: string | null;
    items?: OrderItemInput[];
    suppliers?: Array<{ supplierId: string }>;
    attachments?: Array<{
      id: string;
      storedFile: {
        id: string;
        originalName: string;
        mimeType: string | null;
      };
    }>;
  } | null;
  companies: Array<{ id: string; tradeName: string }>;
  customers: CustomerOption[];
  statuses: Option[];
  shippingMethods: ShippingMethodOption[];
  orderTypes: OrderTypeOption[];
  suppliers: Option[];
};

type Panel = {
  key: string;
  label: string;
};

function formatInputDate(value?: Date | string | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toISOString().slice(0, 10);
}

function isImageFile(file: { mimeType: string | null }) {
  return Boolean(file.mimeType?.startsWith("image/"));
}

function getCustomerAddress(
  customer: CustomerOption | null | undefined
): FreightAddress {
  return {
    zipCode: customer?.addressZipCode ?? "",
    street: customer?.addressStreet ?? "",
    number: customer?.addressNumber ?? "",
    complement: customer?.addressComplement ?? "",
    neighborhood: customer?.addressNeighborhood ?? "",
    city: customer?.addressCity ?? "",
    state: customer?.addressState ?? "",
    reference: customer?.addressReference ?? "",
  };
}

export function OrderFormExperience({
  action,
  submitLabel,
  redirectPath,
  mode,
  isAdminView = false,
  isClientView = false,
  item,
  companies,
  customers,
  statuses,
  shippingMethods,
  orderTypes,
  suppliers,
}: Props) {
  const initialOrderTypeId = item?.orderTypeId ?? orderTypes[0]?.id ?? "";
  const initialOrderType =
    orderTypes.find((orderType) => orderType.id === initialOrderTypeId) ??
    orderTypes[0] ??
    null;
  const initialRequestedQuantity = String(item?.requestedQuantity ?? initialOrderType?.minimumQuantity ?? 1);
  const initialCustomerId = item?.customerId ?? customers[0]?.id ?? "";
  const initialCustomer =
    customers.find((customer) => customer.id === initialCustomerId) ?? null;
  const initialSelectedSuppliers = new Set(
    item?.suppliers?.map((supplier) => supplier.supplierId) ?? []
  );
  const itemQuantityMap = new Map(
    item?.items?.map((orderItem) => [
      orderItem.productId,
      orderItem.quantity,
    ]) ?? []
  );

  const [activePanel, setActivePanel] = useState(
    mode === "create" ? "pedido" : "cadastro"
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    item?.companyId ?? companies[0]?.id ?? ""
  );
  const [selectedCustomerId, setSelectedCustomerId] =
    useState(initialCustomerId);
  const [selectedOrderTypeId, setSelectedOrderTypeId] =
    useState(initialOrderTypeId);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState(
    item?.shippingMethodId ?? shippingMethods[0]?.id ?? ""
  );
  const [deliveryAddress, setDeliveryAddress] = useState<FreightAddress>(
    getCustomerAddress(initialCustomer)
  );
  const [useDifferentDeliveryAddress, setUseDifferentDeliveryAddress] =
    useState(false);
  const [zipCodeLookupStatus, setZipCodeLookupStatus] = useState("");
  const [requestedQuantity, setRequestedQuantity] = useState(
    initialRequestedQuantity
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    item?.items?.length
      ? item.items.map((orderItem) => orderItem.productId)
      : []
  );
  const [productExtraQuantities, setProductExtraQuantities] = useState<
    Record<string, string>
  >(() => {
    const entries = orderTypes.flatMap((orderType) =>
      orderType.products.map((product) => [
        product.id,
        String(
          Math.max(
            0,
            (itemQuantityMap.get(product.id) ??
              (item?.requestedQuantity ?? 1) * (product.defaultQuantity ?? 1)) -
              (item?.requestedQuantity ?? 1) * (product.defaultQuantity ?? 1)
          )
        ),
      ])
    );

    return Object.fromEntries(entries);
  });
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([
    ...initialSelectedSuppliers,
  ]);
  const [additionalChargeAmount, setAdditionalChargeAmount] = useState(
    item?.additionalChargeAmount?.toString() ?? "0"
  );

  const finalCreatePanel = isAdminView ? "resumo" : "finalizacao";
  const panels: Panel[] =
    mode === "create"
      ? [
          { key: "pedido", label: "1. Sobre o pedido" },
          { key: "destino", label: "2. Entrega e cliente" },
          { key: "itens", label: "3. Itens e referências" },
          {
            key: finalCreatePanel,
            label: isAdminView ? "4. Revisão final" : "4. Confirmar pedido",
          },
        ]
      : [
          { key: "cadastro", label: "Dados do pedido" },
          { key: "destino", label: "Entrega e cliente" },
          { key: "itens", label: "Itens e referências" },
          { key: "custos", label: "Ajustes finais" },
        ];

  const selectedOrderType =
    orderTypes.find((orderType) => orderType.id === selectedOrderTypeId) ??
    orderTypes[0] ??
    null;
  const selectedMinimumQuantity = selectedOrderType?.minimumQuantity ?? 1;
  const currentCustomerOptions = isClientView
    ? customers
    : customers.filter(
        (customer) =>
          !selectedCompanyId || customer.companyId === selectedCompanyId
      );
  const selectedCustomer =
    customers.find((customer) => customer.id === selectedCustomerId) ?? null;
  const resolvedCompanyId = isClientView
    ? selectedCustomer?.companyId ?? ""
    : selectedCompanyId;
  const currentStatusId = item?.currentStatusId ?? statuses[0]?.id ?? "";
  const selectedShippingMethod =
    shippingMethods.find(
      (shippingMethod) => shippingMethod.id === selectedShippingMethodId
    ) ??
    shippingMethods[0] ??
    null;
  const orderImageAttachments = (item?.attachments ?? []).filter((attachment) =>
    isImageFile(attachment.storedFile)
  );

  useEffect(() => {
    if (
      !isClientView &&
      currentCustomerOptions.length &&
      !currentCustomerOptions.some(
        (customer) => customer.id === selectedCustomerId
      )
    ) {
      const nextCustomer = currentCustomerOptions[0];
      setSelectedCustomerId(nextCustomer.id);
      if (!useDifferentDeliveryAddress) {
        setDeliveryAddress(getCustomerAddress(nextCustomer));
      }
    }
  }, [
    currentCustomerOptions,
    isClientView,
    selectedCustomerId,
    useDifferentDeliveryAddress,
  ]);

  useEffect(() => {
    if (!selectedOrderType) {
      return;
    }

    setRequestedQuantity((current) => {
      const parsed = Number(current || "0");
      return parsed < selectedOrderType.minimumQuantity
        ? String(selectedOrderType.minimumQuantity)
        : current;
    });

    const nextSelectedProducts =
      item?.items?.length && selectedOrderType.id === item.orderTypeId
        ? [
            ...selectedOrderType.products
              .filter((product) => product.required)
              .map((product) => product.id),
            ...item.items
              .map((orderItem) => orderItem.productId)
              .filter((productId) =>
                selectedOrderType.products.some(
                  (product) => product.id === productId
                )
              ),
          ]
        : selectedOrderType.products
            .filter((product) => product.required)
            .map((product) => product.id);

    setSelectedProductIds([...new Set(nextSelectedProducts)]);
    setProductExtraQuantities((current) => {
      const next = { ...current };

      selectedOrderType.products.forEach((product) => {
        const baseQuantity =
          Number(requestedQuantity || "1") * (product.defaultQuantity ?? 1);
        const savedQuantity = itemQuantityMap.get(product.id);

        if (
          selectedOrderType.id === item?.orderTypeId &&
          typeof savedQuantity === "number"
        ) {
          next[product.id] = String(Math.max(0, savedQuantity - baseQuantity));
        } else if (
          !next[product.id] ||
          selectedOrderType.id !== item?.orderTypeId
        ) {
          next[product.id] = "0";
        }
      });

      return next;
    });
  }, [selectedOrderTypeId, requestedQuantity]);

  function getBaseProductQuantity(product: OrderTypeProduct) {
    return Number(requestedQuantity || "1") * (product.defaultQuantity ?? 1);
  }

  function getExtraProductQuantity(productId: string) {
    return Number(productExtraQuantities[productId] ?? "0");
  }

  function getTotalProductQuantity(product: OrderTypeProduct) {
    return (
      getBaseProductQuantity(product) + getExtraProductQuantity(product.id)
    );
  }

  const selectedProducts = selectedOrderType
    ? selectedOrderType.products.filter(
        (product) => product.required || selectedProductIds.includes(product.id)
      )
    : [];

  const itemsTotal = selectedProducts.reduce((sum, product) => {
    return (
      sum +
      getTotalProductQuantity(product) *
        Number(product.defaultUnitPrice?.toString() ?? 0)
    );
  }, 0);
  const itemsWeight = selectedProducts.reduce((sum, product) => {
    return (
      sum +
      getTotalProductQuantity(product) *
        Number(product.defaultUnitWeight?.toString() ?? 0)
    );
  }, 0);
  const freightCalculation = calculateFreight({
    shippingMethod: selectedShippingMethod,
    address: deliveryAddress,
    subtotal: itemsTotal,
    weight: itemsWeight,
  });
  const shippingPriceValue = freightCalculation.amount;
  const additionalChargeValue = Number(additionalChargeAmount || 0);
  const finalTotal = itemsTotal + shippingPriceValue + additionalChargeValue;

  function setDeliveryAddressField(field: keyof FreightAddress, value: string) {
    setDeliveryAddress((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleCustomerChange(customerId: string) {
    const nextCustomer =
      customers.find((customer) => customer.id === customerId) ?? null;
    setSelectedCustomerId(customerId);
    if (!useDifferentDeliveryAddress) {
      setDeliveryAddress(getCustomerAddress(nextCustomer));
    }
    setZipCodeLookupStatus("");
  }

  function handleUseDifferentDeliveryAddress(checked: boolean) {
    setUseDifferentDeliveryAddress(checked);
    setZipCodeLookupStatus("");

    if (!checked) {
      setDeliveryAddress(getCustomerAddress(selectedCustomer));
    }
  }

  function renderHiddenDeliveryAddressFields() {
    return (
      <>
        <input
          type="hidden"
          name="deliveryZipCode"
          value={deliveryAddress.zipCode ?? ""}
        />
        <input
          type="hidden"
          name="deliveryStreet"
          value={deliveryAddress.street ?? ""}
        />
        <input
          type="hidden"
          name="deliveryNumber"
          value={deliveryAddress.number ?? ""}
        />
        <input
          type="hidden"
          name="deliveryComplement"
          value={deliveryAddress.complement ?? ""}
        />
        <input
          type="hidden"
          name="deliveryNeighborhood"
          value={deliveryAddress.neighborhood ?? ""}
        />
        <input
          type="hidden"
          name="deliveryCity"
          value={deliveryAddress.city ?? ""}
        />
        <input
          type="hidden"
          name="deliveryState"
          value={deliveryAddress.state ?? ""}
        />
        <input
          type="hidden"
          name="deliveryReference"
          value={deliveryAddress.reference ?? ""}
        />
      </>
    );
  }

  async function lookupZipCodeAddress() {
    const zipCode = deliveryAddress.zipCode?.replace(/\D/g, "") ?? "";

    if (zipCode.length !== 8) {
      setZipCodeLookupStatus(zipCode ? "CEP inválido." : "");
      return;
    }

    setZipCodeLookupStatus("Buscando endereço...");

    try {
      const response = await fetch(`/api/addresses/zipcode?cep=${zipCode}`);

      if (!response.ok) {
        setZipCodeLookupStatus("CEP não encontrado.");
        return;
      }

      const address = (await response.json()) as {
        zipCode: string;
        street: string;
        complement: string;
        neighborhood: string;
        city: string;
        state: string;
      };

      setDeliveryAddress((current) => ({
        ...current,
        zipCode: address.zipCode,
        street: address.street,
        complement: current.complement || address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      }));
      setZipCodeLookupStatus("Endereço carregado pelo CEP.");
    } catch {
      setZipCodeLookupStatus("Não foi possível buscar o CEP.");
    }
  }

  function setProductExtraQuantity(productId: string, value: string) {
    setProductExtraQuantities((current) => ({
      ...current,
      [productId]: value,
    }));
  }

  function toggleProduct(productId: string, checked: boolean) {
    setSelectedProductIds((current) =>
      checked
        ? [...new Set([...current, productId])]
        : current.filter((itemId) => itemId !== productId)
    );
  }

  function toggleSupplier(supplierId: string, checked: boolean) {
    setSelectedSupplierIds((current) =>
      checked
        ? [...new Set([...current, supplierId])]
        : current.filter((itemId) => itemId !== supplierId)
    );
  }

  function renderPanelNavigation() {
    return (
      <div className={mode === "create" ? "order-stepper" : "order-edit-tabs"}>
        {panels.map((panel) => (
          <button
            key={panel.key}
            className={`order-panel-button ${
              activePanel === panel.key ? "active" : ""
            }`}
            type="button"
            onClick={() => setActivePanel(panel.key)}
          >
            {panel.label}
          </button>
        ))}
      </div>
    );
  }

  function renderProductCard(product: OrderTypeProduct) {
    const productImage = product.fileStoredFile;
    const suggestedQuantity = getBaseProductQuantity(product);
    const extraQuantity = getExtraProductQuantity(product.id);
    const totalQuantity = getTotalProductQuantity(product);
    const isSelected =
      product.required || selectedProductIds.includes(product.id);

    return (
      <article key={product.id} className="order-product-card">
        <div className="order-product-header">
          <div className="order-product-title">
            <strong>{product.name}</strong>
            {product.description ? (
              <span className="muted">{product.description}</span>
            ) : null}
          </div>
          {product.required ? (
            <span className="badge">Obrigatório</span>
          ) : (
            <label className="field-checkbox order-product-toggle">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(event) =>
                  toggleProduct(product.id, event.target.checked)
                }
              />
              <span>Incluir no pedido</span>
            </label>
          )}
        </div>

        {isSelected ? (
          <>
            <input type="hidden" name="productId" value={product.id} />
            <input
              type="hidden"
              name={`productQuantity:${product.id}`}
              value={String(totalQuantity)}
            />
          </>
        ) : null}

        <div className="order-product-meta">
          <div className="details-grid">
            <div className="detail-block">
              <strong>Quantidade base</strong>
              <span>{suggestedQuantity}</span>
            </div>
            <div className="detail-block">
              <strong>Quantidade extra</strong>
              <span>{extraQuantity}</span>
            </div>
            <div className="detail-block">
              <strong>Quantidade total</strong>
              <span>{totalQuantity}</span>
            </div>
            <div className="detail-block">
              <strong>Peso unitário</strong>
              <span>
                {formatWeight(product.defaultUnitWeight?.toString() ?? null)}
              </span>
            </div>
          </div>

          <div className="order-reference-panel">
            <strong>Referência</strong>
            {productImage ? (
              <a
                className="inline-file-link"
                href={`/api/files/${productImage.id}`}
                target="_blank"
              >
                {productImage.originalName}
              </a>
            ) : (
              <span className="muted">Sem foto de referência cadastrada.</span>
            )}
          </div>
        </div>

        <label className="field">
          <span>Quantidade extra do item</span>
          <input
            type="number"
            min="0"
            value={productExtraQuantities[product.id] ?? "0"}
            disabled={!isSelected}
            onChange={(event) =>
              setProductExtraQuantity(product.id, event.target.value)
            }
            required
          />
        </label>
      </article>
    );
  }

  function renderSummary() {
    return (
      <div className="order-summary-card">
        <p className="eyebrow">Resumo do pedido</p>
        <div className="order-summary-list">
          <div className="detail-block">
            <strong>Cliente</strong>
            <span>{selectedCustomer?.name ?? "Selecione um cliente"}</span>
          </div>
          <div className="detail-block">
            <strong>Empresa</strong>
            <span>
              {companies.find((company) => company.id === resolvedCompanyId)
                ?.tradeName ?? "A definir"}
            </span>
          </div>
          <div className="detail-block">
            <strong>Entrega</strong>
            <span>{selectedShippingMethod?.name ?? "Selecione o frete"}</span>
          </div>
          <div className="detail-block">
            <strong>Endereço do pedido</strong>
            <span>
              {formatFreightAddress(deliveryAddress) ||
                "Sem endereço informado."}
            </span>
          </div>
          <div className="detail-block">
            <strong>Peso Estimado do Pedido</strong>
            <span>{formatWeight(itemsWeight)}</span>
          </div>
          <div className="detail-block">
            <strong>Total dos itens</strong>
            <span>{formatCurrency(itemsTotal)}</span>
          </div>
          <div className="detail-block">
            <strong>Frete</strong>
            <span>{formatCurrency(shippingPriceValue)}</span>
          </div>
          <div className="detail-block">
            <strong>Acréscimos</strong>
            <span>{formatCurrency(additionalChargeValue)}</span>
          </div>
          <div className="detail-block">
            <strong>Total estimado do pedido</strong>
            <span>{formatCurrency(finalTotal)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="order-journey-form"
      encType="multipart/form-data"
    >
      <input type="hidden" name="redirectPath" value={redirectPath} />
      <input type="hidden" name="companyId" value={resolvedCompanyId} />
      {isClientView ? (
        <input type="hidden" name="currentStatusId" value={currentStatusId} />
      ) : null}
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      {renderPanelNavigation()}

      <section
        className={`card page-stack ${
          activePanel === "pedido" || activePanel === "cadastro"
            ? ""
            : "order-panel-hidden"
        }`}
      >
        <div className="section-heading">
          <h3>
            {mode === "create"
              ? "Informações iniciais do pedido"
              : "Informações principais do pedido"}
          </h3>
        </div>
        <span className="muted">
          {mode === "create"
            ? "Defina o que será solicitado."
            : "Atualize os dados centrais da solicitação sem perder o histórico do pedido."}
        </span>
        <div className="form-grid">
          <label className="field">
            <span>Nome do pedido</span>
            <input
              name="title"
              required
              defaultValue={item?.title ?? ""}
              placeholder="Ex.: Kit de boas-vindas da turma A"
            />
          </label>
          <label className="field">
            <span>Modelo do pedido</span>
            <select
              name="orderTypeId"
              required
              value={selectedOrderTypeId}
              onChange={(event) => setSelectedOrderTypeId(event.target.value)}
            >
              <option value="">Selecione</option>
              {orderTypes.map((orderType) => (
                <option key={orderType.id} value={orderType.id}>
                  {orderType.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Quantidade de kits / lembrancinhas</span>
            <input
              name="requestedQuantity"
              type="number"
              min={selectedMinimumQuantity}
              required
              value={requestedQuantity}
              onChange={(event) => setRequestedQuantity(event.target.value)}
            />
            <span className="field-hint">Mínimo deste tipo: {selectedMinimumQuantity}</span>
          </label>
          <label className="field">
            <span>Data do pedido</span>
            <input
              type="date"
              name="requestedAt"
              required
              defaultValue={
                formatInputDate(item?.requestedAt) ||
                formatInputDate(new Date())
              }
            />
          </label>
          {!isClientView ? (
            <label className="field">
              <span>Status interno</span>
              <select name="currentStatusId" defaultValue={currentStatusId}>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="field order-form-wide">
            <span>Detalhes do pedido</span>
            <textarea
              name="description"
              rows={4}
              defaultValue={item?.description ?? ""}
            />
          </label>
        </div>
        {mode === "create" ? (
          <div className="action-toolbar">
            <button
              className="primary-button"
              type="button"
              onClick={() => setActivePanel("destino")}
            >
              Avançar para destino
            </button>
          </div>
        ) : null}
      </section>

      <section
        className={`card page-stack ${
          activePanel === "destino" ? "" : "order-panel-hidden"
        }`}
      >
        <div className="section-heading">
          <h3>Cliente e entrega</h3>
        </div>
        <span className="muted">
          Escolha quem vai receber o pedido e informe onde a entrega deve
          acontecer.
        </span>
        <div className="form-grid">
          {!isClientView ? (
            <label className="field">
              <span>Empresa atendida</span>
              <select
                value={selectedCompanyId}
                onChange={(event) => setSelectedCompanyId(event.target.value)}
              >
                <option value="">Selecione</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.tradeName}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="detail-block">
              <strong>Empresa</strong>
              <span>
                {companies.find((company) => company.id === resolvedCompanyId)
                  ?.tradeName ?? "Definida pelo cliente selecionado"}
              </span>
            </div>
          )}
          <label className="field">
            <span>Cliente solicitante</span>
            <select
              name="customerId"
              required
              value={selectedCustomerId}
              onChange={(event) => handleCustomerChange(event.target.value)}
            >
              <option value="">Selecione</option>
              {currentCustomerOptions.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field-checkbox order-form-wide">
            <input
              type="checkbox"
              name="useDifferentDeliveryAddress"
              checked={useDifferentDeliveryAddress}
              onChange={(event) =>
                handleUseDifferentDeliveryAddress(event.target.checked)
              }
            />
            <span>Usar outro endereço de entrega</span>
          </label>
          {useDifferentDeliveryAddress ? (
            <>
              <label className="field">
                <span>CEP</span>
                <input
                  name="deliveryZipCode"
                  value={deliveryAddress.zipCode ?? ""}
                  onChange={(event) =>
                    setDeliveryAddressField("zipCode", event.target.value)
                  }
                  onBlur={lookupZipCodeAddress}
                  required={freightCalculation.requiresAddress}
                />
                {zipCodeLookupStatus ? (
                  <span className="muted">{zipCodeLookupStatus}</span>
                ) : null}
              </label>
              <label className="field">
                <span>Logradouro</span>
                <input
                  name="deliveryStreet"
                  value={deliveryAddress.street ?? ""}
                  onChange={(event) =>
                    setDeliveryAddressField("street", event.target.value)
                  }
                  required={freightCalculation.requiresAddress}
                />
              </label>
              <label className="field">
                <span>Número</span>
                <input
                  name="deliveryNumber"
                  value={deliveryAddress.number ?? ""}
                  onChange={(event) =>
                    setDeliveryAddressField("number", event.target.value)
                  }
                  required={freightCalculation.requiresAddress}
                />
              </label>
              <label className="field">
                <span>Complemento</span>
                <input
                  name="deliveryComplement"
                  value={deliveryAddress.complement ?? ""}
                  onChange={(event) =>
                    setDeliveryAddressField("complement", event.target.value)
                  }
                />
              </label>
              <label className="field">
                <span>Bairro</span>
                <input
                  name="deliveryNeighborhood"
                  value={deliveryAddress.neighborhood ?? ""}
                  onChange={(event) =>
                    setDeliveryAddressField(
                      "neighborhood",
                      event.target.value
                    )
                  }
                  required={freightCalculation.requiresAddress}
                />
              </label>
              <label className="field">
                <span>Cidade</span>
                <input
                  name="deliveryCity"
                  value={deliveryAddress.city ?? ""}
                  onChange={(event) =>
                    setDeliveryAddressField("city", event.target.value)
                  }
                  required={freightCalculation.requiresAddress}
                />
              </label>
              <label className="field">
                <span>Estado</span>
                <input
                  name="deliveryState"
                  maxLength={2}
                  value={deliveryAddress.state ?? ""}
                  onChange={(event) =>
                    setDeliveryAddressField(
                      "state",
                      event.target.value.toUpperCase()
                    )
                  }
                  required={freightCalculation.requiresAddress}
                />
              </label>
              <label className="field order-form-wide">
                <span>Referência</span>
                <input
                  name="deliveryReference"
                  value={deliveryAddress.reference ?? ""}
                  onChange={(event) =>
                    setDeliveryAddressField("reference", event.target.value)
                  }
                />
              </label>
            </>
          ) : (
            <>
              {renderHiddenDeliveryAddressFields()}
              <div className="detail-block order-form-wide">
                <strong>Endereço do cliente</strong>
                <span>
                  {formatFreightAddress(deliveryAddress) ||
                    "Cliente sem endereço cadastrado."}
                </span>
              </div>
            </>
          )}
        </div>
        {mode === "create" ? (
          <div className="action-toolbar">
            <div className="toolbar-group">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setActivePanel("pedido")}
              >
                Voltar
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => setActivePanel("itens")}
              >
                Avançar para itens
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section
        className={`card page-stack ${
          activePanel === "itens" ? "" : "order-panel-hidden"
        }`}
      >
        <div className="section-heading">
          <h3>Itens e referências</h3>
        </div>
        <span className="muted">
          Os itens do modelo já aparecem preenchidos. Você pode acrescentar
          quantidade extra quando precisar.
        </span>
        <div className="order-items-overview">
          <div className="detail-block">
            <strong>Modelo</strong>
            <span>
              {selectedOrderType?.name ?? "Selecione um tipo de pedido."}
            </span>
          </div>
          <div className="detail-block">
            <strong>Produtos incluídos</strong>
            <span>
              {selectedProducts.length} de{" "}
              {selectedOrderType?.products.length ?? 0}
            </span>
          </div>
          <div className="detail-block">
            <strong>Peso estimado</strong>
            <span>{formatWeight(itemsWeight)}</span>
          </div>
          <div className="detail-block">
            <strong>Total dos itens</strong>
            <span>{formatCurrency(itemsTotal)}</span>
          </div>
        </div>
        <div className="order-products-list">
          {selectedOrderType ? (
            selectedOrderType.products.map(renderProductCard)
          ) : (
            <span>Selecione um tipo de pedido.</span>
          )}
        </div>
        {orderImageAttachments.length ? (
          <div className="order-reference-section">
            <div className="section-heading">
              <h3>Referências do pedido</h3>
              <span className="badge">{orderImageAttachments.length}</span>
            </div>
            <div className="image-gallery">
              {orderImageAttachments.map((attachment) => (
                <a
                  key={attachment.id}
                  className="image-card"
                  href={`/api/files/${attachment.storedFile.id}`}
                  target="_blank"
                >
                  <img
                    src={`/api/files/${attachment.storedFile.id}`}
                    alt={attachment.storedFile.originalName}
                    className="image-card-preview"
                  />
                  <span className="image-card-caption">
                    {attachment.storedFile.originalName}
                  </span>
                </a>
              ))}
            </div>
          </div>
        ) : null}
        {mode === "create" ? (
          <div className="action-toolbar">
            <div className="toolbar-group">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setActivePanel("destino")}
              >
                Voltar
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => setActivePanel(finalCreatePanel)}
              >
                {isAdminView
                  ? "Avançar para revisão"
                  : "Avançar para finalização"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section
        className={`card page-stack ${
          activePanel === "resumo" ||
          activePanel === "custos" ||
          activePanel === "finalizacao"
            ? ""
            : "order-panel-hidden"
        }`}
      >
        <div className="section-heading">
          <h3>
            {mode === "create"
              ? isAdminView
                ? "Revisão final"
                : "Confirmação do pedido"
              : "Ajustes finais do pedido"}
          </h3>
        </div>
        <div className="order-form-split">
          <div className="page-stack">
            <div className="card page-stack">
              <p className="eyebrow">
                {isAdminView ? "Prazo e entrega" : "Forma de entrega"}
              </p>
              <div className="form-grid">
                <label className="field">
                  <span>Como será a entrega</span>
                  <select
                    name="shippingMethodId"
                    required
                    value={selectedShippingMethodId}
                    onChange={(event) =>
                      setSelectedShippingMethodId(event.target.value)
                    }
                  >
                    <option value="">Selecione</option>
                    {shippingMethods.map((shippingMethod) => (
                      <option key={shippingMethod.id} value={shippingMethod.id}>
                        {shippingMethod.name}
                      </option>
                    ))}
                  </select>
                </label>
                {isAdminView ? (
                  <label className="field">
                    <span>Prazo previsto</span>
                    <input
                      type="date"
                      name="expectedAt"
                      defaultValue={formatInputDate(item?.expectedAt)}
                    />
                  </label>
                ) : (
                  <input
                    type="hidden"
                    name="expectedAt"
                    value={formatInputDate(item?.expectedAt)}
                  />
                )}
                <input
                  type="hidden"
                  name="shippingPrice"
                  value={shippingPriceValue.toFixed(2)}
                />
                <div className="detail-block">
                  <strong>Frete calculado</strong>
                  <span>{formatCurrency(shippingPriceValue)}</span>
                </div>
              </div>
            </div>

            {isAdminView ? (
              <div className="card page-stack">
                <p className="eyebrow">Ajustes de valor</p>
                <div className="form-grid">
                  <label className="field">
                    <span>Valor adicional</span>
                    <input
                      name="additionalChargeAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={additionalChargeAmount}
                      onChange={(event) =>
                        setAdditionalChargeAmount(event.target.value)
                      }
                    />
                  </label>
                  <label className="field order-form-wide">
                    <span>Motivo do valor adicional</span>
                    <textarea
                      name="additionalChargeReason"
                      rows={3}
                      defaultValue={item?.additionalChargeReason ?? ""}
                      placeholder="Ex.: mudança no endereço, itens extras, embalagem especial."
                    />
                  </label>
                </div>
              </div>
            ) : (
              <>
                <input
                  type="hidden"
                  name="additionalChargeAmount"
                  value={additionalChargeAmount}
                />
                <input
                  type="hidden"
                  name="additionalChargeReason"
                  value={item?.additionalChargeReason ?? ""}
                />
              </>
            )}

            {!isClientView ? (
              <div className="card page-stack">
                <p className="eyebrow">Fornecedores vinculados</p>
                <div className="order-products-list">
                  {suppliers.map((supplier) => (
                    <label key={supplier.id} className="field-checkbox">
                      <input
                        type="checkbox"
                        name="supplierId"
                        value={supplier.id}
                        checked={selectedSupplierIds.includes(supplier.id)}
                        onChange={(event) =>
                          toggleSupplier(supplier.id, event.target.checked)
                        }
                      />
                      <span>{supplier.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {isAdminView ? (
              <div className="card page-stack">
                <p className="eyebrow">Observações finais</p>
                <label className="field">
                  <span>Notas complementares</span>
                  <textarea
                    name="notes"
                    rows={4}
                    defaultValue={item?.notes ?? ""}
                  />
                </label>
              </div>
            ) : (
              <input type="hidden" name="notes" value={item?.notes ?? ""} />
            )}
          </div>
          {renderSummary()}
        </div>
        <div className="action-toolbar">
          <div className="toolbar-group">
            {mode === "create" ? (
              <button
                className="ghost-button"
                type="button"
                onClick={() => setActivePanel("itens")}
              >
                Voltar
              </button>
            ) : null}
            <button className="primary-button" type="submit">
              {submitLabel}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
