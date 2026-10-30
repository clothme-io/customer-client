import { useMemo, useState } from "react";
import Link from "next/link";
import { careerDepartments } from "../../data/careers";
import styles from "../../../pages/careers/careers.module.css";

function JobCard({ job }) {
  return <Link href={`/careers/${job.slug}`} className={styles.jobCard}>
    <div className={styles.jobCardTop}><span>{job.department}</span><span aria-hidden="true">↗</span></div>
    <h4>{job.title}</h4><p>{job.summary}</p>
    <div className={styles.jobMeta}><span>{job.location}</span><span>{job.employmentType}</span><span>{job.workArrangement}</span></div>
    <strong>View role <span aria-hidden="true">→</span></strong>
  </Link>;
}

export function JobList({ jobs, unavailable = false }) {
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [employment, setEmployment] = useState("");
  const openJobs = useMemo(() => jobs.filter((job) => job.status === "open"), [jobs]);
  const departments = useMemo(() => careerDepartments.filter((item) => openJobs.some((job) => job.department === item.name)), [openJobs]);
  const locations = useMemo(() => [...new Set(openJobs.map((job) => job.location))].sort(), [openJobs]);
  const employmentTypes = useMemo(() => [...new Set(openJobs.map((job) => job.employmentType))].filter(Boolean).sort(), [openJobs]);
  const visible = openJobs.filter((job) =>
    (!department || job.department === department) &&
    (!location || job.location === location) &&
    (!employment || job.employmentType === employment)
  );
  const groups = careerDepartments.map((item, index) => ({
    ...item,
    index,
    jobs: visible.filter((job) => job.department === item.name),
  })).filter((item) => item.jobs.length);
  const reset = () => { setDepartment(""); setLocation(""); setEmployment(""); };

  return <>
    {unavailable && openJobs.length ? <p className={styles.previewNotice} role="status">Local preview: role descriptions are available, but applications are paused until the database connects.</p> : null}
    {openJobs.length ? <div className={styles.filters} aria-label="Filter open roles">
      <button className={!department && !location && !employment ? styles.activeFilter : ""} type="button" onClick={reset}>All Positions</button>
      <label>Department<select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">All departments</option>{departments.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
      <label>Location<select value={location} onChange={(event) => setLocation(event.target.value)}><option value="">All locations</option>{locations.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Employment<select value={employment} onChange={(event) => setEmployment(event.target.value)}><option value="">All types</option>{employmentTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
    </div> : null}
    {groups.length ? <div className={styles.departmentGroups}>{groups.map((group) =>
      <section className={styles.departmentGroup} aria-labelledby={`department-${group.index}`} key={group.name}>
        <div className={styles.departmentHeading}>
          <span className={styles.departmentNumber}>{String(group.index + 1).padStart(2, "0")}</span>
          <div><div className={styles.departmentTitleRow}><h3 id={`department-${group.index}`}>{group.name}</h3><span className={styles.departmentCount}>{group.jobs.length} {group.jobs.length === 1 ? "role" : "roles"}</span></div><p>{group.description}</p></div>
        </div>
        <div className={styles.jobGrid}>{group.jobs.map((job) => <JobCard key={job.id} job={job}/>)}</div>
      </section>
    )}</div> : <div className={styles.empty} role="status"><h3>{openJobs.length ? "No roles match those filters." : unavailable ? "Open roles are temporarily unavailable." : "No open roles are listed right now."}</h3><p>{openJobs.length ? "Try another department, location, or employment type." : unavailable ? "Please check back shortly." : "We're growing thoughtfully. Check back for new opportunities."}</p>{openJobs.length ? <button type="button" onClick={reset}>Reset filters</button> : null}</div>}
  </>;
}
