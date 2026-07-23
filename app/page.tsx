import StudyAssistant from "@/components/study-assistant";
import Link from "next/link";
import { listDriveCourses } from "@/lib/drive";

export const dynamic = "force-dynamic";

export default async function Home() {
  const library = await listDriveCourses().catch(() => ({ configured: true as const, courses: [] }));
  const years = [...new Set(library.courses.map((course) => course.year))];
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top">Open<span>Notes</span></a>
        <nav><a href="#courses">Courses</a><a href="#assistant">Ask AI</a></nav>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">Your KTH study library</p>
        <h1>Lecture notes,<br /><em>ready to explore.</em></h1>
        <p className="intro">Goodnotes backups organized by course, with an assistant that searches your material before looking beyond it.</p>
        <a className="primary-button" href="#assistant">Ask your notes <span>↓</span></a>
      </section>

      <section className="courses" id="courses">
        <div className="section-heading"><div><p className="eyebrow">Drive library</p><h2>Your courses</h2></div><p>Live from GoodNotes / KTH</p></div>
        {years.map((year) => <div className="course-year" key={year}>
          <h3>År {year}</h3>
          <div className="course-grid">
            {library.courses.filter((course) => course.year === year).map((course) => <Link className="course-card" href={`/courses/${course.driveFolderId}`} key={course.driveFolderId}><span>År {course.year} · Drive folder</span><h3>{course.code}</h3><p>{course.name}</p><div>Open course <b>→</b></div></Link>)}
          </div>
        </div>)}
        {library.courses.length === 0 && <div className="drive-empty"><h3>{library.configured ? "No course folders found" : "Drive connection is not configured"}</h3><p>{library.configured ? "Add course folders inside GoodNotes / KTH / År 1, År 2, and so on." : "The Google service-account credential is missing."}</p></div>}
      </section>

      <section className="assistant-section" id="assistant">
        <div className="assistant-copy">
          <p className="eyebrow">Study assistant</p>
          <h2>Ask your notes.<br /><em>Explore beyond them.</em></h2>
          <p>Answers begin with your uploaded course material. Enable online sources when you want current or complementary information.</p>
          <div className="source-key"><span><i className="note-dot" />Your notes</span><span><i className="web-dot" />Online sources</span></div>
        </div>
        <StudyAssistant />
      </section>

      <footer><a className="brand" href="#top">Open<span>Notes</span></a><p>Check important AI answers against your course material.</p></footer>
    </main>
  );
}
