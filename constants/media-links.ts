export const MAIL_TO_URL = "mailto:hi@maenababneh.dev";
export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@thecompasstech";
export const WEBSITE_URL = "https://maenababneh.dev";
export const RESUME_URL = "/resume.pdf";

export const LINKEDIN_URL = "https://www.linkedin.com/in/maenababneh/";
export const GITHUB_URL = "https://github.com/maenababneh";

export interface WebsiteLink {
  title: string;
  demoUrl: string;
  githubUrl: string;
  description: string;
  image: string;
}

export const PERSONAL_WEBSITES: WebsiteLink[] = [
  {
    title: "CreativeFlow",
    demoUrl: "https://creative-overflow.maenababneh.dev/",
    githubUrl: "https://github.com/MaenAbabneh/creativeflow",
    description:
      "Basically Stack Overflow, but with AI answers and way less passive-aggressive devs closing your questions as 'duplicate'. Built with Next.js Server Actions for that sweet performance.",
    image:
      "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop",
  },
  {
    title: "GTA VI Landing Page",
    demoUrl: "https://gta.maenababneh.dev/",
    githubUrl: "https://github.com/MaenAbabneh/gta-landingPage",
    description:
      "Rockstar was taking too long, so I animated my own. Pushed GSAP to its absolute limits for buttery-smooth scrolling experiences, all while praying Take-Two doesn't sue me.",
    image:
      "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop",
  },
  {
    title: "3D Interactive Portfolio",
    demoUrl: "https://maenababneh.dev/",
    githubUrl: "https://github.com/MaenAbabneh/3d-portfolio",
    description:
      "Because flat websites are so 2010. I built a fully interactive 3D universe using Next.js and Three.js just to flex my graphics programming skills—and to mildly stress-test your browser's GPU. Don't worry, it's optimized.",
    image:
      "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop",
  },
];

export interface SafariQuickLink {
  title: string;
  url: string;
  icon: string;
}

export const SAFARI_SOCIAL_LINKS: SafariQuickLink[] = [
  {
    title: "LinkedIn",
    url: LINKEDIN_URL,
    icon: "/linkedin.png",
  },
  {
    title: "GitHub",
    url: GITHUB_URL,
    icon: "/github.png",
  },
  {
    title: "YouTube",
    url: YOUTUBE_CHANNEL_URL,
    icon: "/youtube.png",
  },
  {
    title: "Email",
    url: MAIL_TO_URL,
    icon: "/mail.png",
  },
];

export const SAFARI_FREQUENTLY_VISITED: SafariQuickLink[] = [
  {
    title: "GitHub",
    url: "https://github.com",
    icon: "/github.png",
  },
  {
    title: "LinkedIn",
    url: "https://linkedin.com",
    icon: "/linkedin.png",
  },
  {
    title: "YouTube",
    url: "https://youtube.com",
    icon: "/youtube.png",
  },
  {
    title: "Reddit",
    url: "https://reddit.com",
    icon: "/reddit.png",
  },
  {
    title: "ChatGPT",
    url: "https://chatgpt.com",
    icon: "/chatgpt.png",
  },
  {
    title: "Stack Overflow",
    url: "https://stackoverflow.com",
    icon: "/stackoverflow.png",
  },
];
