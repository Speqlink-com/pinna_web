import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Window } from "happy-dom";
import { ProviderOverview } from "../components/provider-overview";
import { previewUsers, previewProviders } from "../lib/preview";
import type { DashboardData } from "../lib/types";

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
