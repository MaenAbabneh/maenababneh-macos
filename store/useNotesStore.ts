import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { noopStorage } from "@/store/noop-storage";
import { STORAGE_KEYS } from "@/constants/storage-keys";

export type Note = {
  id: number;
  title: string;
  content: string;
  date: string;
};

type NotesState = {
  notes: Note[];
  selectedNoteId: number;
};

type NotesActions = {
  selectNote: (id: number) => void;
  updateSelectedNoteContent: (content: string) => void;
};

export type NotesStore = NotesState & NotesActions;

const NOTES_PERSIST_VERSION = 3;

const initialNotes: Note[] = [
  {
    id: 1,
    title: "About Me",
    content: `# Maen Ababneh\nComputer Science Student & Software Engineer\n\n## Bio\nWelcome to my digital workspace! I am a software engineer and CS student at Al-Balqa Applied University in Jordan. I specialize in crafting high-performance, immersive web experiences that bridge the gap between complex logic and exceptional UI design.\n\n## Technical Arsenal\n### Frontend & Architecture\n- React.js / Next.js (App Router)\n- TypeScript / JavaScript\n- Tailwind CSS\n- State Management (Zustand, Redux)\n- Clean Architecture & Performance Optimization\n\n### Animation & 3D Web\n- GSAP (Timeline, ScrollTrigger, FLIP)\n- Framer Motion\n- Three.js / React Three Fiber\n- WebGL\n\n### Backend & Tools\n- Node.js / Express\n- Git / GitHub\n- Vercel / Deployment pipelines\n\n## Contact & Links\n- **Email:** [hi@maenababneh.dev](mailto:hi@maenababneh.dev)\n- **LinkedIn:** [linkedin.com/in/maenababneh](https://www.linkedin.com/in/maenababneh)\n- **GitHub:** [github.com/maenababneh](https://github.com/maenababneh)\n- **Website:** [maenababneh.dev](https://maenababneh.dev)\n- **YouTube:** [The Compass Tech](https://www.youtube.com/@thecompasstech)`,
    date: "Today, 09:00 AM",
  },
  {
    id: 2,
    title: "Goals & Vision",
    content: `# My Learning Goals & Vision\n\n## Technical Mastery\n- **WebGPU & Advanced 3D:** Push the boundaries of 3D graphics on the web by mastering WebGPU and advanced GLSL shaders.\n- **Micro-animations:** Perfect the art of micro-interactions that make UI feel alive without compromising performance.\n- **Full-Stack Scaling:** Deepen knowledge in backend architecture to support massive scale applications.\n\n## Career Aspirations\n- **Freelance Growth:** Build a sustainable and premium freelance business, delivering top-tier web solutions to global clients.\n- **Education:** Successfully fund and complete my Computer Science degree at Al-Balqa Applied University.\n- **Community:** Share my knowledge in UI engineering and Next.js through "The Compass Tech" YouTube channel and open-source contributions.`,
    date: "Yesterday, 11:30 AM",
  },
  {
    id: 3,
    title: "Featured Projects",
    content: `# Featured Projects\n\nHere are some of the projects I am most proud of. You can view the live demos in the **Safari** app!\n\n## 🏎️ GTA VI Website Clone\nA highly optimized, unofficial clone of the GTA VI website.\n- **Focus:** Pixel-perfect UI, extremely complex animations, and 60fps performance.\n- **Tech:** Next.js, GSAP, Tailwind CSS.\n\n## 🍔 3D Interactive Restaurant Menu\nAn immersive web experience that replaces traditional menus with interactive 3D food models.\n- **Focus:** 3D rendering in the browser, user interaction, spatial UI.\n- **Tech:** React Three Fiber, Three.js, WebGL.\n\n## 💡 Creative Overflow\nAn AI-powered Q&A platform tailored for creative problem-solving.\n- **Focus:** Complex state management, AI integration, responsive design.\n- **Tech:** Next.js, Zustand, API integrations.`,
    date: "March 15, 02:20 PM",
  },
  {
    id: 4,
    title: "Freelance Services",
    content: `# Let's Work Together 🤝\n\nI am currently available for freelance opportunities. If you are looking to build a premium web product, I can help you with:\n\n## 1. High-Performance Web Apps\nBuilding fast, SEO-friendly, and highly scalable applications using Next.js and React.\n\n## 2. Immersive UI & 3D Experiences\nTransforming boring websites into interactive experiences using GSAP animations and Three.js 3D elements that captivate your users.\n\n## 3. UI/UX Implementation\nTurning your Figma designs into pixel-perfect, responsive code with a strong focus on accessibility and modern web standards.\n\n**Interested?** Send me an email at [hi@maenababneh.dev](mailto:hi@maenababneh.dev) or open the **Mail** app!`,
    date: "March 10, 10:00 AM",
  },
];

export const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      notes: initialNotes,
      selectedNoteId: 1,

      selectNote: (id) => set({ selectedNoteId: id }),

      updateSelectedNoteContent: (content) => {
        const { notes, selectedNoteId } = get();
        set({
          notes: notes.map((note) =>
            note.id === selectedNoteId ? { ...note, content } : note,
          ),
        });
      },
    }),
    {
      name: STORAGE_KEYS.notesState,
      version: NOTES_PERSIST_VERSION,
      migrate: () => ({
        notes: initialNotes,
        selectedNoteId: 1,
      }),
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.localStorage,
      ),
      partialize: (state) => ({
        notes: state.notes,
        selectedNoteId: state.selectedNoteId,
      }),
    },
  ),
);
