import { useCallback, useEffect, useState } from "react";
import { SEO } from "../../src/components/SEO";
import { careerBenefits, careerDepartments } from "../../src/data/careers";

const fields = [
  ["title", "Job title"], ["slug", "URL slug"], ["department", "Department"], ["location", "Location"],
  ["employmentType", "Employment type"], ["workArrangement", "Work arrangement"],
];
const paragraphs = [["summary", "Short role description"], ["aboutRole", "About the role"]];
const lists = [["responsibilities", "What you'll do"], ["requirements", "What we're looking for"], ["preferred", "Nice to have"], ["technologyStack", "Technology stack"], ["successOutcomes", "What success looks like"]];
const statuses = ["new", "under_review", "interview", "offer", "hired", "rejected", "withdrawn"];
const lines = (value) => String(value || "").split("\n").map((line) => line.trim()).filter(Boolean);
const asLines = (value) => Array.isArray(value) ? value.join("\n") : "";

function AdminField({ name, label, value = "", required = false }) {
  return <label>{label}{name === "department"
    ? <select name={name} defaultValue={value} required={required}><option value="" disabled>Select department</option>{careerDepartments.map((department) => <option key={department.name} value={department.name}>{department.name}</option>)}</select>
    : <input name={name} defaultValue={value} required={required}/>}</label>;
}

