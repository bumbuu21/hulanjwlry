import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  HandHeart,
  SlidersHorizontal,
  Gem,
} from "lucide-react";
import { Bracelet, StoneOrb } from "@/components/bracelet";
import { HomeSectionScroll } from "@/components/home-section-scroll";
import { initialStones, presets, makePreset, money, LABOR_FEE } from "@/lib/catalog";
import { getStones } from "@/lib/orders";
export const dynamic = "force-dynamic";
export default async function Home() {
  const stones = await getStones();
  return (
    <main id="main" className="home-page">
      <HomeSectionScroll />
      <section className="hero section-shell">
        <div className="hero-copy">
          <h1>
            Таны мэдрэмж.
            <br />
            Таны өнгө.
            <br />
            <em>Таны бугуйвч.</em>
          </h1>
          <p className="hero-description">
            Байгалийн чулуу, charm-аар зөвхөн өөрийн бугуйвчийг бүтээгээрэй.
          </p>
          <div className="hero-actions">
            <Link href="/design" className="button dark">
              Бугуйвчаа бүтээх <ArrowUpRight size={18} />
            </Link>
            <Link href="#collection" className="text-link">
              Цуглуулга үзэх <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-bracelet">
            <Bracelet beads={makePreset("morning")} tilt />
          </div>
          <div className="floating-stone stone-one">
            <StoneOrb stone={initialStones[0]} />
          </div>
          <div className="floating-stone stone-two">
            <StoneOrb stone={initialStones[1]} />
          </div>
          <div className="art-caption">
            <div>
              <h3>Өглөөний шүүдэр</h3>
            </div>
            <Link
              href="/design?preset=morning"
              className="round-link"
              aria-label="Өглөөний шүүдэр загварыг өөрчлөх"
            >
              <ArrowUpRight size={22} />
            </Link>
          </div>
        </div>
        <a className="scroll-cue" href="#collection" aria-label="Цуглуулга руу гүйлгэх">
          <ArrowDown size={16} />
        </a>
      </section>
      <div className="home-morph" aria-hidden="true">
        <span className="home-morph-shape" />
        <span className="home-morph-glow" />
      </div>
      <section id="collection" className="section-shell collection-section reveal">
        <div className="section-heading">
          <div>
            <h2>
              Танд урам өгөх <em>хослолууд</em>
            </h2>
          </div>
          <Link href="/design" className="text-link">
            Бүгдийг өөрөө бүтээх <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {presets.map((preset) => {
            const beads = makePreset(preset.id);
            const price = beads.reduce(
              (sum, id) => sum + (stones.find((s) => s.id === id)?.price ?? 0),
              LABOR_FEE,
            );
            return (
              <Link href={`/design?preset=${preset.id}`} className="product-card" key={preset.id}>
                <div className={`product-art ${preset.bg}`}>
                  <Bracelet beads={beads} />
                  <span className="product-hover">
                    Өөрийнхөөрөө өөрчлөх <ArrowUpRight size={16} />
                  </span>
                </div>
                <div className="product-meta">
                  <div>
                    <h3>{preset.name}</h3>
                  </div>
                  <span>{money(price)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <section id="how-it-works" className="how-section section-shell reveal">
        <div className="how-intro">
          <h2>
            Төсөөллөөс
            <br />
            <em>таны бугуйнд.</em>
          </h2>
          <Link href="/design" className="text-link">
            Бүтээж эхлэх <ArrowRight size={17} />
          </Link>
        </div>
        <div className="steps">
          <article>
            <span>01</span>
            <Gem size={26} strokeWidth={1.2} />
            <h3>Чулуугаа мэдэр</h3>
            <p>Өөрт ойр санагдах өнгө, байгалийн хээгээ сонго.</p>
          </article>
          <article>
            <span>02</span>
            <SlidersHorizontal size={26} strokeWidth={1.2} />
            <h3>Өөрийнхөөрөө зохио</h3>
            <p>Чулуу бүрийг байрлуулж, бугуйн хэмжээндээ тааруул.</p>
          </article>
          <article>
            <span>03</span>
            <HandHeart size={28} strokeWidth={1.2} />
            <h3>Бид гараар урлая</h3>
            <p>Захиалгаа илгээж, шилжүүлэг хийнэ. Төлбөр батлагдмагц бид урлаж эхэлнэ.</p>
          </article>
        </div>
      </section>
      <section id="stones" className="stones-section section-shell reveal">
        <div className="section-heading">
          <div>
            <h2>
              Чулуу бүр <em>өөрийн өнгөтэй.</em>
            </h2>
          </div>
        </div>
        <div className="stone-grid">
          {stones
            .filter((s) => s.active)
            .map((stone) => (
              <Link href={`/design?stone=${stone.id}`} className="stone-story" key={stone.id}>
                <div className="stone-display">
                  <StoneOrb stone={stone} />
                  <ArrowUpRight size={17} />
                </div>
                <h3>{stone.name}</h3>
              </Link>
            ))}
        </div>
      </section>
      <section id="story" className="story-section section-shell reveal">
        <div className="story-art">
          <div className="story-rings">
            <Bracelet beads={makePreset("blush")} tilt />
            <Bracelet beads={makePreset("quiet")} tilt />
          </div>
        </div>
        <div className="story-copy">
          <h2>
            Их зүйл хэрэггүй.
            <br />
            <em>Өөрийн зүйл л байхад.</em>
          </h2>
          <p>
            Бид гоёлыг таны тухай жижигхэн түүх гэж хардаг. Дуртай өнгө, нандин дурсамж, эсвэл
            зүгээр л өнөөдрийн мэдрэмж.
          </p>
          <span className="story-signature">with love, hulan.</span>
        </div>
      </section>
      <section className="closing-cta reveal">
        <h2>
          Өнөөдөр ямар өнгөөр <em>гэрэлтэх вэ?</em>
        </h2>
        <Link href="/design" className="button dark">
          Миний бугуйвчийг бүтээх <ArrowUpRight size={18} />
        </Link>
      </section>
    </main>
  );
}
