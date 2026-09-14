import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Link href="/" className="wordmark">
            hulan<span>JEWELRY STUDIO</span>
          </Link>
          <p>Өөрийнхөөрөө гэрэлт.</p>
        </div>
        <div className="footer-links">
          <Link href="/design">
            Бугуйвчаа бүтээх <ArrowUpRight size={15} />
          </Link>
          <Link href="/#stones">Чулууны ертөнц</Link>
          <Link href="/#how-it-works">Хэрхэн захиалах вэ?</Link>
        </div>
        <p className="footer-note">
          Жижигхэн чулуу бүрд,
          <br />
          таны өөрийн түүх.
        </p>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Hulan Jewelry</span>
        <span>Улаанбаатар, Монгол</span>
        <Link href="/admin">
          Студио удирдлага <ArrowUpRight size={12} />
        </Link>
      </div>
    </footer>
  );
}
