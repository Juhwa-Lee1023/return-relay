import "@fontsource/lora/latin-400.css";
import "@fontsource/source-sans-3/latin-400.css";
import "@fontsource/source-sans-3/latin-600.css";
import "@fontsource/source-sans-3/latin-700.css";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Package,
  Headphones,
  Plug,
  ShoppingBag,
  RotateCcw,
  ChevronDown,
  Terminal,
  CalendarDays,
  Send,
  Users,
  X,
  Info,
  AlertCircle,
  ReceiptText,
} from "lucide-react";
import { DateTime } from "luxon";
import type { Preview, ReturnCase, Plan, Actor } from "../domain/types";
import type { WireTrace } from "../server/mcp";
import "./style.css";
type Order = {
  id: string;
  title: string;
  merchant: string;
  case_id: string;
  eligible_by_fixture: boolean | null;
};
type Message = { who: "you" | "relay"; text: string };
type Confirmation =
  | { kind: "tool"; ticket: string; summary: string }
  | { kind: "reset"; summary: string };
const ZONE = "America/Los_Angeles",
  INITIAL = "2026-11-06T08:00:00-08:00",
  CHANGED = "2026-11-05T07:00:00-08:00";
function date(v: string, format = "ccc, LLL d · h:mm a") {
  return DateTime.fromISO(v).setZone(ZONE).toFormat(format);
}
const icons = [Headphones, Plug, ShoppingBag];
const progressCopy: Record<
  string,
  { label: string; title: string; body: string }
