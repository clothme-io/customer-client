import { useRef, useState } from "react";
import { useRouter } from "next/router";
import styles from "../../../pages/careers/careers.module.css";

export function ApplicationForm({ job }) {
  const router = useRouter();
  const requestId = useRef(null);
  const [resumeName, setResumeName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const resume = form.get("resume");
    if (!(resume instanceof File) || !resume.size || resume.size > 10 * 1024 * 1024) {
      setError("Choose a PDF, DOC, or DOCX resume up to 10 MB."); return;
    }
    requestId.current ||= crypto.randomUUID();
    form.set("requestId", requestId.current);
    setPending(true);
    try {
      const response = await fetch(`/api/careers/${encodeURIComponent(job.slug)}/apply`, { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "We couldn't submit your application. Please try again.");
      await router.push(`/careers/${job.slug}/success?ref=${encodeURIComponent(data.reference)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't submit your application.");
      setPending(false);
    }
  }
  return <section id="apply" className={styles.formSection} aria-labelledby="apply-title"><div className={styles.formWrap}>
    <p className={styles.eyebrow}>Join the team</p><h2 id="apply-title">Apply for This Role</h2><p>Tell us a little about yourself and why you'd like to join ClothME.</p>
    <form onSubmit={submit} encType="multipart/form-data">
      <div className={styles.formGrid}>
        <label>First name<input name="firstName" autoComplete="given-name" required maxLength={100}/></label>
        <label>Last name<input name="lastName" autoComplete="family-name" required maxLength={100}/></label>
        <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
        <label>Phone number<input name="phone" type="tel" autoComplete="tel" required maxLength={60}/></label>
        <label>Current city and country<input name="location" autoComplete="address-level2" required maxLength={160}/></label>
        <label>Resume / CV<input name="resume" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required onChange={(event) => setResumeName(event.target.files?.[0]?.name || "")}/><small>{resumeName || "PDF, DOC, or DOCX · 10 MB maximum"}</small></label>
        <label>LinkedIn profile (optional)<input name="linkedIn" type="url" placeholder="https://" maxLength={500}/></label>
        <label>Portfolio or personal website (optional)<input name="portfolio" type="url" placeholder="https://" maxLength={500}/></label>
        {job.technologyStack?.length ? <label>GitHub (optional)<input name="github" type="url" placeholder="https://github.com/" maxLength={500}/></label> : null}
      </div>
      <div className={styles.formFull}>
        <label>Why are you interested in joining ClothME?<textarea name="motivation" required minLength={20} maxLength={4000}/></label>
        <label>Cover letter (optional)<textarea name="coverLetter" maxLength={8000}/></label>
        <label>Additional information (optional)<textarea name="additionalInfo" maxLength={4000}/></label>
        {(job.screeningQuestions || []).map((question, index) => <label key={question.id || index}>{question.label}{question.required ? " *" : " (optional)"}<textarea name={`question_${question.id}`} required={question.required} maxLength={3000}/></label>)}
        <label className={styles.consent}><input type="checkbox" name="consent" value="yes" required/><span>I have read the <a href="/careers/privacy" target="_blank" rel="noopener noreferrer">Recruitment Privacy Notice</a> and understand that ClothME will process my application information for recruitment purposes.</span></label>
        <div hidden aria-hidden="true"><label>Company<input name="company" tabIndex={-1} autoComplete="off"/></label></div>
      </div>
      {error ? <p role="alert" className={styles.formError}>{error}</p> : null}
      <button type="submit" className={styles.submitButton} disabled={pending}>{pending ? "Submitting application…" : "Submit application →"}</button>
    </form>
  </div></section>;
}
