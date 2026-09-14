"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Gem,
  LockKeyhole,
  LogOut,
  Package,
  Search,
  RefreshCw,
} from "lucide-react";
import { type Order } from "@/lib/orders";
import { type Stone, type OrderStatus, statusLabels, money, isCharm } from "@/lib/catalog";
import { validTransition, countBeads } from "@/lib/domain";
import { Bracelet, CharmIcon, StoneOrb } from "./bracelet";

export function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: new FormData(event.currentTarget).get("password") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Холболтын алдаа.");
      setBusy(false);
    }
  }
  return (
    <main id="main" className="login-page">
      <form className="login-card" onSubmit={login}>
        <span className="login-icon">
          <LockKeyhole size={24} />
        </span>
        <p className="eyebrow">HULAN STUDIO</p>
        <h1>
          Тавтай <em>морил.</em>
        </h1>
        <p>Захиалга болон урлалын удирдлага.</p>
        <label className="field">
          Админы нууц үг
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={200}
          />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="button dark full-width" disabled={busy}>
          {busy ? "Нэвтэрч байна…" : "Нэвтрэх"}
          <ArrowRight size={17} />
        </button>
      </form>
    </main>
  );
}
export function AdminDashboard({ orders, stones }: { orders: Order[]; stones: Stone[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "stones">("orders"),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = orders.find((o) => o.id === selectedId);
  const [error, setError] = useState("");
  async function logout() {
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Гарах үед алдаа гарлаа.");
    }
  }
  const filtered = orders.filter(
    (order) =>
      (filter === "all" || order.status === filter) &&
      `${order.code} ${order.customer.name} ${order.customer.phone}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <main id="main" className="admin-page section-shell">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">HULAN STUDIO / УДИРДЛАГА</p>
          <h1>
            Студиогийн <em>өдөр тутам.</em>
          </h1>
        </div>
        <div className="admin-actions">
          <button className="icon-button" aria-label="Шинэчлэх" onClick={() => router.refresh()}>
            <RefreshCw size={18} />
          </button>
          <button className="text-link" onClick={logout}>
            <LogOut size={16} /> Гарах
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="admin-stats">
        <div>
          <span>Төлбөр хүлээж буй</span>
          <strong>{orders.filter((o) => o.status === "pending").length}</strong>
          <small>Дансны орлоготой тулгах</small>
        </div>
        <div>
          <span>Бэлтгэж буй</span>
          <strong>{orders.filter((o) => o.status === "preparing").length}</strong>
          <small>Урлах захиалгууд</small>
        </div>
        <div>
          <span>Баталгаажсан захиалгын дүн</span>
          <strong>
            {money(
              orders
                .filter((o) => ["preparing", "shipped", "completed"].includes(o.status))
                .reduce((sum, order) => sum + order.quote.total, 0),
            )}
          </strong>
          <small>Сүүлийн 200 захиалгын хүрээнд</small>
        </div>
      </div>
      <div className="admin-tabs">
        <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>
          <Package size={17} /> Захиалга
        </button>
        <button className={tab === "stones" ? "active" : ""} onClick={() => setTab("stones")}>
          <Gem size={17} /> Материал, үнэ, үлдэгдэл
        </button>
      </div>
      {tab === "orders" ? (
        <>
          <div className="admin-filters">
            <label className="search-field">
              <Search size={17} />
              <input
                aria-label="Захиалга хайх"
                placeholder="Код, нэр, утасны дугаараар хайх"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              aria-label="Төлөвөөр шүүх"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Бүх төлөв</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Захиалга</th>
                  <th>Хэрэглэгч</th>
                  <th>Огноо</th>
                  <th>Дүн</th>
                  <th>Төлөв</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.code}</strong>
                      <small>{order.design.name}</small>
                    </td>
                    <td>
                      {order.customer.name}
                      <small>{order.customer.phone}</small>
                    </td>
                    <td>
                      {new Date(order.created_at).toLocaleDateString("mn-MN", {
                        timeZone: "Asia/Ulaanbaatar",
                      })}
                    </td>
                    <td>{money(order.quote.total)}</td>
                    <td>
                      <span className={`status-badge ${order.status}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td>
                      <button className="text-link" onClick={() => setSelectedId(order.id)}>
                        Нээх <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && (
              <div className="table-empty">
                <Package size={30} strokeWidth={1} />
                <h3>Захиалга одоогоор алга.</h3>
                <p>Шинэ захиалгууд энд харагдана.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="inventory-grid">
          {stones.map((stone) => (
            <InventoryCard
              key={`${stone.id}-${stone.price}-${stone.stock}-${stone.active}`}
              stone={stone}
            />
          ))}
        </div>
      )}
      {selected && (
        <OrderPanel
          key={`${selected.id}-${selected.status}`}
          order={selected}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  );
}
function InventoryCard({ stone }: { stone: Stone }) {
  const router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/admin/stones/${stone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: Number(form.get("price")),
          stock: Number(form.get("stock")),
          active: form.get("active") ? 1 : 0,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="inventory-card" onSubmit={save}>
      <div className="inventory-title">
        {isCharm(stone) ? (
          <CharmIcon material={stone} size={38} />
        ) : (
          <StoneOrb stone={stone} small />
        )}
        <div>
          <h3>{stone.name}</h3>
          <p>{stone.english}</p>
        </div>
      </div>
      <div className="form-row">
        <label className="field">
          Үнэ / ширхэг
          <input
            type="number"
            name="price"
            defaultValue={stone.price}
            min={100}
            max={1000000}
            required
          />
        </label>
        <label className="field">
          Үлдэгдэл / ширхэг
          <input
            type="number"
            name="stock"
            defaultValue={stone.stock}
            min={0}
            max={1000000}
            required
          />
        </label>
      </div>
      <label className="checkbox-field">
        <input type="checkbox" name="active" defaultChecked={Boolean(stone.active)} /> Худалдаанд
        харагдах
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button outline full-width" disabled={busy}>
        {saved ? "Хадгаллаа" : busy ? "Хадгалж байна…" : "Хадгалах"}
        <Check size={15} />
      </button>
    </form>
  );
}
function OrderPanel({ order, onClose }: { order: Order; onClose: () => void }) {
  const router = useRouter();
  const [note, setNote] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [confirmed, setConfirmed] = useState(false);
  async function transition(status: OrderStatus) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <dialog
        open
        className="order-modal"
        aria-labelledby="modal-title"
        ref={(node) => {
          if (node && !node.hasAttribute("data-modal")) {
            node.close();
            node.showModal();
            node.setAttribute("data-modal", "true");
          }
        }}
        onCancel={(e) => {
          e.preventDefault();
          if (!busy) onClose();
        }}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">ЗАХИАЛГЫН ДЭЛГЭРЭНГҮЙ</p>
            <h2 id="modal-title">{order.code}</h2>
          </div>
          <button className="icon-button" aria-label="Хаах" disabled={busy} onClick={onClose}>
            ✕
          </button>
        </div>
        <span className={`status-badge ${order.status}`}>{statusLabels[order.status]}</span>
        <div className="modal-design">
          <Bracelet beads={order.design.beads} stones={order.materials} />
          <div>
            <h3>{order.design.name}</h3>
            <p>
              Бугуйн тойрог {order.design.wrist} см · {order.design.beads.length} чулуу
            </p>
            <strong>{money(order.quote.total)}</strong>
          </div>
        </div>
        <div className="material-list">
          {Object.entries(countBeads(order.design.beads)).map(([id, count]) => (
            <span key={id}>
              {order.materials.find((s) => s.id === id)?.name} × {count}
            </span>
          ))}
        </div>
        <details>
          <summary>Урлах дараалал харах</summary>
          <p className="sequence-list">
            {order.design.beads
              .map((id, i) => `${i + 1}. ${order.materials.find((s) => s.id === id)?.name}`)
              .join(" → ")}
          </p>
        </details>
        <div className="delivery-details">
          <h3>
            {order.customer.name} · {order.customer.phone}
          </h3>
          <p>{order.customer.address}</p>
          {order.customer.note && <p>Хүсэлт: {order.customer.note}</p>}
        </div>
        {["pending", "preparing", "shipped"].includes(order.status) && (
          <>
            <label className="field">
              Гүйлгээний лавлагаа / тайлбар
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                placeholder="Тулгасан гүйлгээний дугаар, огноо эсвэл хүргэлтийн тайлбар"
                rows={2}
              />
            </label>
            {order.status === "pending" && (
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                {money(order.quote.total)} орсныг банкны данснаас шалгасан.
              </label>
            )}
            {order.status === "preparing" && (
              <p className="notice">
                Цуцлах бол төлбөрийн буцаалтыг банкнаасаа шийдвэрлэж, тайлбарт тэмдэглэнэ. Систем
                мөнгө автоматаар буцаахгүй.
              </p>
            )}
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="modal-actions">
              {(["preparing", "shipped", "completed", "cancelled"] as OrderStatus[])
                .filter((status) => validTransition(order.status, status))
                .map((status) => (
                  <button
                    key={status}
                    className={`button ${status === "cancelled" ? "outline" : "dark"}`}
                    disabled={
                      busy ||
                      (status === "preparing" && (!confirmed || !note.trim())) ||
                      (status === "cancelled" && order.status === "preparing" && !note.trim())
                    }
                    onClick={() => transition(status)}
                  >
                    {status === "preparing"
                      ? "Төлбөр баталгаажуулах"
                      : status === "shipped"
                        ? "Хүргэлтэд гаргах"
                        : status === "completed"
                          ? "Дуусгах"
                          : "Цуцлах"}
                  </button>
                ))}
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
