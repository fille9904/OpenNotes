import Link from "next/link";
import { getDriveCourse, listCourseNotes } from "@/lib/drive";
import type { CourseFolder, CourseNote } from "@/lib/drive";
import { notFound } from "next/navigation";
import styles from "./course.module.css";

function formatSize(bytes: number | null) { return bytes === null ? "PDF" : `${(bytes / 1_000_000).toFixed(1)} MB`; }

function NoteLink({ courseId, note }: { courseId: string; note: CourseNote }) {
  return <Link className={styles.noteRow} href={`/courses/${courseId}/notes/${note.id}`}><span className={styles.pdfIcon}>PDF</span><span><strong>{note.name.replace(/\.pdf$/i, "")}</strong><small>{formatSize(note.size)}</small></span><b>→</b></Link>;
}

function FolderTree({ courseId, folder, depth = 0 }: { courseId: string; folder: CourseFolder; depth?: number }) {
  const pdfCount = folder.notes.length + folder.folders.reduce((sum, child) => sum + countPdfs(child), 0);
  return (
    <details className={styles.folder} open={depth === 0}>
      <summary><span className={styles.folderIcon}>▸</span><strong>{folder.name}</strong><small>{pdfCount} PDF{pdfCount === 1 ? "" : "s"}</small></summary>
      <div className={styles.folderContents}>
        {folder.folders.map((child) => <FolderTree courseId={courseId} depth={depth + 1} folder={child} key={child.id} />)}
        {folder.notes.map((note) => <NoteLink courseId={courseId} note={note} key={note.id} />)}
        {folder.folders.length === 0 && folder.notes.length === 0 && <p className={styles.emptyFolder}>This folder is empty.</p>}
      </div>
    </details>
  );
}

function countPdfs(folder: CourseFolder): number {
  return folder.notes.length + folder.folders.reduce((sum, child) => sum + countPdfs(child), 0);
}

export const dynamic = "force-dynamic";

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course: folderId } = await params;
  const course = await getDriveCourse(folderId);
  if (!course) notFound();
  let library: Awaited<ReturnType<typeof listCourseNotes>>;
  try { library = await listCourseNotes(course); }
  catch (error) {
    console.error(`Could not load Drive notes for ${course.code}`, error instanceof Error ? error.message : error);
    library = { configured: true, notes: [], folders: [], rootNotes: [] };
  }
  return (
    <main>
      <header className="site-header"><Link className="brand" href="/">Open<span>Notes</span></Link><nav><Link href="/#courses">All courses</Link><Link href="/#assistant">Ask AI</Link></nav></header>
      <section className={styles.hero}><Link className={styles.back} href="/#courses">← All courses</Link><p className="eyebrow">KTH · År {course.year}</p><h1>{course.code}</h1><p>{course.name || "Lecture notes and Goodnotes PDFs synchronized from Google Drive."}</p></section>
      <section className={styles.notes}>
        <div className="section-heading"><div><p className="eyebrow">Course library</p><h2>Notes</h2></div><p>{library.configured ? `${library.notes.length} PDFs found` : "Drive connection required"}</p></div>
        {library.notes.length > 0 ? <div className={styles.libraryTree}>
          {library.folders.map((folder) => <FolderTree courseId={course.driveFolderId} folder={folder} key={folder.id} />)}
          {library.rootNotes.length > 0 && <section className={styles.rootNotes}><h3>Files in {course.name}</h3>{library.rootNotes.map((note) => <NoteLink courseId={course.driveFolderId} note={note} key={note.id} />)}</section>}
        </div> : <div className={styles.empty}><span>PDF</span><h3>{library.configured ? "No lecture notes found yet" : "Drive connection is not configured"}</h3><p>{library.configured ? `Goodnotes has not uploaded any PDFs for ${course.code} yet.` : "Add the Google service-account credential to the deployment to load your private notes."}</p><Link href="/#assistant">Ask the study assistant →</Link></div>}
      </section>
    </main>
  );
}
