// node --experimental-strip-types --test lib/rate-limit.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, payloadTooLarge, isSameOrigin } from "./rate-limit-core.ts";

function req(headers: Record<string, string>): Request {
  return new Request("https://jayacademy.com.br/api/x", { headers });
}

test("clientIp pega o primeiro do x-forwarded-for", () => {
  assert.equal(clientIp(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })), "1.2.3.4");
  assert.equal(clientIp(req({ "x-real-ip": "9.9.9.9" })), "9.9.9.9");
  assert.equal(clientIp(req({})), "unknown");
});

test("payloadTooLarge respeita o Content-Length", () => {
  assert.equal(payloadTooLarge(req({ "content-length": "100" }), 64), true);
  assert.equal(payloadTooLarge(req({ "content-length": "10" }), 64), false);
  assert.equal(payloadTooLarge(req({}), 64), false); // sem header = 0
});

test("isSameOrigin aceita mesmo host e rejeita externo", () => {
  const host = "jayacademy.com.br";
  assert.equal(
    isSameOrigin(req({ host, origin: "https://jayacademy.com.br" })),
    true
  );
  assert.equal(
    isSameOrigin(req({ host, referer: "https://jayacademy.com.br/basic-nanofios" })),
    true
  );
  assert.equal(
    isSameOrigin(req({ host, origin: "https://site-malicioso.com" })),
    false
  );
  // sem origin/referer: bloqueia por padrão, permite com allowEmpty
  assert.equal(isSameOrigin(req({ host })), false);
  assert.equal(isSameOrigin(req({ host }), true), true);
  // sem host: nunca same-origin
  assert.equal(isSameOrigin(req({ origin: "https://jayacademy.com.br" })), false);
});
