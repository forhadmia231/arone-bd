import AbandonedCheckoutTracker from "@/components/AbandonedCheckoutTracker";
import PromotionLayer from "@/components/PromotionLayer";
import ThemeLoader from "@/components/ThemeLoader";


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
  title: "Arone Bd | Gift & Lifestyle",
  description: "Arone Bd - Your trusted online shop in Bangladesh",
};



export default function RootLayout({ children }) {

  return (
    <html lang="bn">

      <body suppressHydrationWarning>
        <AbandonedCheckoutTracker />
        <ThemeLoader />

        <CartProvider>

          <SiteHeader />

          {children}

          <SiteFooter />

          <AdsTracking />

          <FloatingSupport />

          <MobileBottomNav />

        </CartProvider>

        <PromotionLayer />
      </body>

    </html>
  );
}

