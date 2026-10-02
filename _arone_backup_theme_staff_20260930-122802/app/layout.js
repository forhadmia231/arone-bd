

import "./globals.css";
import "./mobile-ui.css";
import "./shop-reference.css";
import "./checkout-delivery.css";


import MobileBottomNav from "@/components/MobileBottomNav";


import { CartProvider } from "@/components/CartProvider";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

import AdsTracking from "@/components/AdsTracking";
import FloatingSupport from "@/components/FloatingSupport";

export const metadata = {
  title: {
    default: "Arone Bd | Cookware & More",
    template: "%s | Arone Bd",
  },

  description:
    "Shop quality cookware and everyday essentials at Arone Bd. Nationwide Cash on Delivery in Bangladesh.",
};

export default function RootLayout({ children }) {

  return (
    <html lang="bn">

      <body suppressHydrationWarning>

        <CartProvider>

          <SiteHeader />

          {children}

          <SiteFooter />

          <AdsTracking />

          <FloatingSupport />

          <MobileBottomNav />

          

        </CartProvider>

      </body>

    </html>
  );
}
