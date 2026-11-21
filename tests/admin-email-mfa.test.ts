import { after, before, test, mock } from "node:test";
import assert from "node:assert/strict";
import { act, createElement } from "react";
import type { Root } from "react-dom/client";
import { Window } from "happy-dom";
import type { User } from "../lib/types";

const browser = new Window({ url: "http://localhost:3000/verify-security" });
const originalFetch = globalThis.fetch;
const originalGlobals = new Map<string, PropertyDescriptor | undefined>();
let createRoot: typeof import("react-dom/client").createRoot;
let AuthScreen: typeof import("../components/auth-screen").AuthScreen;

before(async () => {
  const globals = {
    window: browser,
    self: browser,
    document: browser.document,
    navigator: browser.navigator,
    HTMLElement: browser.HTMLElement,
    HTMLInputElement: browser.HTMLInputElement,
    HTMLFormElement: browser.HTMLFormElement,
    Node: browser.Node,
    Event: browser.Event,
    MouseEvent: browser.MouseEvent,
    FormData: browser.FormData,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  for (const [key, value] of Object.entries(globals)) {
    originalGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  }
  mock.module("next/image.js", {
    defaultExport: ({
      src,
      alt,
      width,
      height,
      className,
    }: {
      src: string;
      alt: string;
      width?: number;
      height?: number;
      className?: string;
    }) => createElement("img", { src, alt, width, height, className }),
  });
  ({ createRoot } = await import("react-dom/client"));
  ({ AuthScreen } = await import("../components/auth-screen"));
});

after(async () => {
  globalThis.fetch = originalFetch;
  mock.restoreAll();
  await browser.happyDOM.close();
  for (const [key, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

for (const role of ["ADMIN", "SUPER_ADMIN"] as const) {
  test(
    `${role} can enter and verify an email OTP after requesting it`,
    { timeout: 10000 },
    async () => {
      const calls: { path: string; body: unknown }[] = [];
      const redirects: string[] = [];
      browser.location.assign = (url: string | URL) => {
        redirects.push(String(url));
      };
      globalThis.fetch = async (input, options) => {
        const path = String(input);
        const body = JSON.parse(String(options?.body));
        calls.push({ path, body });
        if (path.endsWith("/auth/mfa/email/send")) {
          return Response.json({
            message:
              "A six-digit sign-in code was sent to your verified email.",
            resendAfter: 60,
          });
        }
        if (path.endsWith("/auth/mfa/email/verify")) {
          if (body.code !== "123456")
            return Response.json(
              { error: "Invalid email sign-in code." },
              { status: 400 },
            );
          return Response.json({ redirect: "/dashboard", recoveryCodes: [] });
        }
        throw new Error("Unexpected authentication request");
      };
      const user: User = {
        id: `synthetic-${role}`,
        name: "Synthetic Admin",
        email: "admin@example.test",
        role,
        mustChangePassword: false,
        mfaEnrolled: false,
        mfaRequired: true,
      };
      const container = document.createElement("div");
      document.body.append(container);
      let root: Root | undefined;
      try {
        await act(async () => {
          root = createRoot(container);
          root.render(
            createElement(AuthScreen, { mode: "verify-security", user }),
          );
        });
        function button(label: string) {
          const found = [...container.querySelectorAll("button")].find(
            (b) => b.textContent?.trim() === label,
          );
          assert.ok(found, `Missing button: ${label}`);
          return found;
        }
        await act(async () => {
          button("Email OTP").click();
        });
        assert.ok(
          container.querySelector('input[name="code"]'),
          "Code entry is visible before sending or after a page refresh",
        );
        await act(async () => {
          button("Send email code").click();
        });
        assert.equal(calls[0].path, "/api/v1/auth/mfa/email/send");
        assert.match(
          container.querySelector('[role="status"]')?.textContent ?? "",
          /code was sent/,
        );
        assert.equal(
          Boolean(container.querySelector(".success-state")),
          false,
          "Sending an OTP must not replace the login form with a completion screen",
        );
        const input =
          container.querySelector<HTMLInputElement>('input[name="code"]');
        assert.ok(
          input,
          "Code entry remains visible after the success response",
        );
        assert.ok(
          document.activeElement === input,
          "Focus moves to the code entry field",
        );
        assert.equal(input.maxLength, 6);
        assert.equal(input.inputMode, "numeric");
        const form = input.closest("form");
        assert.ok(form);
        assert.equal(
          form.querySelector<HTMLButtonElement>('button[type="submit"]')
            ?.disabled,
          false,
        );
        input.value = "000000";
        await act(async () => {
          form.dispatchEvent(
            new browser.Event("submit", {
              bubbles: true,
              cancelable: true,
            }) as unknown as Event,
          );
        });
        assert.match(
          container.querySelector('[role="alert"]')?.textContent ?? "",
          /Invalid email sign-in code/,
        );
        assert.ok(
          container.querySelector('input[name="code"]'),
          "Incorrect code feedback retains code entry",
        );
        input.value = "123456";
        await act(async () => {
          form.dispatchEvent(
            new browser.Event("submit", {
              bubbles: true,
              cancelable: true,
            }) as unknown as Event,
          );
        });
        assert.deepEqual(calls.at(-1), {
          path: "/api/v1/auth/mfa/email/verify",
          body: { code: "123456" },
        });
        assert.deepEqual(redirects, ["/dashboard"]);
      } finally {
        if (root)
          await act(async () => {
            root!.unmount();
          });
        container.remove();
      }
    },
  );
}
