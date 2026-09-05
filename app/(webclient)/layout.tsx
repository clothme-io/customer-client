import { Inter } from "next/font/google";
import styles from "./webclient.module.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
});

export const metadata = {
  title: {
    default: "ClothME",
    template: "%s · ClothME"
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function WebClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" data-theme="light" className={`${inter.className} ${styles.html}`}>
      <body className={styles.body}>{children}</body>
    </html>
  );
}
