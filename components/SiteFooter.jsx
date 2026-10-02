
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="abg-footer">
      <div className="abg-footer-inner">

        {/* BRAND */}
        <div className="abg-footer-brand">
          <Link href="/" className="abg-footer-logo">
            ARONE BD <span>✦</span>
          </Link>

          <p>
            প্রিয়জনের জন্য সুন্দর উপহার, Gift Item ও
            পছন্দের লাইফস্টাইল পণ্য—সবকিছু এক জায়গায়।
          </p>

          <span className="abg-footer-tag">
            🎁 Make Every Moment Special
          </span>
        </div>

        {/* QUICK LINKS */}
        <div className="abg-footer-column">
          <h3>কুইক লিংক</h3>

          <nav aria-label="Footer quick links">
            <Link href="/">হোম</Link>
            <Link href="/shop">সব পণ্য</Link>
            <Link href="/cart">আমার কার্ট</Link>
            <Link href="/track">অর্ডার ট্র্যাকিং</Link>
          </nav>
        </div>

        {/* CUSTOMER SUPPORT */}
        <div className="abg-footer-column">
          <h3>কাস্টমার সাপোর্ট</h3>

          <nav aria-label="Footer customer support">
            <Link href="/account">আমার অ্যাকাউন্ট</Link>
            <Link href="/track">অর্ডারের অবস্থা</Link>
            <a href="tel:01320930888">যোগাযোগ করুন</a>
          </nav>
        </div>


{/* CONTACT & SOCIAL MEDIA */}
<div className="abg-footer-contact">
  <h3>Contact & Follow Us</h3>

  {/* WhatsApp */}
  <a
    href="https://wa.me/8801320930888"
    target="_blank"
    rel="noopener noreferrer"
    className="abg-footer-phone"
  >
    💬 WhatsApp: 01320930888
  </a>

  {/* SOCIAL MEDIA */}
  <div className="abg-social-links">

    {/* Facebook */}
    <a
      href="https://www.facebook.com/share/19tMwRw9VE/"
      target="_blank"
      rel="noopener noreferrer"
      className="abg-social-facebook"
      aria-label="Arone Bd Facebook"
    >
      <span>f</span> Facebook
    </a>

    {/* Instagram */}
    <a
      href="https://www.instagram.com/aronebd1/"
      target="_blank"
      rel="noopener noreferrer"
      className="abg-social-instagram"
      aria-label="Arone Bd Instagram"
    >
      <span>◎</span> Instagram
    </a>

    {/* TikTok */}
    <a
      href="https://www.tiktok.com/@aronebd"
      target="_blank"
      rel="noopener noreferrer"
      className="abg-social-tiktok"
      aria-label="Arone Bd TikTok"
    >
      <span>♪</span> TikTok
    </a>

  </div>
</div>


      </div>

      {/* BOTTOM BAR */}
      <div className="abg-footer-bottom">
        <p>
          © {new Date().getFullYear()} Arone Bd.
          All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
