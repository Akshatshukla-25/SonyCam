import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Sony Alpha α6000 — Professional Mirrorless Camera",
  description: "Capture every moment with professional speed and stunning image quality in a compact mirrorless design. 24.3MP APS-C sensor, 179-point autofocus, 11fps burst.",
  keywords: ["Sony", "Alpha", "a6000", "mirrorless", "camera", "photography"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ background: "#050505", color: "#fff" }}>
        {children}
      </body>
    </html>
  );
}
