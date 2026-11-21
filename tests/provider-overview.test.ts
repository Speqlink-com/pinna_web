import { after, before, mock, test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Window } from "happy-dom";
import { previewUsers, previewProviders } from "../lib/preview";
import type { DashboardData } from "../lib/types";

let ProviderOverview: typeof import("../components/provider-overview").ProviderOverview;
let BusinessNotifications: typeof import("../components/business-notifications").BusinessNotifications;
let AdminOverview: typeof import("../components/admin-overview").AdminOverview;
before(async () => {
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
  ({ ProviderOverview } = await import("../components/provider-overview"));
  ({ BusinessNotifications } =
    await import("../components/business-notifications"));
  ({ AdminOverview } = await import("../components/admin-overview"));
});
after(() => mock.restoreAll());

test("admin overview preserves server metrics and the exact approval/location routes", async () => {
  const browser = new Window();
  const id = "00000000-0000-4000-8000-000000000011";
  try {
    browser.document.body.innerHTML = renderToStaticMarkup(
      createElement(AdminOverview, {
        user: previewUsers.admin,
        data: {
          portfolios: [
            { ...previewProviders[0], id, status: "ADMIN_RECOMMENDED" },
          ],
          conversations: [],
          admins: [],
          stats: [
            {
              label: "Business location reviews",
              value: 7,
              detail: "Awaiting location approval",
            },
          ],
        },
      }),
    );
    const doc = browser.document;
    assert.equal(doc.querySelector(".stat-card strong")?.textContent, "7");
    assert.equal(
      doc.querySelector(".admin-queue-row")?.getAttribute("href"),
      `/dashboard/applications?portfolio=${id}`,
    );
    assert.equal(
      doc.querySelector(".provider-banner-link")?.getAttribute("href"),
      "/dashboard/applications?status=ADMIN_RECOMMENDED",
    );
    assert.doesNotMatch(doc.body.textContent ?? "", /bismart/i);
  } finally {
    await browser.happyDOM.close();
  }
});

const empty: DashboardData = {
  portfolios: [],
  conversations: [],
  admins: [],
  stats: [],
};

test("provider overview keeps an empty account actionable without inventing activity", async () => {
  const browser = new Window();
  try {
    browser.document.body.innerHTML = renderToStaticMarkup(
      createElement(ProviderOverview, {
        user: previewUsers.business,
        data: empty,
      }),
    );
    const doc = browser.document;
    assert.match(doc.body.textContent ?? "", /Register your first business/);
    assert.match(
      doc.body.textContent ?? "",
      /Customer enquiries will appear here/,
    );
    assert.deepEqual(
      [...doc.querySelectorAll(".provider-metric > strong")].map(
        (n) => n.textContent,
      ),
      ["0", "0", "0", "0"],
    );
    assert.equal(
      doc.querySelector(".provider-first-business a")?.getAttribute("href"),
      "/dashboard/portfolios?create=1",
    );
  } finally {
    await browser.happyDOM.close();
  }
});

test("provider overview derives counts and routes actions to the exact business and conversation", async () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const data: DashboardData = {
    ...empty,
    portfolios: [
      { ...previewProviders[0], id, status: "APPROVED" },
      {
        ...previewProviders[1],
        id: "00000000-0000-4000-8000-000000000002",
        status: "SUBMITTED",
      },
    ],
    conversations: [
      {
        id: "synthetic-thread",
        portfolio_id: id,
        provider_name: "Synthetic clinic",
        customer_name: "Synthetic customer",
        last_message: "Synthetic enquiry",
        updated_at: "2026-11-21T08:00:00Z",
      },
    ],
  };
  const browser = new Window();
  try {
    browser.document.body.innerHTML = renderToStaticMarkup(
      createElement(ProviderOverview, { user: previewUsers.business, data }),
    );
    const doc = browser.document;
    assert.deepEqual(
      [...doc.querySelectorAll(".provider-metric > strong")].map(
        (n) => n.textContent,
      ),
      ["2", "1", "1", "1"],
    );
    assert.equal(
      doc.querySelector(".provider-business-summary a")?.getAttribute("href"),
      `/dashboard/portfolios?portfolio=${id}`,
    );
    assert.equal(
      doc.querySelector(".provider-conversation")?.getAttribute("href"),
      "/dashboard/messages?conversation=synthetic-thread",
    );
    const operationLink = [...doc.querySelectorAll("a")].find((a) =>
      a.textContent?.includes("Keep availability up to date"),
    );
    assert.equal(
      operationLink?.getAttribute("href"),
      `/dashboard/portfolios?portfolio=${id}&tab=operations`,
    );
  } finally {
    await browser.happyDOM.close();
  }
});

test("business notifications show current approval states and route to the matching location", async () => {
  const browser = new Window();
  try {
    browser.document.body.innerHTML = renderToStaticMarkup(
      createElement(BusinessNotifications, {
        portfolios: [
          {
            ...previewProviders[0],
            id: "synthetic-location",
            status: "CHANGES_REQUESTED",
          },
        ],
      }),
    );
    const doc = browser.document;
    assert.equal(
      doc.querySelector("summary")?.getAttribute("aria-label"),
      "Open business notifications",
    );
    assert.match(
      doc.querySelector("li")?.textContent ?? "",
      /Changes requested/,
    );
    assert.equal(
      doc.querySelector("li a")?.getAttribute("href"),
      "/dashboard/portfolios?portfolio=synthetic-location",
    );
    assert.doesNotMatch(doc.body.textContent ?? "", /unread/i);
  } finally {
    await browser.happyDOM.close();
  }
});
