import { test } from "node:test";
import assert from "node:assert/strict";
import { isBlockedHost } from "./net-guard.ts";

test("hosts internos/privados são bloqueados", () => {
  assert.equal(isBlockedHost("localhost"), true);
  assert.equal(isBlockedHost("algo.local"), true);
  assert.equal(isBlockedHost("metadata.google.internal"), true);
  assert.equal(isBlockedHost("127.0.0.1"), true);
  assert.equal(isBlockedHost("127.55.1.2"), true);
  assert.equal(isBlockedHost("0.0.0.0"), true);
  assert.equal(isBlockedHost("169.254.169.254"), true);
  assert.equal(isBlockedHost("10.1.2.3"), true);
  assert.equal(isBlockedHost("192.168.0.1"), true);
  assert.equal(isBlockedHost("172.16.5.5"), true);
  assert.equal(isBlockedHost("172.20.1.1"), true);
  assert.equal(isBlockedHost("172.32.1.1"), false);
  assert.equal(isBlockedHost("::1"), true);
  assert.equal(isBlockedHost("[::1]"), true);
  assert.equal(isBlockedHost("fe80::1"), true);
  assert.equal(isBlockedHost("fc00::1"), true);
  assert.equal(isBlockedHost("fd12::1"), true);
});

test("hosts públicos NÃO são bloqueados", () => {
  assert.equal(isBlockedHost("example.com"), false);
  assert.equal(isBlockedHost("8.8.8.8"), false);
  assert.equal(isBlockedHost("meusite.com.br"), false);
});