export default function CareersAdmin() {
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [staff, setStaff] = useState([]);
  const [role, setRole] = useState("");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const load = useCallback(async (resource, query = "") => {
    const response = await fetch(`/api/careers/admin?resource=${resource}${query}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Could not load recruiting data");
    setRole(data.role);
    if (data.role !== "admin") setTab("applications");
    if (resource === "jobs") setJobs(data.jobs);
    if (resource === "applications") setApplications(data.applications);
    if (resource === "staff") setStaff(data.staff);
  }, []);
  useEffect(() => { load("jobs").catch((error) => setMessage(error.message)); }, [load]);
  useEffect(() => { if (tab === "applications") load("applications", `&status=${encodeURIComponent(filterStatus)}&search=${encodeURIComponent(search)}`).catch((error) => setMessage(error.message)); }, [tab, filterStatus, search, load]);
  useEffect(() => { if (tab === "staff" && role === "admin") load("staff").catch((error) => setMessage(error.message)); }, [tab, role, load]);
  async function action(body, after) {
    setPending(true); setMessage("");
    try {
      const response = await fetch("/api/careers/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save");
      setMessage("Saved.");
      await after?.();
    } catch (error) { setMessage(error.message); }
    finally { setPending(false); }
  }
  function saveJob(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const job = Object.fromEntries([...fields, ...paragraphs].map(([key]) => [key, String(form.get(key) || "")]));
    for (const [key] of lists) job[key] = lines(form.get(key));
    job.screeningQuestions = (() => { try { return JSON.parse(String(form.get("screeningQuestions") || "[]")); } catch { return null; } })();
    if (!Array.isArray(job.screeningQuestions)) { setMessage("Screening questions must be a JSON array."); return; }
    job.benefitCodes = careerBenefits.filter(([code]) => form.get(`benefit_${code}`) === "on").map(([code]) => code);
    job.relocationEligible = form.get("relocationEligible") === "on";
    job.contentApproved = form.get("contentApproved") === "on";
    job.contentSourceComplete = form.get("contentSourceComplete") === "on";
    job.contentSource = String(form.get("contentSource") || "");
    job.status = String(form.get("status") || "draft");
    action({ action: "saveJob", id: selected.id, job }, async () => { await load("jobs"); setSelected(null); });
  }
  function createJob(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const target = event.currentTarget;
    action({ action: "createJob", job: { title: form.get("title"), slug: form.get("slug"), department: form.get("department"), location: form.get("location") } }, async () => { await load("jobs"); target.reset(); });
  }
  return <div className="career-admin"><SEO title="Careers administration | ClothME" path="/admin/careers" robots="noindex,nofollow"/><header><a href="/admin/cms">← CMS</a><h1>Careers administration</h1><span>{role || "Checking access…"}</span></header><nav aria-label="Recruiting administration">{role === "admin" ? <button onClick={() => setTab("jobs")}>Jobs</button> : null}<button onClick={() => setTab("applications")}>Applications</button>{role === "admin" ? <button onClick={() => setTab("staff")}>Staff access</button> : null}</nav>{message ? <p role="status" className="career-admin-message">{message}</p> : null}
    {tab === "jobs" && role === "admin" ? <main><h2>Job openings</h2><p>All founding roles begin as drafts. A role can open only after its full description is approved and its required details are complete.</p><div className="career-admin-grid"><div><ul>{jobs.map((job) => <li key={job.id}><button onClick={() => setSelected(job)}><strong>{job.title}</strong><small>{job.status} · {job.department}</small></button></li>)}</ul><form onSubmit={createJob}><h3>Create draft role</h3>{fields.slice(0, 4).map(([key, label]) => <AdminField key={key} name={key} label={label} required/>)}<button disabled={pending}>Create draft</button></form></div>{selected ? <form key={selected.id} onSubmit={saveJob} className="career-admin-editor"><h3>{selected.title}</h3>{fields.map(([key, label]) => <AdminField key={key} name={key} label={label} value={selected[key] || ""} required={!["employmentType", "workArrangement"].includes(key)}/>)}{paragraphs.map(([key, label]) => <label key={key}>{label}<textarea name={key} defaultValue={selected[key] || ""}/></label>)}{lists.map(([key, label]) => <label key={key}>{label} — one item per line<textarea name={key} defaultValue={asLines(selected[key])}/></label>)}<label>Full approved job description (Markdown)<textarea name="contentSource" defaultValue={selected.contentSource || ""} rows={24}/></label><label><input type="checkbox" name="contentSourceComplete" defaultChecked={selected.contentSourceComplete}/> Source description is complete</label><label>Screening questions JSON<textarea name="screeningQuestions" defaultValue={JSON.stringify(selected.screeningQuestions || [], null, 2)}/><small>Example: <code>{'[{"id":"systems","label":"Describe a system you built","required":true} ]'}</code></small></label><fieldset><legend>Applicable potential benefits</legend>{careerBenefits.map(([code, title]) => <label key={code}><input type="checkbox" name={`benefit_${code}`} defaultChecked={selected.benefitCodes?.includes(code)}/>{title}</label>)}</fieldset><label><input type="checkbox" name="relocationEligible" defaultChecked={selected.relocationEligible}/> Relocation may be available</label><label><input type="checkbox" name="contentApproved" defaultChecked={selected.contentApproved}/> Complete description approved for publication</label><label>Status<select name="status" defaultValue={selected.status}><option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option></select></label><button disabled={pending}>Save role</button></form> : <div className="career-admin-placeholder">Select a role to edit its description and status.</div>}</div></main> : null}
    {tab === "applications" ? <main><h2>Applications</h2><div className="career-admin-search"><input aria-label="Search candidates" placeholder="Search name, email, or reference" value={search} onChange={(event) => setSearch(event.target.value)}/><select aria-label="Filter status" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}><option value="">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></div><div className="career-admin-applications">{applications.map((app) => <article key={app.id}><h3>{app.firstName} {app.lastName}</h3><p><strong>{app.jobTitle}</strong> · {app.reference} · {new Date(app.submittedAt).toLocaleDateString()}</p><p>{app.email} · {app.phone} · {app.location}</p><p>{app.motivation}</p>{app.coverLetter ? <details><summary>Cover letter</summary><p>{app.coverLetter}</p></details> : null}{app.additionalInfo ? <details><summary>Additional information</summary><p>{app.additionalInfo}</p></details> : null}{Object.entries(app.screeningAnswers || {}).map(([key, value]) => <p key={key}><strong>{key}:</strong> {value}</p>)}<p>{[app.linkedIn, app.portfolio, app.github].filter(Boolean).map((href) => <a key={href} href={href} target="_blank" rel="noreferrer">{href} ↗ </a>)}</p><a href={`/api/careers/admin/applications/${app.id}/resume`}>Download private résumé: {app.resumeFilename}</a><label>Status<select value={app.status} onChange={(event) => action({ action: "applicationStatus", id: app.id, status: event.target.value }, () => load("applications", `&status=${encodeURIComponent(filterStatus)}&search=${encodeURIComponent(search)}`))}>{statuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label></article>)}</div>{!applications.length ? <p>No applications match.</p> : null}</main> : null}
    {tab === "staff" && role === "admin" ? <main><h2>Recruiting access</h2><ul>{staff.map((item) => <li key={item.email}>{item.email} — {item.role}</li>)}</ul><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); action({ action: "staffRole", email: form.get("email"), role: form.get("role") }, () => load("staff")); }}><label>CMS user email<input name="email" type="email" required/></label><label>Role<select name="role"><option value="recruiter">Recruiter</option><option value="admin">Admin</option><option value="remove">Remove access</option></select></label><button disabled={pending}>Update access</button></form></main> : null}
  </div>;
}
