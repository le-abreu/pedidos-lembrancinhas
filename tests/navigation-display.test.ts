import assert from "node:assert/strict";
import { test } from "node:test";

import { getNavigationIconKey } from "../src/lib/navigation-display";

test("uses stable icon keys for known navigation paths", () => {
  assert.equal(getNavigationIconKey("/", "Dashboard"), "dashboard");
  assert.equal(getNavigationIconKey("/orders", "Pedidos"), "orders");
  assert.equal(getNavigationIconKey("/financial", "Financeiro"), "financial");
});

test("uses label fallback icon keys when path is unknown", () => {
  assert.equal(getNavigationIconKey("/custom", "Clientes"), "customers");
  assert.equal(getNavigationIconKey("/custom", "Tipos de pedido"), "order-types");
});

test("falls back to default icon when path and label are unknown", () => {
  assert.equal(getNavigationIconKey("/custom", "Área nova"), "default");
  assert.equal(getNavigationIconKey("", ""), "default");
});
