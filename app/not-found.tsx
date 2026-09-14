import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="empty-state">
      <p className="eyebrow">404 / ЭНД ОДООХОНДОО ЮУ Ч АЛГА</p>
      <h1>
        Хуудас <em>олдсонгүй.</em>
      </h1>
      <p>Холбоосоо шалгах эсвэл нүүр хуудас руу буцаарай.</p>
      <Link href="/" className="button dark">
        Нүүр хуудас
      </Link>
    </main>
  );
}
