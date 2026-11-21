"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { OpeningHours } from "@/lib/client-types";
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
type Offering = {
  name: string;
  available: boolean;
  trackInventory: boolean;
  quantity: number;
};
type State = {
  revision: number;
  acceptingCustomers: boolean;
  openingHours: OpeningHours[];
  services: Offering[];
  movements: {
    id: number;
    service_name: string;
    delta: number;
    balance: number;
    reason: string;
    created_at: string;
  }[];
};
export function LocationOperations({
  id,
  onSaved,
}: {
  id: string;
  onSaved: () => Promise<void>;
}) {
  const [state, setState] = useState<State | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    api<State>(`portfolios/${id}/operations`)
      .then((s) => {
        if (active) setState(s);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  async function save() {
    if (!state) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api<State>(`portfolios/${id}/operations`, {
        revision: state.revision,
        acceptingCustomers: state.acceptingCustomers,
        openingHours: state.openingHours,
        services: state.services,
        reason,
      });
      setState(result);
      setReason("");
      setMessage("Availability, opening hours and inventory saved.");
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save operations.");
    } finally {
      setBusy(false);
    }
  }
  function service(index: number, patch: Partial<Offering>) {
    setState((s) =>
      s
        ? {
            ...s,
            services: s.services.map((item, i) =>
              i === index ? { ...item, ...patch } : item,
            ),
          }
        : null,
    );
  }
  function hours(index: number, patch: Partial<OpeningHours>) {
    setState((s) =>
      s
        ? {
            ...s,
            openingHours: s.openingHours.map((h, i) =>
              i === index ? { ...h, ...patch } : h,
            ),
          }
        : null,
    );
  }
  return (
    <div className="operations-panel">
      <div>
        <span className="eyebrow">LIVE OPERATIONS · THIS LOCATION</span>
        <h2>Availability & inventory</h2>
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              setState(await api<State>(`portfolios/${id}/operations`));
              setReason("");
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Could not reload operations.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          Reload live operations
        </button>
        <p>
          Changes apply immediately to this location. Business identity,
          licences and catalogue changes continue through review. Hours use East
          Africa Time.
        </p>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      {!state ? (
        <p>Loading operating controls…</p>
      ) : (
        <>
          <fieldset disabled={busy}>
            <label className="operation-toggle">
              <input
                type="checkbox"
                checked={state.acceptingCustomers}
                onChange={(e) =>
                  setState({ ...state, acceptingCustomers: e.target.checked })
                }
              />{" "}
              Accept customer requests during opening hours
            </label>
            <p className="small-muted">
              Turn this off for temporary closure. Customers can still message
              you.
            </p>
            <h3>Services & products</h3>
            {state.services.map((item, index) => (
              <div className="operation-row" key={item.name}>
                <strong>{item.name}</strong>
                <label className="operation-toggle">
                  <input
                    type="checkbox"
                    checked={item.available}
                    onChange={(e) =>
                      service(index, { available: e.target.checked })
                    }
                  />{" "}
                  Available
                </label>
                <label className="operation-toggle">
                  <input
                    type="checkbox"
                    checked={item.trackInventory}
                    onChange={(e) =>
                      service(index, { trackInventory: e.target.checked })
                    }
                  />{" "}
                  Track inventory
                </label>
                <label>
                  Stock on hand
                  <input
                    type="number"
                    aria-label={`${item.name} stock on hand`}
                    min={0}
                    max={1000000000}
                    step={1}
                    disabled={!item.trackInventory}
                    value={item.quantity}
                    onChange={(e) =>
                      service(index, { quantity: Number(e.target.value) })
                    }
                  />
                </label>
              </div>
            ))}
            {!state.services.length && (
              <p>Add services or products to the business catalogue first.</p>
            )}
            <p className="small-muted">
              Inventory is optional for each offering. Stock at zero marks a
              tracked item out of stock. Ambulance and other services can use
              availability without tracking stock. Every stock adjustment
              retains a reason and balance.
            </p>
            <h3>Opening hours</h3>
            {state.openingHours.length === 0 && (
              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  setState({
                    ...state,
                    openingHours: days.map((_, day) => ({
                      day,
                      closed: false,
                      allDay: false,
                      opens: "08:00",
                      closes: "21:00",
                      overnight: false,
                    })),
                  })
                }
              >
                Set a weekly schedule
              </button>
            )}
            {state.openingHours.map((h, index) => (
              <div className="client-hours-row" key={h.day}>
                <strong>{days[h.day]}</strong>
                <label>
                  <input
                    type="checkbox"
                    checked={h.closed}
                    onChange={(e) => hours(index, { closed: e.target.checked })}
                  />{" "}
                  Closed
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={h.allDay}
                    disabled={h.closed}
                    onChange={(e) => hours(index, { allDay: e.target.checked })}
                  />{" "}
                  24 hours
                </label>
                <input
                  type="time"
                  aria-label={`${days[h.day]} opening time`}
                  disabled={h.closed || h.allDay}
                  value={h.opens}
                  onChange={(e) => hours(index, { opens: e.target.value })}
                />
                <input
                  type="time"
                  aria-label={`${days[h.day]} closing time`}
                  disabled={h.closed || h.allDay}
                  value={h.closes}
                  onChange={(e) => hours(index, { closes: e.target.value })}
                />
                <label>
                  <input
                    type="checkbox"
                    disabled={h.closed || h.allDay}
                    checked={h.overnight}
                    onChange={(e) =>
                      hours(index, { overnight: e.target.checked })
                    }
                  />{" "}
                  Next day
                </label>
              </div>
            ))}
            <label className="client-field">
              <span>Reason for this update</span>
              <textarea
                rows={2}
                minLength={5}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Stock received, sale recorded, temporary closure or revised hours"
              />
            </label>
            <button
              type="button"
              className="button primary"
              disabled={
                busy ||
                reason.trim().length < 5 ||
                state.openingHours.length !== 7
              }
              onClick={() => void save()}
            >
              {busy ? "Saving…" : "Save live operations"}
            </button>
          </fieldset>
          {state.movements.length > 0 && (
            <div className="inventory-history">
              <h3>Recent stock movements</h3>
              <table>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Offering</th>
                    <th>Change</th>
                    <th>Balance</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {state.movements.map((m) => (
                    <tr key={m.id}>
                      <td>
                        {new Date(m.created_at).toLocaleString("en-KE", {
                          timeZone: "Africa/Nairobi",
                        })}
                      </td>
                      <td>{m.service_name}</td>
                      <td>
                        {m.delta > 0 ? "+" : ""}
                        {m.delta}
                      </td>
                      <td>{m.balance}</td>
                      <td>{m.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
