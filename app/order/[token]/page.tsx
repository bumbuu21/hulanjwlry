import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, ArrowUpRight, Clock3, PackageCheck } from "lucide-react";
import { getOrder } from "@/lib/orders";
import { paymentSettings } from "@/lib/http";
import { money, statusLabels } from "@/lib/catalog";
import { Bracelet } from "@/components/bracelet";
import { CopyButton, RefreshOrder } from "@/components/order-actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Захиалгын төлөв", robots: { index: false, follow: false } };
export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getOrder(token);
  if (!order) notFound();
  const payment = paymentSettings();
  const stages = ["pending", "preparing", "shipped", "completed"] as const;
  const stage = stages.findIndex((s) => s === order.status);
  return (
    <main id="main" className="order-page section-shell">
      <div className="order-success-icon">
        {order.status === "pending" ? <Check size={28} /> : <PackageCheck size={28} />}
      </div>
      <p className="eyebrow">A LITTLE SOMETHING, JUST FOR YOU</p>
      <h1>
        {order.status === "pending" ? (
          <>
            Захиалга <em>бүртгэгдлээ.</em>
          </>
        ) : (
          <>
            Таны захиалгын <em>явц.</em>
          </>
        )}
      </h1>
      <p className="order-intro">
        {order.customer.name}, таны сонгосон чулуу бүр нэгэн түүх болох гэж байна.
      </p>
      <div className="order-code">
        <span>{order.code}</span>
        <CopyButton value={order.code} />
      </div>
      <div className="order-timeline">
        {order.status === "cancelled" ? (
          <p className="form-error">Захиалга цуцлагдсан.</p>
        ) : (
          stages.map((status, i) => (
            <div className={i <= stage ? "reached" : ""} key={status}>
              <span>{i < stage ? <Check size={15} /> : i + 1}</span>
              <p>{statusLabels[status]}</p>
            </div>
          ))
        )}
      </div>
      <div className="checkout-grid order-details">
        <section className="payment-details">
          <h2>{order.status === "pending" ? "Төлбөрийн мэдээлэл" : "Захиалгын мэдээлэл"}</h2>
          {order.status === "pending" &&
            (payment.configured ? (
              <>
                <p>
                  Гүйлгээний утгад захиалгын кодоо бичээрэй. Админ дансны орлогыг тулгаж
                  баталгаажуулна.
                </p>
                <dl className="bank-details">
                  <div>
                    <dt>Банк</dt>
                    <dd>{payment.bank}</dd>
                  </div>
                  <div>
                    <dt>Данс / IBAN</dt>
                    <dd>
                      {payment.account} <CopyButton value={payment.account} />
                    </dd>
                  </div>
                  <div>
                    <dt>Хүлээн авагч</dt>
                    <dd>{payment.holder}</dd>
                  </div>
                  <div>
                    <dt>Шилжүүлэх дүн</dt>
                    <dd>{money(order.quote.total)}</dd>
                  </div>
                  <div>
                    <dt>Гүйлгээний утга</dt>
                    <dd>
                      {order.code} <CopyButton value={order.code} />
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="notice">
                Энэ нь туршилтын захиалга. Банкны данс тохируулаагүй тул мөнгө шилжүүлэхгүй.
              </p>
            ))}
          <div className="delivery-details">
            <span className="eyebrow">ХҮРГЭЛТ</span>
            <h3>
              {order.customer.name} · {order.customer.phone}
            </h3>
            <p>{order.customer.address}</p>
            {order.customer.note && <p>Хүсэлт: {order.customer.note}</p>}
          </div>
          <div className="order-events">
            <h3>Захиалгын түүх</h3>
            {order.events.map((event) => (
              <p key={event.id}>
                <Clock3 size={14} />
                <span>
                  {statusLabels[event.status]}
                  <small>
                    {new Date(event.created_at).toLocaleString("mn-MN", {
                      timeZone: "Asia/Ulaanbaatar",
                    })}
                  </small>
                </span>
              </p>
            ))}
          </div>
          <RefreshOrder />
          <p className="muted">
            Энэ холбоосоор захиалгын төлөвөө дахин харж болно. Хувийн мэдээлэлтэй тул холбоосоо
            бусдад дамжуулахгүй хадгалаарай.
          </p>
        </section>
        <aside className="order-summary">
          <div className="summary-art sage">
            <Bracelet beads={order.design.beads} stones={order.materials} />
          </div>
          <h3>{order.design.name}</h3>
          <p>
            {order.design.beads.length} чулуу · Бугуйн тойрог {order.design.wrist} см
          </p>
          <div className="price-breakdown">
            <div>
              <span>Бугуйвч</span>
              <span>{money(order.quote.material + order.quote.labor)}</span>
            </div>
            <div>
              <span>Хүргэлт</span>
              <span>{money(order.quote.delivery)}</span>
            </div>
            <div className="total">
              <strong>Нийт</strong>
              <strong>{money(order.quote.total)}</strong>
            </div>
          </div>
          <span className={`status-badge ${order.status}`}>{statusLabels[order.status]}</span>
        </aside>
      </div>
      <Link className="text-link" href="/">
        Нүүр хуудас руу <ArrowUpRight size={16} />
      </Link>
    </main>
  );
}
