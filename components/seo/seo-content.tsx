import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { initialNotes } from "@/constants/initial-notes";
import { PERSONAL_WEBSITES } from "@/constants/media-links";

export default function SeoContent() {
  return (
    <>
      <main className="sr-only" aria-label="SEO content">
        <h1>Maen Ababneh — Full Stack Web Developer</h1>
        <p>
          Interactive macOS-themed portfolio showcasing projects, skills, and
          contact information.
        </p>

        <section aria-label="About and notes">
          {initialNotes.map((note) => (
            <article key={note.id}>
              <h2>{note.title}</h2>
              <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
                {note.content}
              </ReactMarkdown>
            </article>
          ))}
        </section>

        <section aria-label="Projects">
          <h2>Projects</h2>
          <ul>
            {PERSONAL_WEBSITES.map((site) => (
              <li key={site.githubUrl}>
                <h3>{site.title}</h3>
                <p>{site.description}</p>
                <p>
                  <a href={site.demoUrl}>Live demo</a>
                  {" — "}
                  <a href={site.githubUrl}>Source code</a>
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <noscript>
        <main aria-label="Portfolio content">
          <h1>Maen Ababneh — Full Stack Web Developer</h1>
          <p>
            JavaScript is required for the full macOS experience. Here is a
            text-based version of the portfolio.
          </p>

          {initialNotes.map((note) => (
            <section key={note.id}>
              <h2>{note.title}</h2>
              <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
                {note.content}
              </ReactMarkdown>
            </section>
          ))}

          <section>
            <h2>Projects</h2>
            <ul>
              {PERSONAL_WEBSITES.map((site) => (
                <li key={site.githubUrl}>
                  <strong>{site.title}</strong>: {site.description} ({" "}
                  <a href={site.demoUrl}>Demo</a>,{" "}
                  <a href={site.githubUrl}>GitHub</a>)
                </li>
              ))}
            </ul>
          </section>
        </main>
      </noscript>
    </>
  );
}
