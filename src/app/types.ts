// Shape of cv.json. Each section type has its own look (see editor.tsx).
type Base = { id: string; column: "left" | "right"; title: string };

export type Section = Base &
  (
    | { type: "text"; text: string }
    | { type: "experience"; items: { title: string; role: string; period: string; points: string[] }[] }
    | { type: "entries"; items: { title: string; detail: string; period: string }[] }
    | { type: "awards"; items: { title: string; date: string }[] }
    | { type: "icons"; items: { label: string; icon: string }[] }
    | { type: "bullets"; items: string[] }
  );

export type Cv = {
  photo: string;
  role: string;
  greeting: string;
  name: string;
  phone: string;
  email: string;
  address: string[];
  sections: Section[];
};

// Earlier and undone versions of the CV, saved to cv.history.json.
export type History = { past: Cv[]; future: Cv[] };

export type SectionType = Section["type"];

// What "Add section" offers, with the starter content each one gets.
export const templates: Record<SectionType, { label: string; make: () => Omit<Section, keyof Base> }> = {
  text: { label: "Paragraph", make: () => ({ type: "text", text: "Write something here." }) },
  experience: {
    label: "Experience (role + bullets)",
    make: () => ({ type: "experience", items: [{ title: "Organisation", role: "Role", period: "2025", points: ["What you did"] }] }),
  },
  entries: { label: "Timeline (title + date pill)", make: () => ({ type: "entries", items: [{ title: "Title", detail: "Detail", period: "2025" }] }) },
  awards: { label: "Awards (title + date)", make: () => ({ type: "awards", items: [{ title: "Award", date: "Month/2025" }] }) },
  icons: { label: "Icons (hobbies)", make: () => ({ type: "icons", items: [{ label: "Label", icon: "star" }] }) },
  bullets: { label: "Bullet list", make: () => ({ type: "bullets", items: ["Item"] }) },
};

export function newItem(type: SectionType) {
  const made = templates[type].make() as { items?: unknown[] };
  return made.items?.[0];
}
