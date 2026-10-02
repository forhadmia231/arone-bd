"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { money } from "@/lib/format";
import { trackCommerceEvent, trackPlacedOrder } from "@/lib/ads-events";

export default function CheckoutPage() {
  const { items, subtotal, clear, loaded } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    area: "",
    address: "",
    note: "",
  });
  const [deliveryZone, setDeliveryZone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const shipping =
    deliveryZone === "inside_dhaka"
      ? 70
      : deliveryZone === "outside_dhaka"
        ? 130
        : null;

  const update = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then(({ user }) => {
        if (active && user) {
          setForm((previous) => ({
            ...previous,
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
          }));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!loaded || !items.length) return;
    const send = () => {
      if (trackCommerceEvent("InitiateCheckout", { items, value: subtotal })) {
        window.removeEventListener("paaikar:tracking-ready", send);
      }
    };
    if (!trackCommerceEvent("InitiateCheckout", { items, value: subtotal })) {
      window.addEventListener("paaikar:tracking-ready", send);
    }
    return () => window.removeEventListener("paaikar:tracking-ready", send);
  }, [loaded, items, subtotal]);

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!deliveryZone) {
      setError("প্রথমে ডেলিভারি এলাকা নির্বাচন করুন।");
      return;
    }
    if (deliveryZone === "outside_dhaka" && form.city.trim().length < 2) {
      setError("ঢাকার বাইরের ডেলিভারি ঠিকানার জেলা/শহরের নাম দিন।");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          city: deliveryZone === "inside_dhaka" ? "ঢাকা" : form.city.trim(),
          deliveryZone,
          items: items.map((item) => ({
            id: item.id,
            qty: item.qty,
            expectedPrice: item.price,
          })),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "অর্ডার গ্রহণ করা যায়নি। আবার চেষ্টা করুন।");
      }
      trackPlacedOrder(result.order);
      clear();
      router.replace("/order-success/" + encodeURIComponent(result.order.orderNo));
    } catch (err) {
      setError(err.message || "অর্ডার সম্পন্ন করা যায়নি।");
    } finally {
      setPending(false);
    }
  }

  if (!loaded) return <main className="container section">লোড হচ্ছে...</main>;
  if (!items.length) {
    return (
      <main className="container section empty">
        <h2>কার্টে কোনো পণ্য নেই</h2>
        <Link className="btn btn-primary" href="/shop">শপ করুন</Link>
      </main>
    );
  }

  return (
    <main className="container section ar-checkout">
      <div className="breadcrumb">কার্ট / <b>চেকআউট</b></div>
      
<h2 className="page-title" style={{ textAlign: "center" }}>
  Checkout Form 
</h2>


      <form className="checkout-layout" onSubmit={submit}>
        <div className="panel">
          <h4>অর্ডার কনফার্ম করতে নিচের তথ্যগুলো দিন</h4>

          <fieldset className="ar-checkout-zones">
            <legend>ডেলিভারি এলাকা নির্বাচন করুন *</legend>
            <div className="ar-checkout-zone-grid">
              <label className={`ar-checkout-zone ${deliveryZone === "inside_dhaka" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="deliveryZone"
                  value="inside_dhaka"
                  checked={deliveryZone === "inside_dhaka"}
                  onChange={() => setDeliveryZone("inside_dhaka")}
                  required
                />
                <span>ঢাকার ভিতরে <small>Delivery Charge</small></span>
                <strong>৳৭০</strong>
              </label>
              <label className={`ar-checkout-zone ${deliveryZone === "outside_dhaka" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="deliveryZone"
                  value="outside_dhaka"
                  checked={deliveryZone === "outside_dhaka"}
                  onChange={() => setDeliveryZone("outside_dhaka")}
                  required
                />
                <span>ঢাকার বাইরে <small>Delivery Charge</small></span>
                <strong>৳১৩০</strong>
              </label>
            </div>
          </fieldset>

          <div className="form-grid">
            <label> সম্পূর্ণ নাম *
              <input required minLength={2} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="আপনার নাম" />
            </label>
            <label>মোবাইল নম্বর *
              <input required type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="01XXXXXXXXX" />
            </label>
            <label>Email(Optional )
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </label>
            <label>শহর / জেলা *
              {deliveryZone === "inside_dhaka" ? (
                <input value="ঢাকা" readOnly aria-label="নির্বাচিত শহর ঢাকা" />
              ) : (
                <input
                  required
                  minLength={2}
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder={deliveryZone ? "আপনার জেলা / শহর লিখুন" : "উপর থেকে ডেলিভারি এলাকা নির্বাচন করুন"}
                  disabled={!deliveryZone}
                />
              )}
            </label>
            <label>এলাকা / থানা
              <input value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="যেমন: মিরপুর / সদর" />
            </label>
            <label className="wide">সম্পূর্ণ ঠিকানা *
              <textarea required minLength={8} rows={3} value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="গ্রাম ,বাজার,থানা ও জেলা" />
            </label>

<label className="wide">
  Note (Optional )
  <textarea
    rows={2}
    value={form.note}
    onChange={(e) =>
      setForm({ ...form, note: e.target.value })
    }
    placeholder="বিশেষ কোনো নির্দেশনা থাকলে লিখুন (না দিলেও চলবে)"
  />
</label>


          </div>

         
        </div>

        <aside className="summary checkout-summary">
          <h2>আপনার অর্ডার</h2>
          {items.map((item) => (
            <div key={item.id}>
              <span>{item.name} × {item.qty}</span>
              <b>{money(item.price * item.qty)}</b>
            </div>
          ))}
          <hr />
          <div><span>সাবটোটাল</span><b>{money(subtotal)}</b></div>
          <div>
            <span>ডেলিভারি {deliveryZone === "inside_dhaka" ? "(ঢাকার ভিতরে)" : deliveryZone === "outside_dhaka" ? "(ঢাকার বাইরে)" : ""}</span>
            <b>{shipping === null ? "এলাকা নির্বাচন করুন" : money(shipping)}</b>
          </div>
          <hr />
          <div>
            <b>সর্বমোট</b>
            <strong>{shipping === null ? "—" : money(subtotal + shipping)}</strong>
          </div>
          {error && <p className="error-text" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary full" disabled={pending || shipping === null}>
            {pending ? "অর্ডার প্রসেস হচ্ছে..." : "অর্ডার কনফার্ম করুন "}
          </button>
          

{/* CHECKOUT INFORMATION */}
<div className="checkout-after-order">

  {/* ORDER NOTICE */}
  <div className="checkout-order-notice">
    <span className="checkout-notice-icon">🙏</span>

    <p>
      অনুগ্রহ করে সব তথ্য যাচাই করে
       নিশ্চিত হয়েই অর্ডার করুন। 
      অপ্রয়োজনীয় অর্ডার আমাদের ব্যবসার ক্ষতি করে।
      আপনাদের সহযোগিতা একান্ত কাম্য।
    </p>
  </div>

  {/* RETURN & DELIVERY INFORMATION */}
  <div className="checkout-info-list">

    <details className="checkout-info-card">
      <summary>
        <span className="checkout-info-left">
          <span className="checkout-info-icon">↩</span>

          <span className="checkout-info-label">
            <strong>রিটার্ন পলিসি</strong>
            <small>Return Policy</small>
          </span>
        </span>

        <span className="checkout-info-arrow">⌄</span>
      </summary>

      <div className="checkout-info-content">
        পণ্য রিটার্ন করতে চাইলে রিটার্ন ডেলিভারি চার্জ
        প্রদান করে পণ্যটি ফেরত দিতে পারবেন।
        প্রয়োজনে আমাদের Customer Support-এর সঙ্গে যোগাযোগ করুন।
      </div>
    </details>

    <details className="checkout-info-card">
      <summary>
        <span className="checkout-info-left">
          <span className="checkout-info-icon">🚚</span>

          <span className="checkout-info-label">
            <strong>ডেলিভারি সময়</strong>
            <small>Estimated Delivery Time</small>
          </span>
        </span>

        <span className="checkout-info-arrow">⌄</span>
      </summary>

      <div className="checkout-info-content">
        <div className="checkout-time-row">
          <span>ঢাকার ভিতরে</span>
          <strong>২ দিন</strong>
        </div>

        <div className="checkout-time-row">
          <span>ঢাকার বাইরে</span>
          <strong>২–৩ দিন</strong>
        </div>
      </div>
    </details>

  </div>
</div>


        </aside>
      </form>
    </main>
  );
}
