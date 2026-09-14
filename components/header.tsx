"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X, Gem } from "lucide-react";
import { useState } from "react";
export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="site-header">
      <Link
        href="/"
        className="wordmark"
        aria-label="Hulan Jewelry нүүр"
        onClick={() => setOpen(false)}
      >
        hulan<span>JEWELRY STUDIO</span>
      </Link>
      <nav className={open ? "main-nav open" : "main-nav"} aria-label="Үндсэн цэс">
        <Link href="/#collection" onClick={() => setOpen(false)}>
          Цуглуулга
        </Link>
        <Link href="/#stones" onClick={() => setOpen(false)}>
          Байгалийн чулуу
        </Link>
        <Link href="/#story" onClick={() => setOpen(false)}>
          Бидний тухай
        </Link>
      </nav>
      <Link className={`header-cta ${pathname === "/design" ? "active" : ""}`} href="/design">
        <Gem size={16} />
        <span>Өөрөө бүтээх</span>
        <ArrowUpRight size={16} />
      </Link>
      <button
        className="icon-button mobile-menu"
        aria-label={open ? "Цэс хаах" : "Цэс нээх"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>
    </header>
  );
}
