import StudyAssistant from "@/components/study-assistant";

const courses = ["SF1546", "DD1310", "SG1133", "SF1626", "SF1624", "SA1007"];

export default function Home() {
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
        <div className="section-heading"><div><p className="eyebrow">Drive library</p><h2>Your courses</h2></div><p>Synced from KTH / År 1</p></div>
        <div className="course-grid">
          {courses.map((course) => <article className="course-card" key={course}><span>Course</span><h3>{course}</h3><p>Goodnotes PDFs and lecture material</p><div>Open course <b>→</b></div></article>)}
        </div>
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
