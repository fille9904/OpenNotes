import Link from "next/link";
import { getCourse } from "@/lib/courses";
import { listCourseNotes } from "@/lib/drive";
import { notFound } from "next/navigation";
import styles from "./course.module.css";

function formatSize(bytes: number | null) { return bytes === null ? "PDF" : `${(bytes / 1_000_000).toFixed(1)} MB`; }

export default async function CoursePage({ params, searchParams }: { params: Promise<{ course: string }>; searchParams: Promise<{ year?: string }> }) {
  const [{ course: code }, { year }] = await Promise.all([params, searchParams]);
  const course = getCourse(code, year ? Number(year) : undefined);
  if (!course) notFound();
  let library: Awaited<ReturnType<typeof listCourseNotes>>;
  try { library = await listCourseNotes(course); }
  catch (error) {
    console.error(`Could not load Drive notes for ${course.code}`, error instanceof Error ? error.message : error);
    library = { configured: true, notes: [] };
  }
  return (
    <main>
      <header className="site-header"><Link className="brand" href="/">Open<span>Notes</span></Link><nav><Link href="/#courses">All courses</Link><Link href="/#assistant">Ask AI</Link></nav></header>
      <section className={styles.hero}><Link className={styles.back} href="/#courses">← All courses</Link><p className="eyebrow">KTH · År {course.year}</p><h1>{course.code}</h1><p>{course.name || "Lecture notes and Goodnotes PDFs synchronized from Google Drive."}</p></section>
      <section className={styles.notes}>
        <div className="section-heading"><div><p className="eyebrow">Course library</p><h2>Notes</h2></div><p>{library.configured ? `${library.notes.length} PDFs found` : "Drive connection required"}</p></div>
        {library.notes.length > 0 ? <div className={styles.noteGrid}>{library.notes.map((note) => <a className={styles.noteCard} href={note.url} target="_blank" rel="noreferrer" key={note.id}><span>PDF · {formatSize(note.size)}</span><h3>{note.name.replace(/\.pdf$/i, "")}</h3><p>{note.path}</p><div>Open in Google Drive <b>↗</b></div></a>)}</div> : <div className={styles.empty}><span>PDF</span><h3>{library.configured ? "No lecture notes found yet" : "Drive connection is not configured"}</h3><p>{library.configured ? `Goodnotes has not uploaded any PDFs for ${course.code} yet.` : "Add the Google service-account credential to the deployment to load your private notes."}</p><Link href="/#assistant">Ask the study assistant →</Link></div>}
      </section>
    </main>
  );
}
