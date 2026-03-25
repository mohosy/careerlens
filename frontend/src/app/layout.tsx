import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "CareerLens - AI Career Intelligence",
  description:
    "Deep research your dream companies. Get a vision board with real interview questions, employee insights, and a personalized career roadmap.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lato.variable} h-full antialiased`}>
      <body className={`${lato.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
