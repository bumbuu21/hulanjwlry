"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Gem,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Undo2,
} from "lucide-react";
import { Bracelet, CharmIcon, StoneOrb } from "./bracelet";
import {
  type Stone,
  charmGroups,
  isCharm,
  makePreset,
  presets,
  money,
  LABOR_FEE,
  DELIVERY_FEE,
} from "@/lib/catalog";
import { designSchema, recommendedCount, innerCircumference } from "@/lib/domain";

export function Designer({
  stones,
  preset,
  startingStone,
  resume,
}: {
  stones: Stone[];
  preset?: string;
  startingStone?: string;
  resume?: boolean;
}) {
  const router = useRouter();
  const [beads, setBeads] = useState<string[]>(
    startingStone && stones.some((s) => s.id === startingStone)
      ? Array(24).fill(startingStone)
      : preset
        ? makePreset(preset)
        : [],
  );
  const [selected, setSelected] = useState(-1);
  const [wrist, setWrist] = useState(16);
  const [name, setName] = useState("Миний жижигхэн ертөнц");
  const [history, setHistory] = useState<string[][]>([]);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"stones" | "charms" | "presets">("stones");
  const [stoneQuery, setStoneQuery] = useState("");
  const [charmQuery, setCharmQuery] = useState("");
  const [charmGroup, setCharmGroup] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");
  useEffect(() => {
    if (!resume) return;
    try {
      const draft = designSchema.safeParse(
        JSON.parse(localStorage.getItem("hulan-checkout") || "null"),
      );
      if (
        draft.success &&
        draft.data.beads.every((id) => stones.some((stone) => stone.id === id))
      ) {
        setBeads(draft.data.beads);
        setWrist(draft.data.wrist);
        setName(draft.data.name);
      }
    } catch {
      setMessage("Өмнөх загварыг нээх боломжгүй байна.");
    }
  }, [resume, stones]);
  const available = stones.filter((s) => s.active && s.stock > 0);
  const colorGroups = [
    { id: "all", label: "Бүгд", ids: [] },
    { id: "white", label: "Цагаан", ids: ["moon"] },
    { id: "pink", label: "Ягаан", ids: ["rose"] },
    { id: "green", label: "Ногоон", ids: ["sage"] },
    { id: "purple", label: "Нил ягаан", ids: ["amethyst"] },
    { id: "yellow", label: "Шаргал", ids: ["sand"] },
    { id: "blue", label: "Цэнхэр", ids: ["blue"] },
  ];
  const shownStones = available.filter(
    (stone) =>
      !isCharm(stone) &&
      (colorFilter === "all" ||
        colorGroups.find((group) => group.id === colorFilter)?.ids.includes(stone.id)) &&
      `${stone.name} ${stone.english}`.toLowerCase().includes(stoneQuery.trim().toLowerCase()),
  );
  const shownCharms = available.filter(
    (charm) =>
      isCharm(charm) &&
      (charmGroup === "all" || charmGroup === "used"
        ? charmGroup !== "used" || beads.includes(charm.id)
        : charmGroups.find((group) => group.id === charmGroup)?.ids.includes(charm.id)) &&
      `${charm.name} ${charm.english}`.toLowerCase().includes(charmQuery.trim().toLowerCase()),
  );
  const material = beads.reduce(
    (total, id) => total + (stones.find((s) => s.id === id)?.price ?? 0),
    0,
  );
  const fit = Math.abs(beads.length - recommendedCount(wrist)) <= 1;
  const stockOk = beads.every((id) => {
    const stone = stones.find((s) => s.id === id);
    return stone?.active && stone.stock >= beads.filter((b) => b === id).length;
  });
  function edit(next: string[]) {
    setHistory((old) => [...old.slice(-29), beads]);
    setBeads(next);
    setMessage("");
  }
  function choose(id: string) {
    if (selected >= 0) {
      const next = [...beads];
      next[selected] = id;
      edit(next);
    } else if (beads.length < 32) edit([...beads, id]);
    else setMessage("Нэг бугуйвчинд 32 хүртэл эд анги сонгоно.");
  }
  function fill(id: string) {
    const count = recommendedCount(wrist);
    const stone = available.find((item) => item.id === id);
    if (!stone || stone.stock < count) {
      setMessage("Энэ чулууны үлдэгдэл бүтэн бугуйвчинд хүрэлцэхгүй байна.");
      return;
    }
    edit(Array(count).fill(id));
    setSelected(-1);
  }
  function resize(value: number) {
    setWrist(value);
    setSelected(-1);
  }
  function fitToWrist() {
    if (beads.length === 0) return;
    const count = recommendedCount(wrist);
    edit(
      Array.from(
        { length: count },
        (_, i) => beads[i] ?? beads[beads.length - 1] ?? available[0]?.id ?? "moon",
      ),
    );
    setSelected(-1);
  }
  function move(offset: number) {
    if (selected < 0) return;
    const target = (selected + offset + beads.length) % beads.length;
    swap(selected, target);
  }
  function swap(from: number, target: number) {
    if (from === target || from < 0 || target < 0 || from >= beads.length || target >= beads.length)
      return;
    const next = [...beads];
    [next[from], next[target]] = [next[target], next[from]];
    edit(next);
    setSelected(target);
  }
  function save() {
    try {
      localStorage.setItem("hulan-saved-design", JSON.stringify({ beads, wrist, name }));
      setMessage("Загвар энэ төхөөрөмжид хадгалагдлаа.");
    } catch {
      setMessage("Хөтчийн хадгалалт боломжгүй байна.");
    }
  }
  function restore() {
    try {
      const result = designSchema.safeParse(
        JSON.parse(localStorage.getItem("hulan-saved-design") || "null"),
      );
      if (!result.success || result.data.beads.some((id) => !stones.some((s) => s.id === id))) {
        setMessage("Хадгалсан загвар олдсонгүй.");
        return;
      }
      edit(result.data.beads);
      setWrist(result.data.wrist);
      setName(result.data.name);
      setSelected(-1);
      setMessage("Хадгалсан загварыг нээлээ.");
    } catch {
      setMessage("Хадгалсан загварыг нээх боломжгүй байна.");
    }
  }
  function checkout() {
    try {
      const design = designSchema.parse({ beads, wrist, name });
      localStorage.setItem("hulan-checkout", JSON.stringify(design));
      sessionStorage.removeItem("hulan-order-attempt");
      router.push("/checkout");
    } catch {
      setMessage("Загварын нэр болон чулууны тоогоо шалгана уу.");
    }
  }
  return (
    <main id="main" className="designer-page section-shell">
      <div className="breadcrumb">
        <Link href="/">Нүүр</Link>
        <span>/</span>
        <span>Таны бүтээл</span>
      </div>
      <div className="designer-heading">
        <div>
          <p className="eyebrow">YOUR LITTLE DESIGN STUDIO</p>
          <h1>
            Өөрийнхөөрөө <em>бүтээ.</em>
          </h1>
          <p>Чулуу бүрийг өөрийн мэдрэмжээр. Бусдыг нь бидэнд үлдээгээрэй.</p>
        </div>
        <button className="text-link" onClick={restore}>
          <RotateCcw size={15} /> Хадгалсан загвар
        </button>
      </div>
      <div className="designer-grid">
        <section className="design-workspace" aria-label="Бугуйвчны зураглал">
          <div className="workspace-top">
            <span className="eyebrow">
              <span className="live-dot" /> ТАНЫ БҮТЭЭЛ
            </span>
            <span>8 мм суурь · Чулуу & charm</span>
          </div>
          <div className="design-canvas">
            <div className="canvas-guide" />
            <Bracelet
              beads={beads}
              stones={stones}
              slots={recommendedCount(wrist)}
              selected={selected}
              onSelect={(index) => setSelected(index === selected ? -1 : index)}
              onSwap={swap}
            />
            <div className="canvas-center">
              {beads.length ? (
                <>
                  <span>{beads.length}</span>
                  <small>эд анги</small>
                </>
              ) : (
                <>
                  <Gem size={30} strokeWidth={1} />
                  <small>Таны бүтээл энд эхэлнэ</small>
                </>
              )}
            </div>
          </div>
          <p className="canvas-hint">
            <CircleHelp size={14} />{" "}
            {selected >= 0
              ? `${selected + 1}-р эд анги сонгогдлоо. Каталогоос өөрөөр солино.`
              : beads.length
                ? "Эд ангийг чирж байрлалыг нь солих эсвэл дарж сонгоорой."
                : "Зүүн талын каталогоос чулуу эсвэл charm нэмж эхлээрэй."}
          </p>
          <div className="canvas-toolbar">
            <button
              className="icon-button"
              aria-label="Өмнөх үйлдлийг буцаах"
              disabled={!history.length}
              onClick={() => {
                setBeads(history[history.length - 1]);
                setHistory(history.slice(0, -1));
                setSelected(-1);
              }}
            >
              <Undo2 size={18} />
            </button>
            <span className="toolbar-divider" />
            <button
              className="icon-button"
              aria-label="Чулууг зүүн тийш шилжүүлэх"
              disabled={selected < 0}
              onClick={() => move(-1)}
            >
              <ChevronLeft size={19} />
            </button>
            <button
              className="icon-button"
              aria-label="Чулууг баруун тийш шилжүүлэх"
              disabled={selected < 0}
              onClick={() => move(1)}
            >
              <ChevronRight size={19} />
            </button>
            <button
              className="icon-button"
              aria-label="Сонгосон чулууг устгах"
              disabled={selected < 0}
              onClick={() => {
                edit(beads.filter((_, i) => i !== selected));
                setSelected(-1);
              }}
            >
              <Trash2 size={17} />
            </button>
            <span className="toolbar-divider" />
            <button className="text-link" onClick={save} disabled={!fit || beads.length < 16}>
              <Save size={16} /> Хадгалах
            </button>
          </div>
          <div className="workspace-bottom">
            <Gem size={17} />
            <p>Чулууны бодит өнгө, хээ нь байгалиасаа бага зэрэг ялгаатай байна.</p>
          </div>
        </section>
        <aside className="design-panel" aria-label="Материалын каталог">
          <div className="panel-tabs">
            <button className={tab === "stones" ? "selected" : ""} onClick={() => setTab("stones")}>
              Чулуу
            </button>
            <button className={tab === "charms" ? "selected" : ""} onClick={() => setTab("charms")}>
              Charms
            </button>
            <button
              className={tab === "presets" ? "selected" : ""}
              onClick={() => setTab("presets")}
            >
              Хослол
            </button>
          </div>
          {tab === "stones" ? (
            <>
              <div className="catalog-search">
                <Search size={16} />
                <input
                  aria-label="Чулуу хайх"
                  placeholder="Чулууны нэрээр хайх"
                  value={stoneQuery}
                  onChange={(event) => setStoneQuery(event.target.value)}
                />
              </div>
              <div className="catalog-colors" role="group" aria-label="Өнгөөр шүүх">
                {colorGroups.map((group) => (
                  <button
                    key={group.id}
                    className={colorFilter === group.id ? "active" : ""}
                    aria-pressed={colorFilter === group.id}
                    onClick={() => setColorFilter(group.id)}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
              <div className="panel-label">
                <span>{selected >= 0 ? "Сонгосон чулууг солих" : "Чулуу сонгох"}</span>
                {selected >= 0 && (
                  <button onClick={() => setSelected(-1)} className="text-link">
                    <Plus size={13} /> Нэмэх горим
                  </button>
                )}
              </div>
              <div className="stone-picker">
                {shownStones.map((stone) => (
                  <div className="stone-option" key={stone.id}>
                    <button
                      onClick={() => choose(stone.id)}
                      className={selected >= 0 && beads[selected] === stone.id ? "chosen" : ""}
                      aria-label={`${stone.name} ${selected >= 0 ? "солих" : "нэмэх"}`}
                    >
                      <StoneOrb stone={stone} />
                      <strong>{stone.name}</strong>
                      <span>8 мм · {money(stone.price)}</span>
                      {selected >= 0 && beads[selected] === stone.id && (
                        <Check className="stone-check" size={13} />
                      )}
                    </button>
                    <button
                      className="stone-fill"
                      onClick={() => fill(stone.id)}
                      aria-label={`${stone.name} чулуугаар бүхэлд нь бөглөх`}
                    >
                      Бүгдийг энэ чулуугаар <ArrowRight size={12} />
                    </button>
                  </div>
                ))}
              </div>
              {shownStones.length === 0 && (
                <p className="catalog-empty">
                  Ийм чулуу олдсонгүй. Өөр өнгө эсвэл нэрээр хайгаарай.
                </p>
              )}
            </>
          ) : tab === "charms" ? (
            <>
              <div className="catalog-search">
                <Search size={16} />
                <input
                  aria-label="Charm хайх"
                  placeholder="Charm-ийн нэрээр хайх"
                  value={charmQuery}
                  onChange={(event) => setCharmQuery(event.target.value)}
                />
              </div>
              <div className="catalog-colors" role="group" aria-label="Charm төрлөөр шүүх">
                {[
                  ...charmGroups,
                  {
                    id: "used",
                    label: `Ашигласан (${beads.filter((id) => id.startsWith("charm-")).length})`,
                    ids: [],
                  },
                ].map((group) => (
                  <button
                    key={group.id}
                    className={charmGroup === group.id ? "active" : ""}
                    aria-pressed={charmGroup === group.id}
                    onClick={() => setCharmGroup(group.id)}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
              <div className="panel-label">
                <span>{selected >= 0 ? "Сонгосон эд ангийг солих" : "Charm нэмэх"}</span>
                {selected >= 0 && (
                  <button onClick={() => setSelected(-1)} className="text-link">
                    <Plus size={13} /> Нэмэх горим
                  </button>
                )}
              </div>
              <div className="stone-picker charm-picker">
                {shownCharms.map((charm) => (
                  <div className="stone-option charm-option" key={charm.id}>
                    <button
                      onClick={() => choose(charm.id)}
                      className={selected >= 0 && beads[selected] === charm.id ? "chosen" : ""}
                      aria-label={`${charm.name} ${selected >= 0 ? "солих" : "нэмэх"}`}
                    >
                      <CharmIcon material={charm} size={48} />
                      <strong>{charm.name}</strong>
                      <span>{money(charm.price)}</span>
                      {selected >= 0 && beads[selected] === charm.id && (
                        <Check className="stone-check" size={13} />
                      )}
                    </button>
                    <span className="charm-kind">
                      {charmGroups.find((group) => group.ids.includes(charm.id))?.label} · 1 оролт
                    </span>
                  </div>
                ))}
              </div>
              {shownCharms.length === 0 && (
                <p className="catalog-empty">Ийм charm олдсонгүй. Өөр төрлөөр хайгаарай.</p>
              )}
            </>
          ) : (
            <div className="preset-picker">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    edit(makePreset(p.id));
                    setWrist(16);
                    setName(p.name);
                    setSelected(-1);
                  }}
                >
                  <span className={p.bg}>
                    <Bracelet beads={makePreset(p.id)} stones={stones} />
                  </span>
                  <div>
                    <strong>{p.name}</strong>
                    <small>{p.note}</small>
                  </div>
                  <ArrowUpRight size={17} />
                </button>
              ))}
            </div>
          )}
        </aside>
        <aside className="design-summary" aria-label="Загварын мэдээлэл">
          <div className="summary-topline">
            <p className="eyebrow">ТАНЫ ЗАГВАР / 01</p>
            <span>
              {Math.min(beads.length, recommendedCount(wrist))} / {recommendedCount(wrist)} эд анги
            </span>
          </div>
          <div
            className="design-progress"
            role="progressbar"
            aria-label="Чулууны тоо"
            aria-valuenow={beads.length}
            aria-valuemin={0}
            aria-valuemax={recommendedCount(wrist)}
          >
            <span
              style={{ width: `${Math.min(100, (beads.length / recommendedCount(wrist)) * 100)}%` }}
            />
          </div>
          <div className="size-control">
            <div className="panel-label">
              <label htmlFor="wrist">Бугуйн тойрог</label>
              <span>{wrist} см</span>
            </div>
            <input
              id="wrist"
              type="range"
              min="13"
              max="22"
              step="1"
              value={wrist}
              onChange={(e) => resize(Number(e.target.value))}
            />
            <div className="range-labels">
              <span>13 см</span>
              <span>22 см</span>
            </div>
            <p>Бугуйгаа сул зай үлдээлгүй хэмжээрэй. Бид ойролцоогоор 0.7 см сул зай тооцно.</p>
            <div className={`fit-message ${fit ? "" : "warning"}`}>
              {fit ? <Check size={14} /> : <CircleHelp size={14} />}
              <span>
                {beads.length
                  ? `Дотор тойрог ≈ ${innerCircumference(beads.length)} см`
                  : "Чулуу нэмбэл тойрог харагдана"}
                {!fit && ` · ${recommendedCount(wrist)} чулуу санал болгоно`}
              </span>
              {!fit && beads.length > 0 && <button onClick={fitToWrist}>Тааруулах</button>}
            </div>
          </div>
          <label className="field design-name">
            Загварын нэр
            <input
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Миний бугуйвч"
            />
          </label>
          <div className="design-price">
            <div>
              <span>Таны бугуйвч</span>
              <strong>{money(beads.length ? material + LABOR_FEE : 0)}</strong>
            </div>
            <p>
              Урлалын {money(LABOR_FEE)} багтсан · хүргэлт {money(DELIVERY_FEE)}
            </p>
          </div>
          <button
            className="button dark full-width"
            disabled={beads.length < 16 || !fit || !stockOk || !name.trim()}
            onClick={checkout}
          >
            Энэ загвараар захиалах <ArrowRight size={18} />
          </button>
          {!stockOk && (
            <p className="form-error">
              Зарим чулууны үлдэгдэл хүрэлцэхгүй байна. Хослолоо өөрчилнө үү.
            </p>
          )}
          <p role="status" className="status-message">
            {message}
          </p>
          <Link href="/#how-it-works" className="panel-help">
            Захиалга хэрхэн баталгаажих вэ? <ArrowUpRight size={13} />
          </Link>
        </aside>
      </div>
      <Link href="/#collection" className="text-link back-link">
        <ArrowLeft size={16} /> Цуглуулга руу буцах
      </Link>
    </main>
  );
}
