import Link from "next/link";
import { getDriveCourse, listCourseNotes } from "@/lib/drive";
import { notFound } from "next/navigation";
import styles from "./course.module.css";

function formatSize(bytes: number | null) { return bytes === null ? "PDF" : `${(bytes / 1_000_000).toFixed(1)} MB`; }

export const dynamic = "force-dynamic";

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course: folderId } = await params;
  const course = await getDriveCourse(folderId);
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
        {library.notes.length > 0 ? <div className={styles.noteGrid}>{library.notes.map((note) => <Link className={styles.noteCard} href={`/courses/${course.driveFolderId}/notes/${note.id}`} key={note.id}><span>PDF · {formatSize(note.size)}</span><h3>{note.name.replace(/\.pdf$/i, "")}</h3><p>{note.path}</p><div>Read note <b>→</b></div></Link>)}</div> : <div className={styles.empty}><span>PDF</span><h3>{library.configured ? "No lecture notes found yet" : "Drive connection is not configured"}</h3><p>{library.configured ? `Goodnotes has not uploaded any PDFs for ${course.code} yet.` : "Add the Google service-account credential to the deployment to load your private notes."}</p><Link href="/#assistant">Ask the study assistant →</Link></div>}
      </section>
    </main>
  );
}