> = {
  DRAFT: {
    label: "Make a plan",
    title: "Choose a time that works.",
    body: "The return deadline, your trip, and the drop point’s hours all need to line up.",
  },
  PLAN_CONFIRMED: {
    label: "Plan saved",
    title: "Next up: pack the parcel.",
    body: "Check the items below before handing it to someone else.",
  },
  PREPARED: {
    label: "Packed",
    title: "Ready for the handoff.",
    body: "Take it yourself, or ask Maya to drop it off when she is available.",
  },
  HANDOFF_REQUESTED: {
    label: "Waiting for Maya",
    title: "Maya has a request to review.",
    body: "Open Maya’s sample view to review the time and accept the request.",
  },
  HANDOFF_ACCEPTED: {
    label: "Maya accepted",
    title: "Maya will take the parcel.",
    body: "After visiting the drop point, Maya can record the drop-off here.",
  },
  DROPOFF_REPORTED: {
    label: "Drop-off reported",
    title: "Waiting for the carrier receipt.",
    body: "The drop-off report is saved. Load the sample receipt to check it against this return.",
  },
  DROPOFF_CONFIRMED_DEMO: {
    label: "Sample receipt matched",
    title: "The sample receipt matches.",
    body: "The carrier receipt matches this return. Refund status is still unknown.",
  },
};
function App() {
  const [orders, setOrders] = useState<Order[]>([]),
    [current, setCurrent] = useState<ReturnCase | null>(null),
    [policy, setPolicy] = useState<any>(null),
    [preview, setPreview] = useState<Preview | null>(null);
  const [csrf, setCsrf] = useState(""),
    [actor, setActor] = useState<Actor>("alex"),
    [busy, setBusy] = useState(false),
    [booting, setBooting] = useState(true),
    [error, setError] = useState(""),
    [trace, setTrace] = useState<WireTrace[]>([]);
  const [messages, setMessages] = useState<Message[]>([
      {
        who: "relay",
        text: "Choose a sample item. I’ll check its return instructions against the household calendar.",
      },
    ]),
    [text, setText] = useState(""),
    [checked, setChecked] = useState<string[]>([]),
    [departure, setDeparture] = useState(INITIAL),
    [confirm, setConfirm] = useState<Confirmation | null>(null),
    [showHelp, setShowHelp] = useState(false),
    [customDate, setCustomDate] = useState("2026-11-05T07:00");
  const dialog = useRef<HTMLDialogElement>(null),
    input = useRef<HTMLInputElement>(null),
    lastFocus = useRef<HTMLElement | null>(null);
  function addTrace(t?: WireTrace[]) {
    if (t?.length) setTrace((prev) => [...prev, ...t].slice(-100));
  }
  async function request(path: string, body?: unknown, token = csrf) {
    const r = await fetch("/api" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "x-rr-csrf": token } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await r.json();
    addTrace(data.trace);
    if (!r.ok)
      throw new Error(
        data.message ?? "The connection did not complete. Try again.",
      );
    return data;
  }
  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function load(id: string, token = csrf) {
    const data = await request("/case/" + id, undefined, token);
    setCurrent(data.result.case);
    setPolicy(data.result.policy);
    setChecked(
      data.result.case.prepared
        ? (data.result.case.plan?.required_items ?? [])
        : [],
    );
    setDeparture(data.result.case.plan?.departure_at ?? INITIAL);
    return data.result.case as ReturnCase;
  }
  async function boot(preferredCase?: string) {
    setBooting(true);
    try {
      const d = await request("/session", {});
      setOrders(d.result.orders);
      setCsrf(d.csrf);
      setActor(d.principal.actor);
      const selected = preferredCase ?? localStorage.getItem("rr-selected-case");
      if (
        selected &&
        d.result.orders.some((o: Order) => o.case_id === selected)
      ) {
        await load(selected, d.csrf);
      } else {
        setCurrent(null);
        setPolicy(null);
        setPreview(null);
        localStorage.removeItem("rr-selected-case");
      }
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBooting(false);
    }
  }
  useEffect(() => {
    void boot();
  }, []);
  useEffect(() => {
    if (confirm) {
      dialog.current?.showModal();
    } else if (dialog.current?.open) {
      dialog.current.close();
      if (lastFocus.current?.isConnected) lastFocus.current.focus();
      else document.getElementById("main")?.focus();
      lastFocus.current = null;
    }
  }, [confirm]);
  const selected = orders.find((o) => o.id === current?.order_id),
    plan = preview?.plan ?? current?.plan,
    status = progressCopy[current?.progress ?? "DRAFT"];
  async function selectOrder(o: Order) {
    await run(async () => {
      setPreview(null);
      setMessages([
        {
          who: "relay",
          text: `Let’s work on the ${o.title.toLowerCase()}. I’ll use the sample store’s instructions.`,
        },
      ]);
      const c = await load(o.case_id);
      localStorage.setItem("rr-selected-case", o.case_id);
      if (!c.plan && o.eligible_by_fixture) {
        const d = await request("/preview", {
          case_id: c.id,
          expected_revision: c.revision,
          departure_at: INITIAL,
        });
        setPreview(d.result);
      }
    });
  }
  async function changePlan(value: string, preferred?: Actor) {
    if (!current) return;
    await run(async () => {
      const d = await request("/preview", {
        case_id: current.id,
        expected_revision: current.revision,
        departure_at: value,
        ...(preferred ? { preferred_actor_id: preferred } : {}),
      });
      setPreview(d.result);
      setDeparture(value);
      setMessages((m) => [
        ...m,
        {
          who: "relay",
          text: d.result.plan
            ? "Here is a time that fits. Review the change before replacing your saved plan."
            : d.result.reasons.join(" "),
        },
      ]);
    });
  }
  async function chat(value = text) {
    if (!value.trim()) return;
    setText("");
    setMessages((m) => [...m, { who: "you", text: value }]);
    await run(async () => {
      const d = await request("/chat", {
        text: value,
        ...(current
          ? { case_id: current.id, expected_revision: current.revision }
          : {}),
      });
      setMessages((m) => [...m, { who: "relay", text: d.message }]);
      if (d.kind === "preview") {
        setPreview(d.result);
        if (d.result.plan) setDeparture(d.result.plan.departure_at);
      }
    });
    input.current?.focus();
  }
  async function review(tool: string, extra: Record<string, unknown>) {
    if (!current) return;
    lastFocus.current = document.activeElement as HTMLElement;
    await run(async () => {
      const args = {
        case_id: current.id,
        expected_revision: current.revision,
        idempotency_key: crypto.randomUUID(),
        ...extra,
      };
      const d = await request("/confirmation", { tool, args });
      setConfirm({ ...d, kind: "tool" });
    });
  }
  async function save() {
    if (!confirm) return;
    if (confirm.kind === "reset") {
      await reset();
      return;
    }
    await run(async () => {
      try {
        const d = await request("/confirm", { ticket: confirm.ticket });
        setCurrent(d.result);
        setChecked(d.result.prepared ? (d.result.plan?.required_items ?? []) : []);
        setPreview(null);
        setConfirm(null);
        setDeparture(d.result.plan?.departure_at ?? INITIAL);
        setMessages((m) => [
          ...m,
          { who: "relay", text: d.result.events.at(-1)?.summary ?? "Saved." },
        ]);
      } catch (error) {
        // A response can be lost after the write. Reveal the recovery action,
        // then let the user read the saved revision before deciding to retry.
        setConfirm(null);
        setPreview(null);
        if (error instanceof TypeError) {
          throw new Error("The response did not arrive. Refresh saved plan to check whether this change was saved.");
        }
        throw error;
      }
    });
  }
  async function role(next: Actor) {
    await run(async () => {
      const d = await request("/role", { actor: next });
      setActor(next);
      setCsrf(d.csrf);
      setPreview(null);
      setConfirm(null);
      if (current) await load(current.id, d.csrf);
    });
  }
  async function receipt() {
    if (!current) return;
    lastFocus.current = document.activeElement as HTMLElement;
    await run(async () => {
      const r = await request("/receipt/" + current.id);
      const d = await request("/confirmation", {
        tool: "return_step_update",
        args: {
          case_id: current.id,
          expected_revision: current.revision,
          idempotency_key: crypto.randomUUID(),
          step: "DROPOFF_CONFIRMED_DEMO",
          evidence_ref: r.evidence_ref,
        },
      });
      setConfirm({ ...d, kind: "tool" });
    });
  }
  async function reset() {
    await run(async () => {
      try {
        await request("/reset", {});
      } catch (error) {
        setConfirm(null);
        setPreview(null);
        if (error instanceof TypeError) {
          throw new Error("The response did not arrive. Refresh saved plan to check whether the reset finished.");
        }
        throw error;
      }
      setConfirm(null);
      localStorage.removeItem("rr-selected-case");
      setCurrent(null);
      setPreview(null);
      setPolicy(null);
      setTrace([]);
      setChecked([]);
      setText("");
      setDeparture(INITIAL);
      setMessages([
        {
          who: "relay",
          text: "A fresh sample household is ready. Choose an item to begin.",
        },
      ]);
      await boot();
    });
  }
  const mayaAvailable =
    current?.plan &&
    DateTime.fromISO(current.plan.dropoff_start).setZone(ZONE).weekday === 3;
  return (
    <>
      <a className="skip" href="#main">
        Skip to return plan
      </a>
      <header className="masthead">
        <a className="brand" href="/" aria-label="Return Relay home">
          <span className="brand-mark">
            <ArrowUpRight size={23} />
          </span>
          <span>Return Relay</span>
        </a>
        <nav aria-label="App information">
          <button className="quiet" onClick={() => setShowHelp(!showHelp)}>
            <Info size={16} />
            How it works
          </button>
          <button
            className="quiet reset"
            disabled={busy || booting}
            onClick={() => {
              lastFocus.current = document.activeElement as HTMLElement;
              setConfirm({
                kind: "reset",
                summary: "This deletes the saved plans, packing updates and handoff history for your sample household. You will start again with the original sample items.",
              });
            }}
          >
            <RotateCcw size={15} />
            Reset sample
          </button>
        </nav>
      </header>
      <div className="simulation">
        <span className="sim-dot" />
        Alexa+ web simulation <span className="sim-separator">/</span> Sample
        orders & household <span className="sim-separator">/</span>
        <span>Guided mode</span>
      </div>
      {showHelp && (
        <section className="help">
          <button
            className="icon-button close-help"
            aria-label="Close explanation"
            onClick={() => setShowHelp(false)}
          >
            <X />
          </button>
          <h2>Try a return with an earlier departure</h2>
          <p>
            Choose the headphones, save a drop-off time, then change your
            departure to Thursday morning. Review the earlier time before
            saving it. After packing, ask Maya to take the parcel and try
            accepting from Maya’s view.
          </p>
          <p>
            This self-built Alexa+ web simulation uses sample orders,
            policies, calendars, family roles and a carrier receipt. A guided
            parser handles the supported phrases; nine MCP tools carry out
            the actions over HTTP and save your session for seven days.
            Live Alexa, language-model calls, Amazon accounts, real returns
            and family messages are outside this demo.
          </p>
        </section>
      )}
      <main id="main" tabIndex={-1}>
        <div className="page-heading">
          <div>
            <h1>{current ? "Your return plan" : "Return it before you leave."}</h1>
            <p className="intro">
              {current
                ? "Check the drop-off time, pack the parcel, and ask Maya for help."
                : "Find a drop-off time that fits your trip and the household calendar."}
            </p>
          </div>
          <div className="demo-clock">
            <Clock size={17} />
            <div>
              <span>Demo clock</span>
              <strong>Mon, Nov 2 · 9:00 AM</strong>
              <small>Los Angeles · 2026</small>
            </div>
          </div>
        </div>
        {error && (
          <div className="error" role="alert">
            <AlertCircle size={20} />
            <div>
              <strong>We could not confirm that step.</strong>
              <p>{error}</p>
              {!current && (
                <button onClick={() => run(boot)} disabled={busy}>
                  Reconnect
                </button>
              )}
              {current && (
                <button
                  onClick={() =>
                    run(async () => {
                      await boot(current.id);
                      setPreview(null);
                    })
                  }
                  disabled={busy}
                >
                  Refresh saved plan
                </button>
              )}
            </div>
            <button
              className="icon-button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              <X size={18} />
            </button>
          </div>
        )}
        {booting ? (
          <div className="loading" role="status">
            <span className="loading-line" />
            Opening your sample household…
          </div>
        ) : (
          <div className={"workspace " + (!current ? "choosing" : "")}>
            <aside className="side">
              <section className="order-list">
                <div className="section-label">
                  <span>Your sample returns</span>
                  <span>3 items</span>
                </div>
                {orders.map((o, i) => {
                  const Icon = icons[i];
                  return (
                    <button
                      className={
                        "order " + (selected?.id === o.id ? "selected" : "")
                      }
                      key={o.id}
                      onClick={() => selectOrder(o)}
                      disabled={busy}
                      aria-pressed={selected?.id === o.id}
                    >
                      <span className="order-icon">
                        <Icon size={24} />
                      </span>
                      <span>
                        <strong>{o.title}</strong>
                        <small>
                          {o.eligible_by_fixture === true
                            ? "Return by Fri, Nov 6"
                            : o.eligible_by_fixture === false
                              ? "Return window passed"
                              : "Instructions needed"}
                        </small>
                      </span>
                      <ArrowUpRight className="order-arrow" size={17} />
                    </button>
                  );
                })}
              </section>
              <section
                className="conversation"
                aria-label="Planning conversation"
              >
                <div className="section-label">
                  <span>Talk through the change</span>
                  <span className="small-tag">Guided</span>
                </div>
                <div className="messages" role="region" aria-label="Conversation history" tabIndex={0} aria-live="polite">
                  {messages.slice(-5).map((m, i) => (
                    <div key={i} className={"message " + m.who}>
                      <span>{m.who === "you" ? "You" : "Relay"}</span>
                      <p>{m.text}</p>
                    </div>
                  ))}
                </div>
                {current?.plan &&
                  actor === "alex" &&
                  !current.progress.startsWith("DROPOFF") && (
                    <button
                      className="suggestion"
                      disabled={busy}
                      onClick={() =>
                        chat("Actually, I’m leaving Thursday morning.")
                      }
                    >
                      “Actually, I’m leaving Thursday morning.”{" "}
                      <ArrowUpRight size={16} />
                    </button>
                  )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void chat();
                  }}
                >
                  <label className="sr-only" htmlFor="message">
                    Message Return Relay
                  </label>
                  <input
                    ref={input}
                    id="message"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Change your departure…"
                    maxLength={500}
                    disabled={busy}
                  />
                  <button
                    aria-label="Send message"
                    disabled={busy || !text.trim()}
                  >
                    <Send size={17} />
                  </button>
                </form>
                <small className="chat-note">
                  Try “Thursday morning” or use the date controls.
                </small>
              </section>
            </aside>
            <div className="main-column">
              {!current ? (
                <section className="welcome">
                  <div className="parcel-art" aria-hidden="true">
                    <span className="parcel-fold" />
                    <span className="parcel-label">
                      <span>
                        RETURN
                        <br />
                        RELAY
                      </span>
                      <ArrowUpRight size={30} />
                    </span>
                  </div>
                  <h2>
                    Leaving a day earlier?
                    <br />
                    Move the return, too.
                  </h2>
                  <p>
                    Plan a Thursday drop-off, then move your trip to Thursday
                    morning. Return Relay will find an earlier time and show
                    the change for you to approve.
                  </p>
                  <button
                    className="primary"
                    disabled={busy || !orders.length}
                    onClick={() => selectOrder(orders[0])}
                  >
                    Plan the headphones return <ArrowRight size={18} />
                  </button>
                  <div className="welcome-steps">
                    <span>01 &nbsp; Find a time</span>
                    <span>02 &nbsp; Approve</span>
                    <span>03 &nbsp; Hand over</span>
                  </div>
                </section>
              ) : (
                <>
                  <section className="return-header">
                    <div>
                      <h2>{selected?.title}</h2>
                      <p className="context-label">{selected?.merchant}</p>
                    </div>
                    <span
                      className={"status-badge " + (preview ? "proposed" : "")}
                    >
                      {preview ? "Review proposed plan" : status.label}
                    </span>
                  </section>
                  {policy?.basis === "UNKNOWN" ||
                  selected?.eligible_by_fixture === false ? (
                    <section className="blocked-card">
                      <AlertCircle size={32} />
                      <h3>
                        {selected?.eligible_by_fixture === false
                          ? "The return window has passed."
                          : "Check the store’s instructions first."}
                      </h3>
                      <p>
                        {selected?.eligible_by_fixture === false
                          ? "The sample adapter’s return deadline was November 1. Check with the store before arranging a drop-off."
                          : "The sample bag is missing a return deadline and return method. Both are needed to find a drop-off time."}
                      </p>
                      <button
                        className="secondary"
                        onClick={() => selectOrder(orders[0])}
                        disabled={busy}
                      >
                        Try the headphones return <ArrowRight size={17} />
                      </button>
                    </section>
                  ) : (
                    <>
                      {preview && (
                        <div className="proposal-banner">
                          <span className="proposal-icon">
                            <ArrowUpRight size={22} />
                          </span>
                          <div>
                            <strong>
                              {preview.conflicts.length
                                ? "The old drop-off is too late."
                                : "A time that fits the household."}
                            </strong>
                            <p>
                              {preview.conflicts[0] ??
                                "Check the times below. Nothing has been saved yet."}
                            </p>
                          </div>
                        </div>
                      )}
                      {!preview && (
                        <div className="next-action">
                          <h3>{status.title}</h3>
                          {actor === "maya" && <p className="context-label">Maya’s sample view</p>}
                          <p>
                            {actor === "maya" &&
                            current.progress === "HANDOFF_REQUESTED"
                              ? "The parcel is packed. Check the time and accept if you can take it."
                              : status.body}
                          </p>
                        </div>
                      )}
                      {preview && !preview.plan ? (
                        <section className="blocked-card">
                          <CalendarDays size={30} />
                          <h3>No workable slot before that departure.</h3>
                          {preview.reasons.map((r) => (
                            <p key={r}>{r}</p>
                          ))}
                          <button
                            className="secondary"
                            onClick={() => changePlan(INITIAL)}
                            disabled={busy}
                          >
                            Try Friday morning
                          </button>
                        </section>
                      ) : (
                        plan && (
                          <section
                            className={"plan-sheet " + (preview ? "draft" : "")}
                            aria-label="Return plan"
                          >
                            <div className="sheet-top">
                              <span className="context-label">
                                {preview
                                  ? "Proposed itinerary"
                                  : "Saved itinerary"}
                              </span>
                              <span className="small-tag">
                                Los Angeles time
                              </span>
                            </div>
                            <div className="trip-row">
                              <span>
                                <CalendarDays size={18} />
                                Trip departure
                              </span>
                              <strong>{date(plan.departure_at)}</strong>
                            </div>
                            {preview?.previous_plan && (
                              <div className="change-summary">
                                <span className="old-time">
                                  {date(preview.previous_plan.dropoff_start)}
                                </span>
                                <ArrowRight size={18} />
                                <span className="new-time">
                                  {date(plan.dropoff_start)}
                                </span>
                              </div>
                            )}
                            <ol className="timeline">
                              <li>
                                <span className="timeline-dot">
                                  <Package size={17} />
                                </span>
                                <time>{date(plan.prepare_at, "h:mm a")}</time>
                                <div>
                                  <strong>Pack the headphones</strong>
                                  <span>
                                    {date(plan.prepare_at, "cccc, LLLL d")} ·
                                    all four items
                                  </span>
                                </div>
                              </li>
                              <li>
                                <span className="timeline-dot">
                                  <ArrowUpRight size={17} />
                                </span>
                                <time>
                                  {date(plan.home_departure, "h:mm a")}
                                </time>
                                <div>
                                  <strong>Leave for Cedar Drop Point</strong>
                                  <span>15-minute sample journey</span>
                                </div>
                              </li>
                              <li>
                                <span className="timeline-dot filled">
                                  <Check size={17} />
                                </span>
                                <time>
                                  {date(plan.dropoff_start, "h:mm a")}
                                </time>
                                <div>
                                  <strong>Hand over the parcel</strong>
                                  <span>
                                    Allow 20 minutes · finish at{" "}
                                    {date(plan.completion, "h:mm a")}
                                  </span>
                                </div>
                              </li>
                            </ol>
                            <div className="plan-foot">
                              <span>
                                <Clock size={15} />
                                Counter closes at 6:00 PM
                              </span>
                              <span>Return by Fri, Nov 6 · 5:00 PM</span>
                            </div>
                            {preview && (
                              <div className="plan-actions">
                                <button
                                  className="primary"
                                  disabled={busy || actor !== "alex"}
                                  onClick={() =>
                                    review("return_plan_commit", {
                                      proposal_id: preview.proposal_id,
                                    })
                                  }
                                >
                                  Review & save <ArrowRight size={18} />
                                </button>
                                <button
                                  className="quiet"
                                  disabled={busy}
                                  onClick={() => {
                                    setPreview(null);
                                    setDeparture(
                                      current.plan?.departure_at ?? INITIAL,
                                    );
                                  }}
                                >
                                  Keep{" "}
                                  {current.plan ? "saved plan" : "planning"}
                                </button>
                              </div>
                            )}
                          </section>
                        )
                      )}
                      {actor === "alex" &&
                        !current.progress.startsWith("DROPOFF") && (
                          <details className="date-controls">
                            <summary>
                              <CalendarDays size={16} />
                              Change departure or person{" "}
                              <ChevronDown size={16} />
                            </summary>
                            <label htmlFor="departure">
                              When will you leave?
                            </label>
                            <select
                              id="departure"
                              value={
                                departure === INITIAL || departure === CHANGED
                                  ? departure
                                  : "custom"
                              }
                              onChange={(e) => {
                                if (e.target.value === "custom")
                                  setDeparture("custom");
                                else void changePlan(e.target.value);
                              }}
                              disabled={busy}
                            >
                              <option value={INITIAL}>
                                Friday, November 6 · 8:00 AM
                              </option>
                              <option value={CHANGED}>
                                Thursday, November 5 · 7:00 AM
                              </option>
                              <option value="custom">
                                Choose another date & time
                              </option>
                            </select>
                            {departure === "custom" && (
                              <div className="custom-date">
                                <input
                                  aria-label="Custom departure in Los Angeles time"
                                  type="datetime-local"
                                  value={customDate}
                                  onChange={(e) =>
                                    setCustomDate(e.target.value)
                                  }
                                />
                                <button
                                  className="secondary"
                                  disabled={busy}
                                  onClick={() =>
                                    changePlan(
                                      DateTime.fromISO(customDate, {
                                        zone: ZONE,
                                      }).toISO()!,
                                    )
                                  }
                                >
                                  Check time
                                </button>
                              </div>
                            )}
                            <button
                              className="text-link"
                              onClick={() =>
                                changePlan(
                                  current.plan?.departure_at ?? INITIAL,
                                  "maya",
                                )
                              }
                              disabled={busy}
                            >
                              Find a time Maya can take it
                            </button>
                          </details>
                        )}
                      {current.plan && !preview && (
                        <section className="packing">
                          <div className="section-label">
                            <span>Before it leaves the house</span>
                            <span>
                              {current.prepared
                                ? "Packed"
                                : `${checked.length} / ${current.plan.required_items.length}`}
                            </span>
                          </div>
                          <div className="packing-items">
                            {current.plan.required_items.map((item) => (
                              <label key={item}>
                                <input
                                  type="checkbox"
                                  disabled={
                                    current.prepared || actor !== "alex" || busy
                                  }
                                  checked={checked.includes(item)}
                                  onChange={(e) =>
                                    setChecked((v) =>
                                      e.target.checked
                                        ? [...v, item]
                                        : v.filter((i) => i !== item),
                                    )
                                  }
                                />
                                <span>
                                  {item === "provided demo return label"
                                    ? "Sample return label"
                                    : item[0].toUpperCase() + item.slice(1)}
                                </span>
                                {current.prepared && <Check size={15} />}
                              </label>
                            ))}
                          </div>
                          {current.progress === "PLAN_CONFIRMED" &&
                            actor === "alex" && (
                              <button
                                className="primary"
                                disabled={
                                  busy ||
                                  checked.length !==
                                    current.plan.required_items.length
                                }
                                onClick={() =>
                                  review("return_step_update", {
                                    step: "PREPARED",
                                    checked_items: checked,
                                  })
                                }
                              >
                                Mark parcel packed <Package size={18} />
                              </button>
                            )}
                        </section>
                      )}
                      {current.prepared && !preview && (
                        <section className="handoff">
                          <div className="handoff-person">
                            <span className="avatar">M</span>
                            <div>
                              <h3>Maya’s drop-off</h3>
                              <p>
                                {current.handoff?.status === "ACCEPTED"
                                  ? "Accepted this drop-off"
                                  : current.handoff
                                    ? "Request sent · awaiting acceptance"
                                    : "Available Wednesday, 4:00–6:30 PM"}
                              </p>
                            </div>
                            {current.handoff?.status === "ACCEPTED" && (
                              <CheckCheck size={23} />
                            )}
                          </div>
                          {current.progress === "PREPARED" &&
                            actor === "alex" && (
                              <div className="handoff-actions">
                                {mayaAvailable ? (
                                  <button
                                    className="primary"
                                    onClick={() =>
                                      review("handoff_request", {
                                        actor_id: "maya",
                                      })
                                    }
                                    disabled={busy}
                                  >
                                    Ask Maya to take it <ArrowRight size={18} />
                                  </button>
                                ) : (
                                  <button
                                    className="secondary"
                                    onClick={() =>
                                      changePlan(
                                        current.plan!.departure_at,
                                        "maya",
                                      )
                                    }
                                    disabled={busy}
                                  >
                                    Find a time for Maya
                                  </button>
                                )}
                                <button
                                  className="quiet"
                                  onClick={() =>
                                    review("return_step_update", {
                                      step: "DROPOFF_REPORTED",
                                    })
                                  }
                                  disabled={busy}
                                >
                                  I dropped it off myself
                                </button>
                              </div>
                            )}
                          {current.progress === "HANDOFF_REQUESTED" &&
                            actor === "maya" && (
                              <button
                                className="primary"
                                onClick={() =>
                                  review("handoff_accept", {
                                    request_id: current.handoff!.id,
                                  })
                                }
                                disabled={busy}
                              >
                                Accept as Maya <Check size={18} />
                              </button>
                            )}
                          {current.progress === "HANDOFF_ACCEPTED" &&
                            actor === "maya" && (
                              <button
                                className="primary"
                                onClick={() =>
                                  review("return_step_update", {
                                    step: "DROPOFF_REPORTED",
                                  })
                                }
                                disabled={busy}
                              >
                                Report drop-off as Maya <ArrowRight size={18} />
                              </button>
                            )}
                          {current.progress === "DROPOFF_REPORTED" && (
                            <button
                              className="primary"
                              disabled={busy}
                              onClick={receipt}
                            >
                              Load sample carrier receipt{" "}
                              <ReceiptText size={18} />
                            </button>
                          )}
                          <div className="role-switch">
                            <Users size={16} />
                            <span>
                              {actor === "alex"
                                ? "Try the other side of this handoff."
                                : "You are acting as sample member Maya."}
                            </span>
                            <button
                              disabled={busy}
                              onClick={() =>
                                role(actor === "alex" ? "maya" : "alex")
                              }
                            >
                              {actor === "alex"
                                ? "Open Maya’s view"
                                : "Back to Alex"}
                              <ArrowUpRight size={14} />
                            </button>
                          </div>
                        </section>
                      )}
                      {current.progress === "DROPOFF_CONFIRMED_DEMO" && (
                        <section className="receipt">
                          <div>
                            <ReceiptText size={28} />
                            <h3>Parcel accepted</h3>
                            <p className="context-label">Synthetic carrier receipt</p>
                            <p>
                              Cedar Drop Point ·{" "}
                              {date(current.plan!.completion)}
                            </p>
                          </div>
                          <div className="receipt-row">
                            <span>Drop-off</span>
                            <strong>Matched to this return</strong>
                          </div>
                          <div className="receipt-row">
                            <span>Refund</span>
                            <strong>Unknown</strong>
                          </div>
                        </section>
                      )}
                    </>
                  )}
                  <details className="evidence">
                    <summary>
                      Return instructions & saved history{" "}
                      <ChevronDown size={16} />
                    </summary>
                    <p>
                      Source: synthetic fixture rr-synthetic-v1. This is a
                      fictional store policy.
                    </p>
                    <dl>
                      <div>
                        <dt>Deadline means</dt>
                        <dd>
                          {policy?.basis === "carrier_acceptance_by"
                            ? "Accepted by the carrier before the deadline"
                            : "Not confirmed"}
                        </dd>
                      </div>
                      <div>
                        <dt>Refund</dt>
                        <dd>Unknown · no refund record</dd>
                      </div>
                    </dl>
                    {current.events.length ? (
                      <ol className="event-list">
                        {current.events.map((e) => (
                          <li key={e.id}>
                            <strong>{e.summary}</strong>
                            <small>
                              Revision {e.revision} ·{" "}
                              {e.actor === "alex" ? "Alex" : "Maya"} ·{" "}
                              {e.evidence_level === "synthetic_receipt"
                                ? "Sample receipt"
                                : "Explicit action"}
                            </small>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p>No saved changes yet.</p>
                    )}
                  </details>
                </>
              )}
              <details className="tool-trace">
                <summary>
                  <Terminal size={16} />
                  <span>Actual MCP calls</span>
                  <span className="trace-count">
                    {trace.filter((t) => t.tool).length}
                  </span>
                  <ChevronDown size={16} />
                </summary>
                <p>
                  The web host uses the official MCP client over Streamable
                  HTTP. These entries come from that HTTP connection.
                </p>
                <div
                  className="trace-table"
                  role="region"
                  aria-label="MCP call log"
                  tabIndex={0}
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Request</th>
                        <th>Method / tool</th>
                        <th>HTTP</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trace.slice(-18).map((t, i) => (
                        <tr key={i}>
                          <td>{t.request_id ?? "—"}</td>
                          <td>
                            {t.tool ?? t.method}
                            {t.protocol && <small>{t.protocol}</small>}
                          </td>
                          <td>
                            {t.http_status}
                            {t.outcome === "error" ? " · error" : ""}
                          </td>
                          <td>{t.duration_ms} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          </div>
        )}
      </main>
      <footer>
        <span>Return Relay</span>
        <p>
          A self-built Alexa+ web simulation. No Amazon account connection or
          real return processing.
        </p>
        <span className="footer-code">Sample household · local time shown</span>
      </footer>
      <div className="busy-status" role="status" aria-live="polite">
        {busy ? "Checking the return…" : ""}
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="confirmation-heading"
        aria-describedby="confirmation-summary"
        onCancel={(e) => {
          e.preventDefault();
          if (!busy) setConfirm(null);
        }}
        className="confirm-dialog"
      >
        <button
          className="icon-button modal-close"
          aria-label="Cancel confirmation"
          disabled={busy}
          onClick={() => setConfirm(null)}
        >
          <X size={20} />
        </button>
        <h2 id="confirmation-heading">{confirm?.kind === "reset" ? "Reset this sample household?" : "Save these details?"}</h2>
        <p id="confirmation-summary" className="confirmation-summary">{confirm?.summary}</p>
        <div className="confirmation-note">
          <Check size={18} />
          <span>{confirm?.kind === "reset" ? "This cannot be undone." : "This updates only your sample household."}</span>
        </div>
        <div className="modal-actions">
          <button
            className="secondary"
            disabled={busy}
            onClick={() => setConfirm(null)}
          >
            {confirm?.kind === "reset" ? "Keep household" : "Go back"}
          </button>
          <button className="primary" disabled={busy} onClick={save}>
            {confirm?.kind === "reset" ? (busy ? "Resetting…" : "Reset household") : (busy ? "Saving…" : "Confirm & save")}
            <ArrowRight size={18} />
          </button>
        </div>
      </dialog>
    </>
  );
}
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
