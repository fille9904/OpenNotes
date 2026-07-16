import Link from "next/link";
import { getCourse } from "@/lib/courses";
import { listCourseNotes } from "@/lib/drive";
import { notFound } from "next/navigation";
import styles from "./viewer.module.css";

export default async function NoteViewerPage({ params, searchParams }: {
  params: Promise<{ course: string; fileId: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const [{ course: code, fileId }, { year }] = await Promise.all([params, searchParams]);
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(fileId)) notFound();
  const course = getCourse(code, year ? Number(year) : undefined);
  if (!course) notFound();

  const library = await listCourseNotes(course).catch(() => null);
  const note = library?.notes.find((item) => item.id === fileId);
  if (!note) notFound();

  const previewUrl = `https://drive.google.com/file/d/${note.id}/preview`;
  return (
    <main className={styles.page}>
      <header className="site-header">
        <Link className="brand" href="/">Open<span>Notes</span></Link>
        <nav><Link href={`/courses/${course.code}?year=${course.year}`}>Course</Link><Link href="/#assistant">Ask AI</Link></nav>
      </header>
      <section className={styles.toolbar}>
        <div>
          <Link href={`/courses/${course.code}?year=${course.year}`}>← {course.code}</Link>
          <h1>{note.name.replace(/\.pdf$/i, "")}</h1>
          <p>{note.path}</p>
        </div>
        <a href={note.url} target="_blank" rel="noreferrer">Open in Google Drive ↗</a>
      </section>
      <section className={styles.viewer}>
        <iframe src={previewUrl} title={`${note.name} PDF viewer`} allow="autoplay" />
      </section>
    </main>
  );
}
