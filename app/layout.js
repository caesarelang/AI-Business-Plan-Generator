import { Geist } from "next/font/google";
import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";

const geist = Geist({ subsets: ["latin"] });

export const metadata = {
  title: "AI Business Plan Generator",
  description: "Generate business plan dengan AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={geist.className}>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}