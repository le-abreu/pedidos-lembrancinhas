"use client";

import { useState } from "react";

type BaseFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  redirectPath: string;
};

type CustomerFormItem = {
  id: string;
  companyId: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  addressZipCode: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressReference: string | null;
  notes: string | null;
};

type CustomerAddress = {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  reference: string;
};

type ZipCodeResponse = {
  zipCode: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

function getInitialAddress(item: CustomerFormItem | null | undefined): CustomerAddress {
  return {
    zipCode: item?.addressZipCode ?? "",
    street: item?.addressStreet ?? "",
    number: item?.addressNumber ?? "",
    complement: item?.addressComplement ?? "",
    neighborhood: item?.addressNeighborhood ?? "",
    city: item?.addressCity ?? "",
    state: item?.addressState ?? "",
    reference: item?.addressReference ?? "",
  };
}

export function CustomerForm({
  action,
  submitLabel,
  redirectPath,
  item,
  companies,
}: BaseFormProps & {
  item?: CustomerFormItem | null;
  companies: Array<{ id: string; tradeName: string }>;
}) {
  const [address, setAddress] = useState<CustomerAddress>(
    getInitialAddress(item)
  );
  const [zipCodeLookupStatus, setZipCodeLookupStatus] = useState("");

  function setAddressField(field: keyof CustomerAddress, value: string) {
    setAddress((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function lookupZipCodeAddress() {
    const zipCode = address.zipCode.replace(/\D/g, "");

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

      const nextAddress = (await response.json()) as ZipCodeResponse;

      setAddress((current) => ({
        ...current,
        zipCode: nextAddress.zipCode,
        street: nextAddress.street,
        complement: current.complement || nextAddress.complement,
        neighborhood: nextAddress.neighborhood,
        city: nextAddress.city,
        state: nextAddress.state,
      }));
      setZipCodeLookupStatus("Endereço carregado pelo CEP.");
    } catch {
      setZipCodeLookupStatus("Não foi possível buscar o CEP.");
    }
  }

  return (
    <form action={action} className="customer-form">
      <input type="hidden" name="redirectPath" value={redirectPath} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <section className="form-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Cadastro</p>
            <h3>Dados principais</h3>
          </div>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Empresa</span>
            <select
              name="companyId"
              required
              defaultValue={item?.companyId ?? ""}
            >
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
        </div>
      </section>

      <section className="form-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Contato</p>
            <h3>Dados de contato</h3>
          </div>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>E-mail</span>
            <input name="email" type="email" defaultValue={item?.email ?? ""} />
          </label>
          <label className="field">
            <span>Telefone</span>
            <input name="phone" defaultValue={item?.phone ?? ""} />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Entrega</p>
            <h3>Endereço</h3>
          </div>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>CEP</span>
            <input
              name="addressZipCode"
              value={address.zipCode}
              onChange={(event) =>
                setAddressField("zipCode", event.target.value)
              }
              onBlur={lookupZipCodeAddress}
            />
            {zipCodeLookupStatus ? (
              <span className="muted">{zipCodeLookupStatus}</span>
            ) : null}
          </label>
          <label className="field">
            <span>Logradouro</span>
            <input
              name="addressStreet"
              value={address.street}
              onChange={(event) =>
                setAddressField("street", event.target.value)
              }
            />
          </label>
          <label className="field">
            <span>Número</span>
            <input
              name="addressNumber"
              value={address.number}
              onChange={(event) =>
                setAddressField("number", event.target.value)
              }
            />
          </label>
          <label className="field">
            <span>Complemento</span>
            <input
              name="addressComplement"
              value={address.complement}
              onChange={(event) =>
                setAddressField("complement", event.target.value)
              }
            />
          </label>
          <label className="field">
            <span>Bairro</span>
            <input
              name="addressNeighborhood"
              value={address.neighborhood}
              onChange={(event) =>
                setAddressField("neighborhood", event.target.value)
              }
            />
          </label>
          <label className="field">
            <span>Cidade</span>
            <input
              name="addressCity"
              value={address.city}
              onChange={(event) => setAddressField("city", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Estado</span>
            <input
              name="addressState"
              maxLength={2}
              value={address.state}
              onChange={(event) =>
                setAddressField("state", event.target.value.toUpperCase())
              }
            />
          </label>
          <label className="field order-form-wide">
            <span>Referência</span>
            <input
              name="addressReference"
              value={address.reference}
              onChange={(event) =>
                setAddressField("reference", event.target.value)
              }
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Interno</p>
            <h3>Observações</h3>
          </div>
        </div>
        <label className="field">
          <span>Observação</span>
          <textarea name="notes" rows={4} defaultValue={item?.notes ?? ""} />
        </label>
      </section>

      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
