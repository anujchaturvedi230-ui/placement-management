import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:5000";

/* =========================================================
   HELPERS
========================================================= */

function getArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getJobBatches(job) {
  const values = getArray(job?.batches);
  return values.length ? values : getArray(job?.batch);
}

function getJobLocations(job) {
  const values = getArray(job?.locations);
  return values.length ? values : getArray(job?.location);
}

function getJobSkills(job) {
  return getArray(job?.skills);
}

function getToken(role) {
  return localStorage.getItem(`${role}Token`);
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [page, setPage] = useState("home");

  const [student, setStudent] = useState(null);
  const [recruiter, setRecruiter] = useState(null);
  const [admin, setAdmin] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [applicants, setApplicants] = useState([]);

  const [jobMessages, setJobMessages] = useState({});

  const [globalMessage, setGlobalMessage] = useState("");

  const [loginRole, setLoginRole] = useState("student");

  const [studentLogin, setStudentLogin] = useState({
    email: "",
    password: "",
  });

  const [studentRegister, setStudentRegister] = useState({
    name: "",
    email: "",
    password: "",
    cgpa: "",
    branch: "",
    batch: "",
    skills: "",
  });

  const [recruiterLogin, setRecruiterLogin] = useState({
    email: "",
    password: "",
  });

  const [recruiterRegister, setRecruiterRegister] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
  });

  const [adminLogin, setAdminLogin] = useState({
    email: "",
    password: "",
  });

  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    minCGPA: "",
    branch: "",
    batch: "",
    skills: "",
    location: "",
  });

  const [search, setSearch] = useState("");

  const [locationFilter, setLocationFilter] = useState("");

  const [batchFilter, setBatchFilter] = useState("");

  const [selectedJob, setSelectedJob] = useState(null);

  const [interviewForm, setInterviewForm] = useState({
    applicationId: "",
    studentId: "",
    jobId: "",
    date: "",
    time: "",
    mode: "Online",
    meetingLink: "",
    location: "",
  });

  const [showStudentRegister, setShowStudentRegister] = useState(false);

  const [showRecruiterRegister, setShowRecruiterRegister] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [forgotForm, setForgotForm] = useState({
    role: "student",
    email: "",
    otp: "",
    newPassword: "",
  });

  const [otp, setOtp] = useState("");

  const [adminStats, setAdminStats] = useState(null);

  const [adminStudents, setAdminStudents] = useState([]);

  const [adminRecruiters, setAdminRecruiters] = useState([]);

  const [adminJobs, setAdminJobs] = useState([]);

  const [adminApplications, setAdminApplications] = useState([]);

  /* =========================================================
     RESTORE SESSION
  ========================================================= */

  useEffect(() => {
    const savedStudent = localStorage.getItem("student");

    const savedRecruiter = localStorage.getItem("recruiter");

    const savedAdmin = localStorage.getItem("admin");

    if (savedStudent && getToken("student")) {
      try {
        setStudent(JSON.parse(savedStudent));
      } catch {
        localStorage.removeItem("student");
      }
    }

    if (savedRecruiter && getToken("recruiter")) {
      try {
        setRecruiter(JSON.parse(savedRecruiter));
      } catch {
        localStorage.removeItem("recruiter");
      }
    }

    if (savedAdmin && getToken("admin")) {
      try {
        setAdmin(JSON.parse(savedAdmin));
      } catch {
        localStorage.removeItem("admin");
      }
    }
  }, []);

  /* =========================================================
     MESSAGE
  ========================================================= */

  function clearMessage() {
    setGlobalMessage("");
  }

  /* =========================================================
     STUDENT REGISTER
  ========================================================= */

  async function registerStudent(e) {
    e.preventDefault();
    clearMessage();

    try {
      const response = await fetch(`${API}/api/students/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentRegister),
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalMessage(data.message || "Registration failed.");
        return;
      }

      setGlobalMessage("Student registration successful. Please login.");

      setStudentRegister({
        name: "",
        email: "",
        password: "",
        cgpa: "",
        branch: "",
        batch: "",
        skills: "",
      });

      setShowStudentRegister(false);
      setLoginRole("student");
    } catch (error) {
      console.error(error);

      setGlobalMessage("Backend server se connection nahi ho raha.");
    }
  }

  /* =========================================================
     STUDENT LOGIN
  ========================================================= */

  async function loginStudent(e) {
    e.preventDefault();
    clearMessage();

    try {
      const response = await fetch(`${API}/api/students/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentLogin),
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalMessage(data.message || "Login failed.");
        return;
      }

      setStudent(data.student);

      localStorage.setItem("studentToken", data.token);

      localStorage.setItem("student", JSON.stringify(data.student));

      setStudentLogin({
        email: "",
        password: "",
      });

      setPage("student-dashboard");

      await loadJobs();

      await loadStudentApplications(data.student.id, data.token);

      await loadStudentInterviews(data.student.id, data.token);
    } catch (error) {
      console.error(error);

      setGlobalMessage("Backend server se connection nahi ho raha.");
    }
  }

  /* =========================================================
     RECRUITER REGISTER
  ========================================================= */

  async function registerRecruiter(e) {
    e.preventDefault();
    clearMessage();

    try {
      const response = await fetch(`${API}/api/recruiters/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recruiterRegister),
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalMessage(data.message || "Recruiter registration failed.");
        return;
      }

      setGlobalMessage("Recruiter registration successful. Please login.");

      setRecruiterRegister({
        name: "",
        email: "",
        password: "",
        company: "",
      });

      setShowRecruiterRegister(false);
      setLoginRole("recruiter");
    } catch (error) {
      console.error(error);

      setGlobalMessage("Backend server se connection nahi ho raha.");
    }
  }

  /* =========================================================
     RECRUITER LOGIN
  ========================================================= */

  async function loginRecruiter(e) {
    e.preventDefault();
    clearMessage();

    try {
      const response = await fetch(`${API}/api/recruiters/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recruiterLogin),
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalMessage(data.message || "Login failed.");
        return;
      }

      setRecruiter(data.recruiter);

      localStorage.setItem("recruiterToken", data.token);

      localStorage.setItem("recruiter", JSON.stringify(data.recruiter));

      setRecruiterLogin({
        email: "",
        password: "",
      });

      setPage("recruiter-dashboard");

      await loadJobs();
    } catch (error) {
      console.error(error);

      setGlobalMessage("Backend server se connection nahi ho raha.");
    }
  }

  /* =========================================================
     ADMIN LOGIN
  ========================================================= */

  async function loginAdmin(e) {
    e.preventDefault();
    clearMessage();

    try {
      const response = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminLogin),
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalMessage(data.message || "Admin login failed.");
        return;
      }

      setAdmin(data.admin);

      localStorage.setItem("adminToken", data.token);

      localStorage.setItem("admin", JSON.stringify(data.admin));

      setAdminLogin({
        email: "",
        password: "",
      });

      setPage("admin-dashboard");

      await loadAdminData();
    } catch (error) {
      console.error(error);

      setGlobalMessage("Backend server se connection nahi ho raha.");
    }
  }

  /* =========================================================
     FORGOT PASSWORD
  ========================================================= */

  async function requestOtp(e) {
    if (e) e.preventDefault();

    clearMessage();

    try {
      const response = await fetch(`${API}/api/password/forgot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: forgotForm.role,
          email: forgotForm.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalMessage(data.message || "OTP request failed.");
        return;
      }

      setOtp(data.otp);

      setGlobalMessage(`Demo OTP: ${data.otp}`);
    } catch (error) {
      console.error(error);

      setGlobalMessage("OTP request failed.");
    }
  }

  async function resetPassword(e) {
    if (e) e.preventDefault();

    clearMessage();

    try {
      const response = await fetch(`${API}/api/password/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: forgotForm.role,
          email: forgotForm.email,
          otp: forgotForm.otp,
          newPassword: forgotForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalMessage(data.message || "Password reset failed.");
        return;
      }

      setGlobalMessage("Password reset successful. Please login.");

      setShowForgotPassword(false);

      setForgotForm({
        role: "student",
        email: "",
        otp: "",
        newPassword: "",
      });

      setOtp("");
    } catch (error) {
      console.error(error);

      setGlobalMessage("Password reset failed.");
    }
  }

  /* =========================================================
     LOAD JOBS
  ========================================================= */

  async function loadJobs() {
    try {
      const response = await fetch(`${API}/api/jobs`);

      const data = await response.json();

      if (response.ok) {
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /* =========================================================
     CREATE JOB
  ========================================================= */

  async function createJob(e) {
    e.preventDefault();
    clearMessage();

    if (!recruiter) {
      setGlobalMessage("Recruiter login required.");
      return;
    }

    const batches = getArray(jobForm.batch);

    const locations = getArray(jobForm.location);

    const skills = getArray(jobForm.skills);

    if (
      !jobForm.title.trim() ||
      !jobForm.description.trim() ||
      !jobForm.minCGPA ||
      !jobForm.branch.trim() ||
      batches.length === 0 ||
      locations.length === 0
    ) {
      setGlobalMessage("Please fill all required job fields.");
      return;
    }

    try {
      const token = getToken("recruiter");

      const response = await fetch(`${API}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company: recruiter.company,

          recruiterId: recruiter.id,

          title: jobForm.title.trim(),

          description: jobForm.description.trim(),

          minCGPA: Number(jobForm.minCGPA),

          branch: jobForm.branch.trim(),

          batch: batches[0],

          batches,

          skills,

          location: locations[0],

          locations,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalMessage(data.message || "Job creation failed.");
        return;
      }

      setGlobalMessage("🎉 Job created successfully!");

      setJobForm({
        title: "",
        description: "",
        minCGPA: "",
        branch: "",
        batch: "",
        skills: "",
        location: "",
      });

      await loadJobs();

      setPage("my-jobs");
    } catch (error) {
      console.error(error);

      setGlobalMessage("Job creation failed.");
    }
  }

  /* =========================================================
     ELIGIBILITY
  ========================================================= */

  function checkEligibility(job) {
    if (!student) {
      return {
        eligible: false,
        reason: "Student login required.",
      };
    }

    if (Number(student.cgpa) < Number(job.minCGPA)) {
      return {
        eligible: false,
        reason: `Minimum CGPA ${job.minCGPA} required.`,
      };
    }

    const studentBranch = String(student.branch || "")
      .trim()
      .toLowerCase();

    const jobBranch = String(job.branch || "")
      .trim()
      .toLowerCase();

    if (jobBranch && studentBranch !== jobBranch) {
      return {
        eligible: false,
        reason: `Branch ${job.branch} required.`,
      };
    }

    const batches = getJobBatches(job);

    if (
      batches.length > 0 &&
      !batches.some(
        (batch) => String(batch).trim() === String(student.batch).trim(),
      )
    ) {
      return {
        eligible: false,
        reason: `Eligible batches: ${batches.join(", ")}`,
      };
    }

    return {
      eligible: true,
      reason: "Eligible",
    };
  }

  /* =========================================================
     APPLY
  ========================================================= */

  async function applyForJob(job) {
    const jobId = String(job._id);

    if (!student) {
      setJobMessages((prev) => ({
        ...prev,
        [jobId]: "Student login required.",
      }));
      return;
    }

    const eligibility = checkEligibility(job);

    if (!eligibility.eligible) {
      setJobMessages((prev) => ({
        ...prev,
        [jobId]: `You cannot apply: ${eligibility.reason}`,
      }));
      return;
    }

    const token = getToken("student");

    if (!token) {
      setJobMessages((prev) => ({
        ...prev,
        [jobId]: "Student session expired. Please login again.",
      }));
      return;
    }

    setJobMessages((prev) => ({
      ...prev,
      [jobId]: "Submitting application...",
    }));

    try {
      const response = await fetch(`${API}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: student.id,

          jobId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setJobMessages((prev) => ({
          ...prev,
          [jobId]: data.message || "Application failed.",
        }));
        return;
      }

      setJobMessages((prev) => ({
        ...prev,
        [jobId]: "🎉 Application submitted successfully!",
      }));

      await loadStudentApplications(student.id, token);
    } catch (error) {
      console.error(error);

      setJobMessages((prev) => ({
        ...prev,
        [jobId]: "Server se connection nahi ho raha.",
      }));
    }
  }

  /* =========================================================
     STUDENT APPLICATIONS
  ========================================================= */

  async function loadStudentApplications(studentId, providedToken) {
    try {
      const token = providedToken || getToken("student");

      if (!token) return;

      const response = await fetch(
        `${API}/api/applications/student/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /* =========================================================
     STUDENT INTERVIEWS
  ========================================================= */

  async function loadStudentInterviews(studentId, providedToken) {
    try {
      const token = providedToken || getToken("student");

      if (!token) return;

      const response = await fetch(
        `${API}/api/interviews/student/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setInterviews(data.interviews || []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /* =========================================================
     MY JOBS
  ========================================================= */

  const myJobs = useMemo(() => {
    if (!recruiter) return [];

    return jobs.filter(
      (job) =>
        String(job.company).toLowerCase() ===
        String(recruiter.company).toLowerCase(),
    );
  }, [jobs, recruiter]);

  /* =========================================================
     APPLICANTS
  ========================================================= */

  async function getApplicants(job) {
    clearMessage();

    try {
      const token = getToken("recruiter");

      const response = await fetch(`${API}/api/applications/job/${job._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalMessage(data.message || "Applicants fetch failed.");
        return;
      }

      setApplicants(data.applicants || []);

      setSelectedJob(job);
      setPage("applicants");
    } catch (error) {
      console.error(error);

      setGlobalMessage("Applicants fetch failed.");
    }
  }

  /* =========================================================
     UPDATE STATUS
  ========================================================= */

  async function updateApplicationStatus(applicationId, status) {
    try {
      const token = getToken("recruiter");

      const response = await fetch(
        `${API}/api/applications/${applicationId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setGlobalMessage(data.message || "Status update failed.");
        return;
      }

      setApplicants((prev) =>
        prev.map((item) =>
          item.applicationId === applicationId
            ? {
                ...item,
                status,
              }
            : item,
        ),
      );

      setGlobalMessage(`Application status changed to ${status}.`);
    } catch (error) {
      console.error(error);

      setGlobalMessage("Status update failed.");
    }
  }

  /* =========================================================
     OPEN INTERVIEW
  ========================================================= */

  function openInterviewForm(applicant, job) {
    setInterviewForm({
      applicationId: applicant.applicationId,

      studentId: applicant.studentId,

      jobId: String(job._id),

      date: "",
      time: "",
      mode: "Online",
      meetingLink: "",
      location: "",
    });

    setPage("schedule-interview");
  }

  /* =========================================================
     SCHEDULE INTERVIEW
  ========================================================= */

  async function scheduleInterview(e) {
    e.preventDefault();
    clearMessage();

    try {
      const token = getToken("recruiter");

      const response = await fetch(`${API}/api/interviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(interviewForm),
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalMessage(data.message || "Interview scheduling failed.");
        return;
      }

      setGlobalMessage("🎉 Interview scheduled successfully!");

      setInterviewForm({
        applicationId: "",
        studentId: "",
        jobId: "",
        date: "",
        time: "",
        mode: "Online",
        meetingLink: "",
        location: "",
      });

      setPage("applicants");
    } catch (error) {
      console.error(error);

      setGlobalMessage("Interview scheduling failed.");
    }
  }

  /* =========================================================
     ADMIN
  ========================================================= */

  async function loadAdminData() {
    const token = getToken("admin");

    if (!token) return;

    try {
      const [
        statsResponse,
        studentsResponse,
        recruitersResponse,
        jobsResponse,
        applicationsResponse,
      ] = await Promise.all([
        fetch(`${API}/api/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API}/api/admin/students`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API}/api/admin/recruiters`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API}/api/admin/jobs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API}/api/admin/applications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const stats = await statsResponse.json();

      const students = await studentsResponse.json();

      const recruiters = await recruitersResponse.json();

      const jobs = await jobsResponse.json();

      const apps = await applicationsResponse.json();

      if (statsResponse.ok) {
        setAdminStats(stats);
      }

      if (studentsResponse.ok) {
        setAdminStudents(students.students || []);
      }

      if (recruitersResponse.ok) {
        setAdminRecruiters(recruiters.recruiters || []);
      }

      if (jobsResponse.ok) {
        setAdminJobs(jobs.jobs || []);
      }

      if (applicationsResponse.ok) {
        setAdminApplications(apps.applications || []);
      }
    } catch (error) {
      console.error(error);

      setGlobalMessage("Admin data fetch failed.");
    }
  }

  async function deleteAdminItem(type, id) {
    try {
      const token = getToken("admin");

      const response = await fetch(`${API}/api/admin/${type}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalMessage(data.message || "Delete failed.");
        return;
      }

      setGlobalMessage("Deleted successfully.");

      await loadAdminData();
    } catch (error) {
      console.error(error);

      setGlobalMessage("Delete failed.");
    }
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  function logout() {
    localStorage.removeItem("studentToken");

    localStorage.removeItem("student");

    localStorage.removeItem("recruiterToken");

    localStorage.removeItem("recruiter");

    localStorage.removeItem("adminToken");

    localStorage.removeItem("admin");

    setStudent(null);
    setRecruiter(null);
    setAdmin(null);

    setApplications([]);
    setInterviews([]);
    setApplicants([]);

    setPage("home");
    setGlobalMessage("");
  }

  /* =========================================================
     FILTERED JOBS
  ========================================================= */

  const filteredJobs = jobs.filter((job) => {
    const text = `${job.title || ""} ${job.company || ""} ${
      job.description || ""
    }`.toLowerCase();

    const searchMatch = text.includes(search.toLowerCase());

    const locations = getJobLocations(job).map((x) => String(x).toLowerCase());

    const batches = getJobBatches(job).map((x) => String(x).toLowerCase());

    const locationMatch =
      !locationFilter ||
      locations.includes(locationFilter.trim().toLowerCase());

    const batchMatch =
      !batchFilter || batches.includes(batchFilter.trim().toLowerCase());

    return searchMatch && locationMatch && batchMatch;
  });

  /* =========================================================
     NAVIGATION
  ========================================================= */

  function goJobs() {
    setPage("jobs");
    loadJobs();
  }

  function goStudentDashboard() {
    if (!student) {
      setLoginRole("student");
      setPage("login");
      return;
    }

    setPage("student-dashboard");

    loadJobs();

    loadStudentApplications(student.id);

    loadStudentInterviews(student.id);
  }

  function goRecruiterDashboard() {
    if (!recruiter) {
      setLoginRole("recruiter");
      setPage("login");
      return;
    }

    setPage("recruiter-dashboard");

    loadJobs();
  }

  function goAdminDashboard() {
    if (!admin) {
      setLoginRole("admin");
      setPage("login");
      return;
    }

    setPage("admin-dashboard");

    loadAdminData();
  }

  /* =========================================================
     JOB CARD
     
     IMPORTANT:
     This is called as a normal function:
     JobCard(...)
     
     NOT:
     <JobCard />
     
     This prevents input focus/remount problems.
  ========================================================= */

  function JobCard({ job, recruiterView = false }) {
    const eligibility = student
      ? checkEligibility(job)
      : {
          eligible: false,
          reason: "Student login required.",
        };

    const batches = getJobBatches(job);

    const locations = getJobLocations(job);

    const skills = getJobSkills(job);

    return (
      <div className="job-card">
        <div className="job-card-top">
          <div>
            <h3>{job.title}</h3>

            <p className="company-name">{job.company}</p>
          </div>

          <span className="job-badge">Open</span>
        </div>

        <p className="job-description">{job.description}</p>

        <div className="job-info-grid">
          <div>
            <span>CGPA</span>

            <strong>{job.minCGPA}</strong>
          </div>

          <div>
            <span>Branch</span>

            <strong>{job.branch}</strong>
          </div>
        </div>

        <div className="job-section">
          <strong>Batches</strong>

          <div className="tag-list">
            {batches.map((batch, index) => (
              <span className="tag" key={`${batch}-${index}`}>
                {batch}
              </span>
            ))}
          </div>
        </div>

        <div className="job-section">
          <strong>Locations</strong>

          <div className="tag-list">
            {locations.map((location, index) => (
              <span className="tag" key={`${location}-${index}`}>
                {location}
              </span>
            ))}
          </div>
        </div>

        {skills.length > 0 && (
          <div className="job-section">
            <strong>Skills</strong>

            <div className="tag-list">
              {skills.map((skill, index) => (
                <span className="tag" key={`${skill}-${index}`}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {!recruiterView && (
          <>
            <div
              className={
                eligibility.eligible
                  ? "eligibility eligible"
                  : "eligibility not-eligible"
              }
            >
              {eligibility.eligible
                ? "✓ You are eligible"
                : `✕ ${eligibility.reason}`}
            </div>

            <div className="button-row">
              <button
                type="button"
                className="primary-btn"
                onClick={() => applyForJob(job)}
              >
                Apply Now
              </button>
            </div>

            {jobMessages[String(job._id)] && (
              <p className="apply-message">{jobMessages[String(job._id)]}</p>
            )}
          </>
        )}

        {recruiterView && (
          <div className="button-row">
            <button
              type="button"
              className="primary-btn"
              onClick={() => getApplicants(job)}
            >
              View Applicants
            </button>
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     HOME
  ========================================================= */

  function HomePage() {
    return (
      <div className="page-container">
        <section className="hero">
          <div className="hero-content">
            <span className="hero-badge">🚀 Smart Placement Platform</span>

            <h1>
              Your Career.
              <br />
              <span>Your Opportunity.</span>
            </h1>

            <p>
              A complete placement management platform connecting students,
              recruiters and administrators in one place.
            </p>

            <div className="hero-buttons">
              <button className="primary-btn" onClick={() => setPage("login")}>
                Get Started
              </button>

              <button className="secondary-btn" onClick={goJobs}>
                Explore Jobs
              </button>
            </div>
          </div>

          <div className="hero-card">
            <div className="floating-card">
              <span>🎓</span>

              <div>
                <strong>Students</strong>

                <small>Find opportunities</small>
              </div>
            </div>

            <div className="floating-card">
              <span>🏢</span>

              <div>
                <strong>Recruiters</strong>

                <small>Find talented students</small>
              </div>
            </div>

            <div className="floating-card">
              <span>📊</span>

              <div>
                <strong>Admin</strong>

                <small>Manage placements</small>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <div className="feature-card">
            <span>🔎</span>

            <h3>Smart Job Search</h3>

            <p>Search and filter jobs by branch, batch and location.</p>
          </div>

          <div className="feature-card">
            <span>✅</span>

            <h3>Eligibility Check</h3>

            <p>Check CGPA, branch and batch eligibility before applying.</p>
          </div>

          <div className="feature-card">
            <span>💼</span>

            <h3>Application Tracking</h3>

            <p>Track your placement application status in one dashboard.</p>
          </div>

          <div className="feature-card">
            <span>📅</span>

            <h3>Interview Management</h3>

            <p>
              Recruiters can schedule interviews and students can view them.
            </p>
          </div>
        </section>
      </div>
    );
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  function LoginPage() {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Welcome Back 👋</h2>

          <p className="auth-subtitle">Login to your placement account</p>

          <div className="role-tabs">
            <button
              type="button"
              className={loginRole === "student" ? "active" : ""}
              onClick={() => setLoginRole("student")}
            >
              Student
            </button>

            <button
              type="button"
              className={loginRole === "recruiter" ? "active" : ""}
              onClick={() => setLoginRole("recruiter")}
            >
              Recruiter
            </button>

            <button
              type="button"
              className={loginRole === "admin" ? "active" : ""}
              onClick={() => setLoginRole("admin")}
            >
              Admin
            </button>
          </div>

          {loginRole === "student" && (
            <form onSubmit={loginStudent}>
              <input
                type="email"
                placeholder="Student Email"
                value={studentLogin.email}
                onChange={(e) =>
                  setStudentLogin((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={studentLogin.password}
                onChange={(e) =>
                  setStudentLogin((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                required
              />

              <button className="primary-btn full" type="submit">
                Login as Student
              </button>

              <button
                type="button"
                className="text-btn"
                onClick={() => setShowStudentRegister(true)}
              >
                Create Student Account
              </button>
            </form>
          )}

          {loginRole === "recruiter" && (
            <form onSubmit={loginRecruiter}>
              <input
                type="email"
                placeholder="Recruiter Email"
                value={recruiterLogin.email}
                onChange={(e) =>
                  setRecruiterLogin((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={recruiterLogin.password}
                onChange={(e) =>
                  setRecruiterLogin((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                required
              />

              <button className="primary-btn full" type="submit">
                Login as Recruiter
              </button>

              <button
                type="button"
                className="text-btn"
                onClick={() => setShowRecruiterRegister(true)}
              >
                Create Recruiter Account
              </button>
            </form>
          )}

          {loginRole === "admin" && (
            <form onSubmit={loginAdmin}>
              <input
                type="email"
                placeholder="Admin Email"
                value={adminLogin.email}
                onChange={(e) =>
                  setAdminLogin((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                required
              />

              <input
                type="password"
                placeholder="Admin Password"
                value={adminLogin.password}
                onChange={(e) =>
                  setAdminLogin((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                required
              />

              <button className="primary-btn full" type="submit">
                Login as Admin
              </button>
            </form>
          )}

          <button
            className="forgot-btn"
            type="button"
            onClick={() => setShowForgotPassword(true)}
          >
            Forgot Password?
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     JOBS
  ========================================================= */

  function JobsPage() {
    return (
      <div className="page-container">
        <div className="section-heading">
          <div>
            <span className="section-label">Opportunities</span>

            <h2>Find Your Next Job</h2>
          </div>

          <span>{filteredJobs.length} jobs</span>
        </div>

        <div className="filter-bar">
          <input
            placeholder="Search jobs, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <input
            placeholder="Filter location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />

          <input
            placeholder="Filter batch"
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
          />

          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              setSearch("");
              setLocationFilter("");
              setBatchFilter("");
            }}
          >
            Clear
          </button>
        </div>

        <div className="jobs-grid">
          {filteredJobs.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>

              <h3>No jobs found</h3>

              <p>Try changing your filters.</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div key={job._id}>
                {JobCard({
                  job,
                })}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  /* =========================================================
     STUDENT DASHBOARD
  ========================================================= */

  function StudentDashboard() {
    const selectedCount = applications.filter(
      (app) => app.status === "Selected",
    ).length;

    return (
      <div className="page-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">Student Dashboard</span>

            <h2>Hello, {student?.name} 👋</h2>

            <p>Track your placement journey from one place.</p>
          </div>

          <button className="primary-btn" onClick={goJobs}>
            Browse Jobs
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>🎯</span>

            <strong>{applications.length}</strong>

            <small>Applications</small>
          </div>

          <div className="stat-card">
            <span>📅</span>

            <strong>{interviews.length}</strong>

            <small>Interviews</small>
          </div>

          <div className="stat-card">
            <span>🏆</span>

            <strong>{selectedCount}</strong>

            <small>Selected</small>
          </div>

          <div className="stat-card">
            <span>⭐</span>

            <strong>{student?.cgpa}</strong>

            <small>CGPA</small>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>My Profile</h3>

            <p>
              <strong>Name:</strong> {student?.name}
            </p>

            <p>
              <strong>Email:</strong> {student?.email}
            </p>

            <p>
              <strong>Branch:</strong> {student?.branch}
            </p>

            <p>
              <strong>Batch:</strong> {student?.batch}
            </p>

            <p>
              <strong>CGPA:</strong> {student?.cgpa}
            </p>

            <p>
              <strong>Skills:</strong>{" "}
              {getArray(student?.skills).join(", ") || "Not added"}
            </p>
          </div>

          <div className="dashboard-card">
            <h3>Recent Applications</h3>

            {applications.length === 0 ? (
              <p className="muted">No applications yet.</p>
            ) : (
              applications.slice(0, 5).map((app) => (
                <div className="application-row" key={app._id}>
                  <div>
                    <strong>Job Application</strong>

                    <small>{app.jobId}</small>
                  </div>

                  <span
                    className={`status ${String(app.status)
                      .toLowerCase()
                      .replace(/\s/g, "-")}`}
                  >
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Upcoming Interviews</h3>

          {interviews.length === 0 ? (
            <p className="muted">No interviews scheduled.</p>
          ) : (
            interviews.map((interview) => (
              <div className="interview-row" key={interview._id}>
                <div>
                  <strong>{interview.date}</strong>

                  <span>{interview.time}</span>
                </div>

                <div>
                  <strong>{interview.mode}</strong>

                  <span>
                    {interview.mode === "Online"
                      ? interview.meetingLink
                      : interview.location}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  /* =========================================================
     RECRUITER DASHBOARD
  ========================================================= */

  function RecruiterDashboard() {
    return (
      <div className="page-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">Recruiter Dashboard</span>

            <h2>Welcome, {recruiter?.name} 👋</h2>

            <p>
              Manage hiring for <strong>{recruiter?.company}</strong>
            </p>
          </div>

          <button className="primary-btn" onClick={() => setPage("create-job")}>
            + Post New Job
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>💼</span>

            <strong>{myJobs.length}</strong>

            <small>Jobs Posted</small>
          </div>

          <div className="stat-card">
            <span>👥</span>

            <strong>{applicants.length}</strong>

            <small>Applicants</small>
          </div>

          <div className="stat-card">
            <span>🏢</span>

            <strong>{recruiter?.company}</strong>

            <small>Company</small>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Quick Actions</h3>

          <div className="quick-actions">
            <button
              className="secondary-btn"
              onClick={() => setPage("create-job")}
            >
              Post Job
            </button>

            <button
              className="secondary-btn"
              onClick={() => setPage("my-jobs")}
            >
              My Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     CREATE JOB
  ========================================================= */

  function CreateJobPage() {
    return (
      <div className="page-container narrow">
        <div className="section-heading">
          <div>
            <span className="section-label">Recruiter</span>

            <h2>Create New Job</h2>
          </div>
        </div>

        <form className="form-card" onSubmit={createJob}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Job Title</label>

              <input
                placeholder="Software Developer"
                value={jobForm.title}
                onChange={(e) =>
                  setJobForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Job Description</label>

              <textarea
                placeholder="Describe the role..."
                value={jobForm.description}
                onChange={(e) =>
                  setJobForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Minimum CGPA</label>

              <input
                type="number"
                step="0.01"
                placeholder="6.5"
                value={jobForm.minCGPA}
                onChange={(e) =>
                  setJobForm((prev) => ({
                    ...prev,
                    minCGPA: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Branch</label>

              <input
                placeholder="CSE"
                value={jobForm.branch}
                onChange={(e) =>
                  setJobForm((prev) => ({
                    ...prev,
                    branch: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Eligible Batches</label>

              <input
                placeholder="2027, 2028, 2029"
                value={jobForm.batch}
                onChange={(e) =>
                  setJobForm((prev) => ({
                    ...prev,
                    batch: e.target.value,
                  }))
                }
                required
              />

              <small>Multiple batches comma se separate karo.</small>
            </div>

            <div className="form-group full-width">
              <label>Required Skills</label>

              <input
                placeholder="C++, JavaScript, SQL"
                value={jobForm.skills}
                onChange={(e) =>
                  setJobForm((prev) => ({
                    ...prev,
                    skills: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-group full-width">
              <label>Locations</label>

              <input
                placeholder="Bhopal, Indore, Pune"
                value={jobForm.location}
                onChange={(e) =>
                  setJobForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                required
              />

              <small>Multiple locations comma se separate karo.</small>
            </div>
          </div>

          <div className="button-row">
            <button type="submit" className="primary-btn">
              Publish Job
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => setPage("recruiter-dashboard")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* =========================================================
     MY JOBS
  ========================================================= */

  function MyJobsPage() {
    return (
      <div className="page-container">
        <div className="section-heading">
          <div>
            <span className="section-label">Recruiter</span>

            <h2>My Jobs</h2>
          </div>

          <button className="primary-btn" onClick={() => setPage("create-job")}>
            + New Job
          </button>
        </div>

        {myJobs.length === 0 ? (
          <div className="empty-state">
            <span>💼</span>

            <h3>No jobs posted yet</h3>

            <button
              className="primary-btn"
              onClick={() => setPage("create-job")}
            >
              Post Your First Job
            </button>
          </div>
        ) : (
          <div className="jobs-grid">
            {myJobs.map((job) => (
              <div key={job._id}>
                {JobCard({
                  job,
                  recruiterView: true,
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     APPLICANTS
  ========================================================= */

  function ApplicantsPage() {
    return (
      <div className="page-container">
        <div className="section-heading">
          <div>
            <span className="section-label">Recruiter</span>

            <h2>Applicants</h2>

            {selectedJob && <p>{selectedJob.title}</p>}
          </div>

          <button className="secondary-btn" onClick={() => setPage("my-jobs")}>
            ← Back to Jobs
          </button>
        </div>

        {applicants.length === 0 ? (
          <div className="empty-state">
            <span>👥</span>

            <h3>No applicants yet</h3>
          </div>
        ) : (
          <div className="applicants-grid">
            {applicants.map((applicant) => (
              <div className="applicant-card" key={applicant.applicationId}>
                <div className="applicant-header">
                  <div className="avatar">
                    {applicant.name?.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3>{applicant.name}</h3>

                    <p>{applicant.email}</p>
                  </div>
                </div>

                <div className="applicant-details">
                  <p>
                    <strong>CGPA:</strong> {applicant.cgpa}
                  </p>

                  <p>
                    <strong>Branch:</strong> {applicant.branch}
                  </p>

                  <p>
                    <strong>Batch:</strong> {applicant.batch}
                  </p>

                  <p>
                    <strong>Skills:</strong>{" "}
                    {getArray(applicant.skills).join(", ") || "Not added"}
                  </p>
                </div>

                <div className="status-row">
                  <span className="status-label">{applicant.status}</span>
                </div>

                <div className="button-row wrap">
                  <button
                    className="secondary-btn"
                    onClick={() =>
                      updateApplicationStatus(
                        applicant.applicationId,
                        "Shortlisted",
                      )
                    }
                  >
                    Shortlist
                  </button>

                  <button
                    className="danger-btn"
                    onClick={() =>
                      updateApplicationStatus(
                        applicant.applicationId,
                        "Rejected",
                      )
                    }
                  >
                    Reject
                  </button>

                  {applicant.status === "Shortlisted" && (
                    <button
                      className="primary-btn"
                      onClick={() => openInterviewForm(applicant, selectedJob)}
                    >
                      Schedule Interview
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     SCHEDULE INTERVIEW
  ========================================================= */

  function ScheduleInterviewPage() {
    return (
      <div className="page-container narrow">
        <div className="section-heading">
          <div>
            <span className="section-label">Recruiter</span>

            <h2>Schedule Interview</h2>
          </div>
        </div>

        <form className="form-card" onSubmit={scheduleInterview}>
          <div className="form-grid">
            <div className="form-group">
              <label>Date</label>

              <input
                type="date"
                value={interviewForm.date}
                onChange={(e) =>
                  setInterviewForm((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Time</label>

              <input
                type="time"
                value={interviewForm.time}
                onChange={(e) =>
                  setInterviewForm((prev) => ({
                    ...prev,
                    time: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Interview Mode</label>

              <select
                value={interviewForm.mode}
                onChange={(e) =>
                  setInterviewForm((prev) => ({
                    ...prev,
                    mode: e.target.value,
                    meetingLink: "",
                    location: "",
                  }))
                }
              >
                <option value="Online">Online</option>

                <option value="Offline">Offline</option>
              </select>
            </div>

            {interviewForm.mode === "Online" && (
              <div className="form-group full-width">
                <label>Meeting Link</label>

                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={interviewForm.meetingLink}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      meetingLink: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            )}

            {interviewForm.mode === "Offline" && (
              <div className="form-group full-width">
                <label>Interview Location</label>

                <input
                  placeholder="Company Office, Bhopal"
                  value={interviewForm.location}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            )}
          </div>

          <div className="button-row">
            <button className="primary-btn" type="submit">
              Schedule Interview
            </button>

            <button
              className="secondary-btn"
              type="button"
              onClick={() => setPage("applicants")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* =========================================================
     ADMIN DASHBOARD
  ========================================================= */

  function AdminDashboard() {
    return (
      <div className="page-container">
        <div className="dashboard-header">
          <div>
            <span className="section-label">Administration</span>

            <h2>Admin Dashboard 🛡️</h2>

            <p>Manage the complete placement ecosystem.</p>
          </div>

          <button className="secondary-btn" onClick={loadAdminData}>
            Refresh
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>🎓</span>

            <strong>{adminStats?.students || 0}</strong>

            <small>Students</small>
          </div>

          <div className="stat-card">
            <span>🏢</span>

            <strong>{adminStats?.recruiters || 0}</strong>

            <small>Recruiters</small>
          </div>

          <div className="stat-card">
            <span>💼</span>

            <strong>{adminStats?.jobs || 0}</strong>

            <small>Jobs</small>
          </div>

          <div className="stat-card">
            <span>📄</span>

            <strong>{adminStats?.applications || 0}</strong>

            <small>Applications</small>
          </div>

          <div className="stat-card">
            <span>🏆</span>

            <strong>{adminStats?.selected || 0}</strong>

            <small>Selected</small>
          </div>
        </div>

        <div className="admin-section">
          <h3>Students</h3>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>

                  <th>Email</th>

                  <th>CGPA</th>

                  <th>Branch</th>

                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {adminStudents.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>

                    <td>{item.email}</td>

                    <td>{item.cgpa}</td>

                    <td>{item.branch}</td>

                    <td>
                      <button
                        className="danger-btn small"
                        onClick={() => deleteAdminItem("students", item._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-section">
          <h3>Recruiters</h3>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>

                  <th>Company</th>

                  <th>Email</th>

                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {adminRecruiters.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>

                    <td>{item.company}</td>

                    <td>{item.email}</td>

                    <td>
                      <button
                        className="danger-btn small"
                        onClick={() => deleteAdminItem("recruiters", item._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-section">
          <h3>Jobs</h3>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>

                  <th>Company</th>

                  <th>Branch</th>

                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {adminJobs.map((item) => (
                  <tr key={item._id}>
                    <td>{item.title}</td>

                    <td>{item.company}</td>

                    <td>{item.branch}</td>

                    <td>
                      <button
                        className="danger-btn small"
                        onClick={() => deleteAdminItem("jobs", item._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     STUDENT REGISTER MODAL
  ========================================================= */

  function StudentRegisterModal() {
    if (!showStudentRegister) {
      return null;
    }

    return (
      <div className="modal-overlay">
        <div className="modal-card">
          <button
            type="button"
            className="modal-close"
            onClick={() => setShowStudentRegister(false)}
          >
            ×
          </button>

          <h2>Create Student Account</h2>

          <form onSubmit={registerStudent}>
            <input
              placeholder="Full Name"
              value={studentRegister.name}
              onChange={(e) =>
                setStudentRegister((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              required
            />

            <input
              type="email"
              placeholder="Email"
              value={studentRegister.email}
              onChange={(e) =>
                setStudentRegister((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={studentRegister.password}
              onChange={(e) =>
                setStudentRegister((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              required
            />

            <input
              type="number"
              step="0.01"
              placeholder="CGPA"
              value={studentRegister.cgpa}
              onChange={(e) =>
                setStudentRegister((prev) => ({
                  ...prev,
                  cgpa: e.target.value,
                }))
              }
              required
            />

            <input
              placeholder="Branch e.g. CSE"
              value={studentRegister.branch}
              onChange={(e) =>
                setStudentRegister((prev) => ({
                  ...prev,
                  branch: e.target.value,
                }))
              }
              required
            />

            <input
              placeholder="Batch e.g. 2027"
              value={studentRegister.batch}
              onChange={(e) =>
                setStudentRegister((prev) => ({
                  ...prev,
                  batch: e.target.value,
                }))
              }
              required
            />

            <input
              placeholder="Skills: C++, JavaScript, SQL"
              value={studentRegister.skills}
              onChange={(e) =>
                setStudentRegister((prev) => ({
                  ...prev,
                  skills: e.target.value,
                }))
              }
            />

            <button className="primary-btn full" type="submit">
              Create Account
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* =========================================================
     RECRUITER REGISTER MODAL
  ========================================================= */

  function RecruiterRegisterModal() {
    if (!showRecruiterRegister) {
      return null;
    }

    return (
      <div className="modal-overlay">
        <div className="modal-card">
          <button
            type="button"
            className="modal-close"
            onClick={() => setShowRecruiterRegister(false)}
          >
            ×
          </button>

          <h2>Create Recruiter Account</h2>

          <form onSubmit={registerRecruiter}>
            <input
              placeholder="Recruiter Name"
              value={recruiterRegister.name}
              onChange={(e) =>
                setRecruiterRegister((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              required
            />

            <input
              type="email"
              placeholder="Company Email"
              value={recruiterRegister.email}
              onChange={(e) =>
                setRecruiterRegister((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={recruiterRegister.password}
              onChange={(e) =>
                setRecruiterRegister((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              required
            />

            <input
              placeholder="Company Name"
              value={recruiterRegister.company}
              onChange={(e) =>
                setRecruiterRegister((prev) => ({
                  ...prev,
                  company: e.target.value,
                }))
              }
              required
            />

            <button className="primary-btn full" type="submit">
              Create Recruiter Account
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* =========================================================
     FORGOT PASSWORD MODAL
  ========================================================= */

  function ForgotPasswordModal() {
    if (!showForgotPassword) {
      return null;
    }

    return (
      <div className="modal-overlay">
        <div className="modal-card">
          <button
            type="button"
            className="modal-close"
            onClick={() => setShowForgotPassword(false)}
          >
            ×
          </button>

          <h2>Reset Password</h2>

          <select
            value={forgotForm.role}
            onChange={(e) =>
              setForgotForm((prev) => ({
                ...prev,
                role: e.target.value,
              }))
            }
          >
            <option value="student">Student</option>

            <option value="recruiter">Recruiter</option>
          </select>

          <input
            type="email"
            placeholder="Email"
            value={forgotForm.email}
            onChange={(e) =>
              setForgotForm((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
          />

          <button
            type="button"
            className="secondary-btn full"
            onClick={requestOtp}
          >
            Generate OTP
          </button>

          {otp && (
            <div className="otp-box">
              Demo OTP: <strong>{otp}</strong>
            </div>
          )}

          <input
            placeholder="Enter OTP"
            value={forgotForm.otp}
            onChange={(e) =>
              setForgotForm((prev) => ({
                ...prev,
                otp: e.target.value,
              }))
            }
          />

          <input
            type="password"
            placeholder="New Password"
            value={forgotForm.newPassword}
            onChange={(e) =>
              setForgotForm((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
          />

          <button
            type="button"
            className="primary-btn full"
            onClick={resetPassword}
          >
            Reset Password
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     NAVBAR
  ========================================================= */

  function Navbar() {
    return (
      <header className="navbar">
        <div className="brand" onClick={() => setPage("home")}>
          <div className="brand-icon">P</div>

          <div>
            <strong>PlacementHub</strong>

            <small>Career Management</small>
          </div>
        </div>

        <nav>
          <button type="button" onClick={() => setPage("home")}>
            Home
          </button>

          <button type="button" onClick={goJobs}>
            Jobs
          </button>

          {student && (
            <button type="button" onClick={goStudentDashboard}>
              Dashboard
            </button>
          )}

          {recruiter && (
            <>
              <button type="button" onClick={goRecruiterDashboard}>
                Dashboard
              </button>

              <button type="button" onClick={() => setPage("my-jobs")}>
                My Jobs
              </button>
            </>
          )}

          {admin && (
            <button type="button" onClick={goAdminDashboard}>
              Admin
            </button>
          )}

          {!student && !recruiter && !admin && (
            <button
              type="button"
              className="nav-login"
              onClick={() => setPage("login")}
            >
              Login
            </button>
          )}

          {(student || recruiter || admin) && (
            <button type="button" className="nav-logout" onClick={logout}>
              Logout
            </button>
          )}
        </nav>
      </header>
    );
  }

  /* =========================================================
     PAGE RENDER
     
     IMPORTANT:
     Direct function calls.
     
     This is the actual focus fix.
  ========================================================= */

  function renderPage() {
    switch (page) {
      case "login":
        return LoginPage();

      case "jobs":
        return JobsPage();

      case "student-dashboard":
        return student ? StudentDashboard() : LoginPage();

      case "recruiter-dashboard":
        return recruiter ? RecruiterDashboard() : LoginPage();

      case "create-job":
        return recruiter ? CreateJobPage() : LoginPage();

      case "my-jobs":
        return recruiter ? MyJobsPage() : LoginPage();

      case "applicants":
        return recruiter ? ApplicantsPage() : LoginPage();

      case "schedule-interview":
        return recruiter ? ScheduleInterviewPage() : LoginPage();

      case "admin-dashboard":
        return admin ? AdminDashboard() : LoginPage();

      default:
        return HomePage();
    }
  }

  /* =========================================================
     FINAL UI
  ========================================================= */

  return (
    <div className="app">
      {Navbar()}

      {globalMessage && (
        <div className="global-message">
          <span>{globalMessage}</span>

          <button type="button" onClick={clearMessage}>
            ×
          </button>
        </div>
      )}

      <main>{renderPage()}</main>

      <footer className="footer">
        <div>
          <strong>PlacementHub</strong>

          <p>Smart placement management for students and recruiters.</p>
        </div>

        <div>
          <p>Built with MERN Stack</p>

          <small>© 2026 PlacementHub</small>
        </div>
      </footer>

      {StudentRegisterModal()}
      {RecruiterRegisterModal()}
      {ForgotPasswordModal()}
    </div>
  );
}

export default App;
