import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Paper colour on the whole document, so printed pages are filled to the
    // edge even where content ends early (matches --paper in cv.module.css).
    <html lang="en" style={{ background: "#f2f0ed", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
      <body className={poppins.className} style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
