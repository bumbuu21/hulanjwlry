"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Truck } from "lucide-react";
import { Bracelet } from "./bracelet";
import { type Stone, money } from "@/lib/catalog";
import { designSchema, quoteDesign, type Design } from "@/lib/domain";
export function Checkout({
  stones,
  payment,
}: {
  stones: Stone[];
  payment: { configured: boolean; preview: boolean };
}) {
  const router = useRouter();
  const [design, setDesign] = useState<Design | null>(null),
    [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const pendingAttempt = useRef<{ fingerprint: string; key: string } | null>(null);
  useEffect(() => {
    try {
      const result = designSchema.safeParse(
        JSON.parse(localStorage.getItem("hulan-checkout") || "null"),
      );
      if (result.success) setDesign(result.data);
    } catch {
      /* Missing or invalid local draft is shown as an empty state. */
    }
    setLoaded(true);
  }, []);
  let quote: ReturnType<typeof quoteDesign> | null = null;
  let quoteError = "";
  if (design) {
    try {
      quote = quoteDesign(design, stones);
    } catch (e) {
      quoteError = e instanceof Error ? e.message : "Загвараа шалгана уу.";
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !design || !quote) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const customer = {
        name: form.get("name"),
        phone: form.get("phone"),
        address: form.get("address"),
        note: form.get("note"),
      };
      const hash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify({ design, customer })),
      );
      const fingerprint = Array.from(new Uint8Array(hash), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      let previous = pendingAttempt.current;
      try {
        previous = JSON.parse(sessionStorage.getItem("hulan-order-attempt") || "null") ?? previous;
      } catch {
        /* Memory still protects retries when storage is unavailable. */
      }
      const attempt = {
        fingerprint,
        key: previous?.fingerprint === fingerprint ? previous.key : crypto.randomUUID(),
      };
      pendingAttempt.current = attempt;
      try {
        sessionStorage.setItem("hulan-order-attempt", JSON.stringify(attempt));
      } catch {
        /* Optional browser persistence. */
      }
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ design, customer, idempotencyKey: attempt.key }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      try {
        localStorage.setItem("hulan-last-order", result.token);
      } catch {
        /* Order is already saved on the server. */
      }
      router.push(`/order/${result.token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Холболтоо шалгаад дахин оролдоно уу.");
      setBusy(false);
    }
  }
  if (!loaded)
    return (
      <main id="main" className="empty-state">
        <p>Таны загварыг нээж байна…</p>
      </main>
    );
  if (!design)
    return (
      <main id="main" className="empty-state">
        <h1>
          Эхлээд өөрийн <em>загварыг бүтээгээрэй.</em>
        </h1>
        <Link className="button dark" href="/design">
          Бугуйвчаа бүтээх <ArrowUpRightIcon />
        </Link>
      </main>
    );
  return (
    <main id="main" className="checkout-page section-shell">
      <Link className="text-link" href="/design?resume=1">
        <ArrowLeft size={15} /> Дизайнер руу буцах
      </Link>
      <p className="eyebrow">ONE STEP CLOSER TO YOUR WRIST</p>
      <h1>
        Таны бүтээлийг <em>бодит болгоё.</em>
      </h1>
      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={submit}>
          <h2>Хүргэлтийн мэдээлэл</h2>
          <p>Захиалгыг тодруулахад тантай энэ дугаараар холбогдоно.</p>
          <div className="form-row">
            <label className="field">
              Таны нэр
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
                placeholder="Нэрээ оруулна уу"
              />
            </label>
            <label className="field">
              Утасны дугаар
              <input
                name="phone"
                autoComplete="tel"
                type="tel"
                inputMode="numeric"
                pattern="[6-9][0-9]{7}"
                required
                maxLength={8}
                placeholder="99112233"
              />
            </label>
          </div>
          <label className="field">
            Хүргэлтийн хаяг
            <textarea
              name="address"
              autoComplete="street-address"
              required
              minLength={8}
              maxLength={400}
              rows={3}
              placeholder="Дүүрэг, хороо, байр, тоот, нэмэлт тайлбар"
            />
          </label>
          <label className="field">
            Нэмэлт хүсэлт <span>(заавал биш)</span>
            <textarea
              name="note"
              maxLength={500}
              rows={2}
              placeholder="Бэлэглэх, савлагаа болон бусад хүсэлт…"
            />
          </label>
          <div className="payment-method">
            <span className="radio-mark" />
            <div>
              <strong>Банкны шилжүүлэг</strong>
              <p>
                Захиалга үүссэний дараа данс болон гүйлгээний код гарна. Админ орлогоо тулгаж
                төлбөрийг баталгаажуулна.
              </p>
            </div>
            <ShieldCheck size={22} />
          </div>
          {!payment.configured && (
            <p className="notice">
              {payment.preview
                ? "Туршилтын захиалга: банкны данс тохируулаагүй тул мөнгө шилжүүлэхгүй."
                : "Захиалга түр нээгдээгүй байна."}
            </p>
          )}
          <label className="checkbox-field">
            <input type="checkbox" required />{" "}
            <span>Загвар, бугуйн хэмжээ, хүргэлтийн мэдээллээ шалгасан.</span>
          </label>
          {(error || quoteError) && (
            <p className="form-error" role="alert">
              {error || quoteError}
            </p>
          )}
          <button
            type="submit"
            className="button dark full-width"
            disabled={busy || !quote || (!payment.configured && !payment.preview)}
          >
            {busy ? "Захиалга үүсгэж байна…" : "Захиалга үүсгэх"}
            <ArrowRight size={18} />
          </button>
        </form>
        <aside className="order-summary">
          <div className="summary-art sage">
            <Bracelet beads={design.beads} stones={stones} />
          </div>
          <h3>{design.name}</h3>
          <p>
            {design.beads.length} чулуу · 8 мм · Бугуйн тойрог {design.wrist} см
          </p>
          {quote && (
            <div className="price-breakdown">
              <div>
                <span>Байгалийн чулуу</span>
                <span>{money(quote.material)}</span>
              </div>
              <div>
                <span>Гар урлал</span>
                <span>{money(quote.labor)}</span>
              </div>
              <div>
                <span>Хүргэлт</span>
                <span>{money(quote.delivery)}</span>
              </div>
              <div className="total">
                <strong>Нийт дүн</strong>
                <strong>{money(quote.total)}</strong>
              </div>
            </div>
          )}
          <p className="summary-note">
            <Truck size={17} /> Төлбөр батлагдмагц бэлтгэж эхэлнэ.
          </p>
          <p className="summary-note">
            <Check size={17} /> Таны сонгосон дарааллаар урлана.
          </p>
        </aside>
      </div>
    </main>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={17} />;
}
