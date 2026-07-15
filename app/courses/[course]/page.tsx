import Link from "next/link";
import { isCourseCode } from "@/lib/courses";
import { notFound } from "next/navigation";
import styles from "./course.module.css";

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course } = await params;
  if (!isCourseCode(course)) notFound();
  return (
    <main>
      <header className="site-header"><Link className="brand" href="/">Open<span>Notes</span></Link><nav><Link href="/#courses">All courses</Link><Link href="/#assistant">Ask AI</Link></nav></header>
      <section className={styles.hero}><Link className={styles.back} href="/#courses">← All courses</Link><p className="eyebrow">KTH course</p><h1>{course}</h1><p>Lecture notes and Goodnotes PDFs synchronized from Google Drive.</p></section>
      <section className={styles.notes}>
        <div className="section-heading"><div><p className="eyebrow">Course library</p><h2>Notes</h2></div><p>Drive synchronization pending</p></div>
        <div className={styles.empty}><span>PDF</span><h3>Your synchronized notes will appear here</h3><p>Once the Google Drive credentials and first synchronization are complete, PDFs assigned to {course} will be listed on this page.</p><Link href="/#assistant">Ask the study assistant →</Link></div>
      </section>
    </main>
  );
}
