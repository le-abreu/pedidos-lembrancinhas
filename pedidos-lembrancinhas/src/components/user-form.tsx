"use client";

import { useEffect, useState } from "react";
import { UserProfileType } from "@prisma/client";

type Option = {
  id: string;
  name: string;
};

type CompanyOption = {
  id: string;
  tradeName: string;
};

type CustomerOption = Option & {
  companyId: string;
  companyName?: string;
};

type SupplierAccess = {
  supplierId: string;
  role: string | null;
};

type UserFormItem = {
  id: string;
  name: string;
  email: string;
  companyId: string | null;
  customerId: string | null;
  supplierId: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  profiles?: Array<{ profile: UserProfileType }>;
  customerAccesses?: Array<{
    customerId: string;
    customer?: {
      id: string;
      name: string;
      companyId: string;
      company?: {
        tradeName: string;
      } | null;
    } | null;
  }>;
  supplierAccesses?: Array<{
    supplierId: string;
    role: string | null;
    supplier?: {
      id: string;
      name: string;
    } | null;
  }>;
} | null;

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  redirectPath: string;
  item?: UserFormItem;
  companies: CompanyOption[];
  customers: CustomerOption[];
  suppliers: Option[];
};

function formatDateTime(value?: Date | string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function UserForm({
  action,
  submitLabel,
  redirectPath,
  item,
  companies,
  customers,
  suppliers,
}: Props) {
  const initialProfiles = item?.profiles?.map((profile) => profile.profile) ?? [];
  const initialCustomerIds =
    item?.customerAccesses?.map((access) => access.customerId) ??
    (item?.customerId ? [item.customerId] : []);
  const initialSupplierAccesses =
    item?.supplierAccesses?.map((access) => ({
      supplierId: access.supplierId,
      role: access.role,
    })) ??
    (item?.supplierId ? [{ supplierId: item.supplierId, role: null }] : []);

  const [selectedProfiles, setSelectedProfiles] = useState<UserProfileType[]>(initialProfiles);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>(initialCustomerIds);
  const [supplierAccesses, setSupplierAccesses] = useState<SupplierAccess[]>(initialSupplierAccesses);

  useEffect(() => {
    if (selectedProfiles.includes(UserProfileType.ADMIN)) {
      setSelectedCustomerIds([]);
      setSupplierAccesses([]);
    }
  }, [selectedProfiles]);

  const isAdmin = selectedProfiles.includes(UserProfileType.ADMIN);
  const isClient = !isAdmin && selectedProfiles.includes(UserProfileType.CLIENT);
  const isExecutor = !isAdmin && selectedProfiles.includes(UserProfileType.EXECUTOR);
  const selectedCustomers = customers.filter((customer) => selectedCustomerIds.includes(customer.id));
  const primaryCompanyId = selectedCustomers[0]?.companyId ?? "";

  const groupedCompanies = companies
    .map((company) => ({
      ...company,
      customers: customers.filter((customer) => customer.companyId === company.id),
    }))
    .filter((company) => company.customers.length);

  function toggleProfile(profile: UserProfileType, checked: boolean) {
    setSelectedProfiles((current) =>
      checked ? [...new Set([...current, profile])] : current.filter((item) => item !== profile),
    );
  }

  function toggleCustomer(customerId: string, checked: boolean) {
    setSelectedCustomerIds((current) =>
      checked ? [...new Set([...current, customerId])] : current.filter((item) => item !== customerId),
    );
  }

  function toggleSupplier(supplierId: string, checked: boolean) {
    setSupplierAccesses((current) => {
      if (checked) {
        if (current.some((item) => item.supplierId === supplierId)) {
          return current;
        }

        return [...current, { supplierId, role: null }];
      }

      return current.filter((item) => item.supplierId !== supplierId);
    });
  }

  function updateSupplierRole(supplierId: string, role: string) {
    setSupplierAccesses((current) =>
      current.map((item) => (item.supplierId === supplierId ? { ...item, role } : item)),
    );
  }

  return (
    <form action={action} className="page-stack">
      <input type="hidden" name="redirectPath" value={redirectPath} />
      <input type="hidden" name="primaryCompanyId" value={primaryCompanyId} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <div className="card page-stack">
        <div className="section-heading">
          <h3>Dados base</h3>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Nome</span>
            <input name="name" required defaultValue={item?.name ?? ""} />
          </label>
          <label className="field">
            <span>E-mail</span>
            <input name="email" type="email" required defaultValue={item?.email ?? ""} />
          </label>
          <label className="field">
            <span>{item ? "Nova senha" : "Senha"}</span>
            <input name="password" type="password" {...(item ? {} : { required: true })} />
            <small className="muted">
              {item ? "Preencha apenas se quiser alterar a senha atual." : "A senha será armazenada codificada."}
            </small>
          </label>
          {item ? (
            <>
              <div className="detail-block">
                <strong>Cadastro</strong>
                <span>{formatDateTime(item.createdAt)}</span>
              </div>
              <div className="detail-block">
                <strong>Última alteração</strong>
                <span>{formatDateTime(item.updatedAt)}</span>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="card page-stack">
        <div className="section-heading">
          <h3>Configuração do perfil</h3>
        </div>
        <div className="compact-stack">
          {Object.values(UserProfileType).map((profile) => (
            <label key={profile} className="field-checkbox">
              <input
                type="checkbox"
                name="profiles"
                value={profile}
                checked={selectedProfiles.includes(profile)}
                onChange={(event) => toggleProfile(profile, event.target.checked)}
              />
              <span>{profile}</span>
            </label>
          ))}
          <span className="muted">Se ADMIN estiver marcado, os vínculos operacionais não são exibidos.</span>
        </div>
      </div>

      {isClient ? (
        <div className="card page-stack">
          <div className="section-heading">
            <h3>Clientes por empresa</h3>
          </div>
          <span className="muted">
            Selecione os clientes que este usuário pode solicitar pedidos e visualizar.
          </span>
          <div className="page-stack">
            {groupedCompanies.map((company) => (
              <div key={company.id} className="card page-stack">
                <p className="eyebrow">{company.tradeName}</p>
                <div className="compact-stack">
                  {company.customers.map((customer) => (
                    <label key={customer.id} className="field-checkbox">
                      <input
                        type="checkbox"
                        name="customerAccessId"
                        value={customer.id}
                        checked={selectedCustomerIds.includes(customer.id)}
                        onChange={(event) => toggleCustomer(customer.id, event.target.checked)}
                      />
                      <span>{customer.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {isExecutor ? (
        <div className="card page-stack">
          <div className="section-heading">
            <h3>Vínculo com fornecedores</h3>
          </div>
          <span className="muted">Defina os fornecedores vinculados ao usuário e descreva o papel em cada um.</span>
          <div className="page-stack">
            {suppliers.map((supplier) => {
              const selectedAccess = supplierAccesses.find((item) => item.supplierId === supplier.id);

              return (
                <div key={supplier.id} className="card page-stack">
                  <label className="field-checkbox">
                    <input
                      type="checkbox"
                      name="supplierAccessId"
                      value={supplier.id}
                      checked={Boolean(selectedAccess)}
                      onChange={(event) => toggleSupplier(supplier.id, event.target.checked)}
                    />
                    <span>{supplier.name}</span>
                  </label>
                  {selectedAccess ? (
                    <label className="field">
                      <span>Papel / vínculo</span>
                      <input
                        name={`supplierAccessRole:${supplier.id}`}
                        value={selectedAccess.role ?? ""}
                        onChange={(event) => updateSupplierRole(supplier.id, event.target.value)}
                        placeholder="Ex.: atendimento, produção, acabamento"
                      />
                    </label>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
