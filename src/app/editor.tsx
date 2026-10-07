"use client";

import { createContext, use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowLeftRight, ArrowUp, Check, ChevronRight, Mail, Pencil, Phone, Plus, Printer, Redo2, Trash2, Undo2, X } from "lucide-react";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import { saveCv } from "./actions";
import { newItem, templates, type Cv, type History, type Section, type SectionType } from "./types";
import s from "./cv.module.css";

const Editing = createContext(false);

// Text that turns typeable in edit mode. It commits on blur, and `key={value}`
// remounts it with the committed text, so React never fights the typed DOM.
function T({
  value,
  onChange,
  as = "span",
  className,
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  as?: "span" | "p" | "h2" | "b" | "small";
  className?: string;
  multiline?: boolean;
}) {
  const editing = use(Editing);
  const Tag = as as "span";
  return (
    <Tag
      key={value}
      className={className}
      data-placeholder="Type here"
      contentEditable={editing ? "plaintext-only" : undefined}
      suppressContentEditableWarning
      onBlur={(e) => {
        const v = e.currentTarget.innerText.trim();
        if (editing && v !== value) onChange(v);
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    >
      {value}
    </Tag>
  );
}

function Btn({ label, onClick, disabled, children, className = s.mini }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" className={`${className} ${s.ui}`} aria-label={label} title={label} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

const Del = ({ onClick }: { onClick: () => void }) => (
  <Btn label="Remove" onClick={onClick} className={s.del}>
    <X size={12} aria-hidden />
  </Btn>
);

export function Editor({ initial, history, canSave }: { initial: Cv; history: History; canSave: boolean }) {
  // past/future hold earlier and undone versions, so deletes and moves can be taken back.
  const [{ past, cv, future }, setHistory] = useState({ ...history, cv: initial });
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const saved = useRef(initial);

  // Every edit goes through here: copy, apply, remember the old version, show.
  function change(fn: (draft: Cv) => void) {
    setHistory((h) => {
      const next = structuredClone(h.cv);
      fn(next);
      // ponytail: last 100 versions, resent whole on every save; send diffs if cv.json gets big.
      return { past: [...h.past, h.cv].slice(-100), cv: next, future: [] };
    });
    if (canSave) setStatus("saving");
  }

  function undo() {
    if (!past.length) return;
    setHistory((h) => ({ past: h.past.slice(0, -1), cv: h.past[h.past.length - 1], future: [h.cv, ...h.future] }));
    if (canSave) setStatus("saving");
  }

  function redo() {
    if (!future.length) return;
    setHistory((h) => ({ past: [...h.past, h.cv], cv: h.future[0], future: h.future.slice(1) }));
    if (canSave) setStatus("saving");
  }

  // Cmd/Ctrl+Z to undo, Shift+Cmd/Ctrl+Z or Ctrl+Y to redo. Inside a text field
  // the browser's own undo handles the typing instead.
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (!(e.metaKey || e.ctrlKey) || t.isContentEditable || t.matches?.("input, textarea, select")) return;
      const k = e.key.toLowerCase();
      if (k === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (k === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Save to cv.json half a second after the last change (undo included).
  useEffect(() => {
    if (cv === saved.current || !canSave) return;
    const t = setTimeout(
      () =>
        saveCv(cv, { past, future }).then(
          () => ((saved.current = cv), setStatus("saved")),
          () => setStatus("error"),
        ),
      500,
    );
    return () => clearTimeout(t);
  }, [cv, past, future, canSave]);

  const set = <K extends "role" | "greeting" | "name" | "phone" | "email">(k: K) => (v: string) => change((d) => void (d[k] = v));

  function addSection(column: Section["column"], type: SectionType) {
    change((d) => void d.sections.push({ id: crypto.randomUUID(), column, title: "New section", ...templates[type].make() } as Section));
  }

  function column(col: Section["column"]) {
    const list = cv.sections.filter((x) => x.column === col);
    return (
      <>
        {list.map((sec, k) => (
          <SectionView key={sec.id} sec={sec} change={change} first={k === 0} last={k === list.length - 1} />
        ))}
        {editing && (
          <select
            className={`${s.addSection} ${s.ui}`}
            aria-label="Add a section"
            value=""
            onChange={(e) => addSection(col, e.target.value as SectionType)}
          >
            <option value="">+ Add section…</option>
            {Object.entries(templates).map(([type, t]) => (
              <option key={type} value={type}>{t.label}</option>
            ))}
          </select>
        )}
      </>
    );
  }

  return (
    <Editing value={editing}>
      <div className={`${s.desk} ${editing ? s.editing : ""}`}>
        <div className={`${s.toolbar} ${s.ui}`}>
          {editing && (
            <span className={s.status} role="status">
              {!canSave ? "Not saved: run npm run dev" : status === "saving" ? "Saving…" : status === "error" ? "Save failed" : "Saved to cv.json"}
            </span>
          )}
          {editing && (
            <>
              <button type="button" className={s.tool} onClick={undo} disabled={!past.length} title="Undo (⌘Z)">
                <Undo2 size={16} aria-hidden /> Undo
              </button>
              <button type="button" className={s.tool} onClick={redo} disabled={!future.length} title="Redo (⇧⌘Z)">
                <Redo2 size={16} aria-hidden /> Redo
              </button>
            </>
          )}
          <button type="button" className={s.tool} aria-pressed={editing} onClick={() => setEditing(!editing)}>
            {editing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
            {editing ? "Done" : "Edit"}
          </button>
          <button type="button" className={s.tool} onClick={() => window.print()}>
            <Printer size={16} aria-hidden /> Save as PDF
          </button>
        </div>

        <main className={s.page} spellCheck={false}>
          <div className={s.cols}>
            <div className={s.stack}>
              <section>
                <Image className={s.photo} src={cv.photo} alt={cv.name} width={128} height={128} priority />
                <div className={s.role}>
                  <span className={s.dot}>
                    <ChevronRight size={11} strokeWidth={3} color="#fff" aria-hidden />
                  </span>
                  <T className={s.pill} value={cv.role} onChange={set("role")} />
                </div>
                <h1 className={s.hello}>
                  <T value={cv.greeting} onChange={set("greeting")} />
                  <br />
                  <T value={cv.name} onChange={set("name")} />
                </h1>
              </section>
              {column("left")}
            </div>

            <div className={s.stack}>
              <section className={s.contactRow}>
                <div>
                  <h2>Contact</h2>
                  <p className={s.line}>
                    <span className={s.ico}><Phone size={10} strokeWidth={2.5} aria-hidden /></span>
                    <T value={cv.phone} onChange={set("phone")} />
                  </p>
                  <p className={s.line}>
                    <span className={s.ico}><Mail size={10} strokeWidth={2.5} aria-hidden /></span>
                    <T value={cv.email} onChange={set("email")} />
                  </p>
                </div>
                <div>
                  <h2>Mailing Address</h2>
                  {cv.address.map((a, i) => (
                    <T key={i} as="p" className={s.line} value={a} onChange={(v) => change((d) => void (d.address[i] = v))} />
                  ))}
                </div>
              </section>
              {column("right")}
            </div>
          </div>
        </main>
      </div>
    </Editing>
  );
}

function SectionView({ sec, change, first, last }: { sec: Section; change: (fn: (d: Cv) => void) => void; first: boolean; last: boolean }) {
  const editing = use(Editing);
  // Apply a change to this section inside the draft.
  const edit = <S extends Section>(fn: (x: S) => void) => change((d) => fn(d.sections.find((x) => x.id === sec.id) as S));
  const removeItem = (j: number) => edit((x) => void ("items" in x && x.items.splice(j, 1)));

  function move(dir: -1 | 1) {
    change((d) => {
      const i = d.sections.findIndex((x) => x.id === sec.id);
      let j = i + dir;
      while (d.sections[j] && d.sections[j].column !== sec.column) j += dir;
      if (d.sections[j]) [d.sections[i], d.sections[j]] = [d.sections[j], d.sections[i]];
    });
  }

  return (
    <section className={s.section}>
      <div className={s.head}>
        <T as="h2" value={sec.title} onChange={(v) => edit((x) => void (x.title = v))} />
        {editing && (
          <div className={`${s.controls} ${s.ui}`}>
            <Btn label="Move up" onClick={() => move(-1)} disabled={first}><ArrowUp size={13} aria-hidden /></Btn>
            <Btn label="Move down" onClick={() => move(1)} disabled={last}><ArrowDown size={13} aria-hidden /></Btn>
            <Btn label="Move to other column" onClick={() => edit((x) => void (x.column = x.column === "left" ? "right" : "left"))}>
              <ArrowLeftRight size={13} aria-hidden />
            </Btn>
            <Btn label="Delete section" onClick={() => confirm(`Delete “${sec.title}”?`) && change((d) => void d.sections.splice(d.sections.findIndex((x) => x.id === sec.id), 1))}>
              <Trash2 size={13} aria-hidden />
            </Btn>
          </div>
        )}
      </div>

      <Body sec={sec} edit={edit} removeItem={removeItem} />

      {editing && "items" in sec && (
        <Btn label="Add entry" className={s.add} onClick={() => edit((x) => void ("items" in x && (x.items as unknown[]).push(newItem(x.type))))}>
          <Plus size={12} aria-hidden /> Add
        </Btn>
      )}
    </section>
  );
}

type Edit = <S extends Section>(fn: (x: S) => void) => void;

function Body({ sec, edit, removeItem }: { sec: Section; edit: Edit; removeItem: (j: number) => void }) {
  const editing = use(Editing);

  switch (sec.type) {
    case "text": {
      type S = typeof sec;
      return (
        <div className={s.card}>
          <T as="p" multiline className={s.multi} value={sec.text} onChange={(v) => edit<S>((x) => void (x.text = v))} />
        </div>
      );
    }

    case "experience": {
      type S = typeof sec;
      return sec.items.map((it, j) => (
        <div key={j} className={s.card}>
          {editing && <Del onClick={() => removeItem(j)} />}
          <T as="p" className={s.job} value={it.title} onChange={(v) => edit<S>((x) => void (x.items[j].title = v))} />
          <p className={s.as}>
            as <T className={s.accent} value={it.role} onChange={(v) => edit<S>((x) => void (x.items[j].role = v))} />
          </p>
          <T className={s.pill} value={it.period} onChange={(v) => edit<S>((x) => void (x.items[j].period = v))} />
          <ul className={s.bullets}>
            {it.points.map((p, k) => (
              <li key={k}>
                <T value={p} onChange={(v) => edit<S>((x) => void (x.items[j].points[k] = v))} />
                {editing && <Del onClick={() => edit<S>((x) => void x.items[j].points.splice(k, 1))} />}
              </li>
            ))}
          </ul>
          {editing && (
            <Btn label="Add point" className={s.add} onClick={() => edit<S>((x) => void x.items[j].points.push("What you did"))}>
              <Plus size={12} aria-hidden /> Point
            </Btn>
          )}
        </div>
      ));
    }

    case "entries": {
      type S = typeof sec;
      return sec.items.map((it, j) => (
        <div key={j} className={`${s.card} ${s.edu}`}>
          {editing && <Del onClick={() => removeItem(j)} />}
          <div>
            <T as="b" value={it.title} onChange={(v) => edit<S>((x) => void (x.items[j].title = v))} />
            <T value={it.detail} onChange={(v) => edit<S>((x) => void (x.items[j].detail = v))} />
          </div>
          <T className={s.pill} value={it.period} onChange={(v) => edit<S>((x) => void (x.items[j].period = v))} />
        </div>
      ));
    }

    case "awards": {
      type S = typeof sec;
      return (
        <div className={s.card}>
          {sec.items.map((it, j) => (
            <div key={j} className={s.ach}>
              {editing && <Del onClick={() => removeItem(j)} />}
              <T as="b" value={it.title} onChange={(v) => edit<S>((x) => void (x.items[j].title = v))} />
              <T as="small" value={it.date} onChange={(v) => edit<S>((x) => void (x.items[j].date = v))} />
            </div>
          ))}
        </div>
      );
    }

    case "icons": {
      type S = typeof sec;
      const pickIcon = (j: number) => {
        const v = prompt("Icon name from lucide.dev/icons (e.g. music, book-open, plane)", sec.items[j].icon)?.trim();
        if (!v) return;
        if (!iconNames.includes(v as IconName)) return alert(`“${v}” isn’t a Lucide icon name. Browse lucide.dev/icons.`);
        edit<S>((x) => void (x.items[j].icon = v));
      };
      return (
        <div className={`${s.card} ${s.hobbies}`}>
          {sec.items.map((it, j) => (
            <div key={j} className={s.hobby}>
              {editing && <Del onClick={() => removeItem(j)} />}
              {editing ? (
                <button type="button" className={s.circle} title="Change icon" onClick={() => pickIcon(j)}>
                  <DynamicIcon name={it.icon as IconName} size={24} strokeWidth={1.8} aria-hidden />
                </button>
              ) : (
                <span className={s.circle}>
                  <DynamicIcon name={it.icon as IconName} size={24} strokeWidth={1.8} aria-hidden />
                </span>
              )}
              <T value={it.label} onChange={(v) => edit<S>((x) => void (x.items[j].label = v))} />
            </div>
          ))}
        </div>
      );
    }

    case "bullets": {
      type S = typeof sec;
      return (
        <ul className={`${s.card} ${s.skills}`}>
          {sec.items.map((it, j) => (
            <li key={j}>
              <T value={it} onChange={(v) => edit<S>((x) => void (x.items[j] = v))} />
              {editing && <Del onClick={() => removeItem(j)} />}
            </li>
          ))}
        </ul>
      );
    }
  }
}
