import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import "./workspace-v2.css";
const display = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const body = Manrope({ subsets: ["latin"], variable: "--font-body" });
export const metadata: Metadata = { title: "Stewardlane Ã¢â‚¬â€ Advisor-owned AI commentary", description: "A compliance-first household CRM and review system for wealth advisory firms." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${display.variable} ${body.variable}`}>{children}</body></html> }
