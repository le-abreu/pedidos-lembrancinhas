CREATE TABLE "ShippingMethod" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShippingMethod_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShippingMethod_name_key" ON "ShippingMethod"("name");

INSERT INTO "ShippingMethod" ("id", "name", "description", "active", "createdAt", "updatedAt")
VALUES
  ('ship_retirada', 'Retirada', 'Cliente retira o pedido no local combinado.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ship_entrega_propria', 'Entrega própria', 'Entrega realizada pela operação interna.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ship_motoboy', 'Motoboy', 'Entrega urbana rápida por parceiro motoboy.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ship_correios', 'Correios', 'Envio pelos Correios.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ship_transportadora', 'Transportadora', 'Envio por transportadora.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "Order"
ADD COLUMN "shippingMethodId" TEXT,
ADD COLUMN "shippingPrice" DECIMAL(10, 2) NOT NULL DEFAULT 0;

UPDATE "Order"
SET "shippingMethodId" = CASE "shippingType"
  WHEN 'RETIRADA' THEN 'ship_retirada'
  WHEN 'ENTREGA_PROPRIA' THEN 'ship_entrega_propria'
  WHEN 'MOTOBOY' THEN 'ship_motoboy'
  WHEN 'CORREIOS' THEN 'ship_correios'
  WHEN 'TRANSPORTADORA' THEN 'ship_transportadora'
  ELSE 'ship_retirada'
END;

ALTER TABLE "Order"
ALTER COLUMN "shippingMethodId" SET NOT NULL;

ALTER TABLE "Order"
ADD CONSTRAINT "Order_shippingMethodId_fkey"
FOREIGN KEY ("shippingMethodId") REFERENCES "ShippingMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Order" DROP COLUMN "shippingType";

DROP TYPE "ShippingType";
