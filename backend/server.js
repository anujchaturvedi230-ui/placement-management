const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

let db;

const client = new MongoClient(process.env.MONGO_URI, {
  family: 4,
  tls: true,
});

/* =========================================================
   HELPERS
========================================================= */

function toObjectId(id) {
  try {
    if (!id) return null;
    return new ObjectId(String(id));
  } catch {
    return null;
  }
}

function normalizeArray(value) {
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

function createToken(user) {
  return jwt.sign(
    {
      id: String(user._id),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
}

function getToken(req) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.substring(7);
}

function authRequired(req, res, next) {
  try {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        message: `${role} access required.`,
      });
    }

    next();
  };
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.json({
    message: "Placement Management Backend is Running!",
  });
});

/* =========================================================
   STUDENT REGISTER
========================================================= */

app.post("/api/students/register", async (req, res) => {
  try {
    const { name, email, password, cgpa, branch, batch, skills } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      cgpa === undefined ||
      !branch ||
      !batch
    ) {
      return res.status(400).json({
        message: "All required fields are necessary.",
      });
    }

    const existing = await db.collection("students").findOne({
      email: email.toLowerCase().trim(),
    });

    if (existing) {
      return res.status(400).json({
        message: "Student email already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      cgpa: Number(cgpa),
      branch: branch.trim(),
      batch: String(batch).trim(),
      skills: normalizeArray(skills),
      role: "student",
      createdAt: new Date(),
    };

    const result = await db.collection("students").insertOne(student);

    res.status(201).json({
      message: "Student registration successful.",
      studentId: result.insertedId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Student registration failed.",
    });
  }
});

/* =========================================================
   STUDENT LOGIN
========================================================= */

app.post("/api/students/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await db.collection("students").findOne({
      email: String(email).toLowerCase().trim(),
    });

    if (!student) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, student.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = createToken(student);

    const safeStudent = {
      id: String(student._id),
      name: student.name,
      email: student.email,
      cgpa: student.cgpa,
      branch: student.branch,
      batch: student.batch,
      skills: student.skills || [],
      role: "student",
    };

    res.json({
      message: "Student login successful.",
      token,
      student: safeStudent,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Student login failed.",
    });
  }
});

/* =========================================================
   STUDENT PROFILE
========================================================= */

app.get(
  "/api/students/profile",
  authRequired,
  requireRole("student"),
  async (req, res) => {
    try {
      const student = await db.collection("students").findOne({
        _id: toObjectId(req.user.id),
      });

      if (!student) {
        return res.status(404).json({
          message: "Student not found.",
        });
      }

      delete student.password;

      res.json({
        student: {
          ...student,
          id: String(student._id),
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Profile fetch failed.",
      });
    }
  },
);

/* =========================================================
   RECRUITER REGISTER
========================================================= */

app.post("/api/recruiters/register", async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    if (!name || !email || !password || !company) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    const existing = await db.collection("recruiters").findOne({
      email: email.toLowerCase().trim(),
    });

    if (existing) {
      return res.status(400).json({
        message: "Recruiter email already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const recruiter = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      company: company.trim(),
      role: "recruiter",
      createdAt: new Date(),
    };

    const result = await db.collection("recruiters").insertOne(recruiter);

    res.status(201).json({
      message: "Recruiter registration successful.",
      recruiterId: result.insertedId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Recruiter registration failed.",
    });
  }
});

/* =========================================================
   RECRUITER LOGIN
========================================================= */

app.post("/api/recruiters/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const recruiter = await db.collection("recruiters").findOne({
      email: String(email).toLowerCase().trim(),
    });

    if (!recruiter) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, recruiter.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = createToken(recruiter);

    const safeRecruiter = {
      id: String(recruiter._id),
      name: recruiter.name,
      email: recruiter.email,
      company: recruiter.company,
      role: "recruiter",
    };

    res.json({
      message: "Recruiter login successful.",
      token,
      recruiter: safeRecruiter,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Recruiter login failed.",
    });
  }
});

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({
        message: "Invalid admin credentials.",
      });
    }

    const admin = {
      id: "admin",
      email: adminEmail,
      role: "admin",
    };

    const token = jwt.sign(admin, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Admin login successful.",
      token,
      admin,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Admin login failed.",
    });
  }
});

/* =========================================================
   FORGOT PASSWORD
========================================================= */

app.post("/api/password/forgot", async (req, res) => {
  try {
    const { role, email } = req.body;

    let collection;

    if (role === "student") {
      collection = "students";
    } else if (role === "recruiter") {
      collection = "recruiters";
    } else {
      return res.status(400).json({
        message: "Invalid role.",
      });
    }

    const user = await db.collection(collection).findOne({
      email: String(email).toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        message: "Account not found.",
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    await db.collection("password_resets").deleteMany({
      email: user.email,
      role,
    });

    await db.collection("password_resets").insertOne({
      email: user.email,
      role,
      otp,
      createdAt: new Date(),
    });

    res.json({
      message: "OTP generated successfully.",
      otp,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "OTP generation failed.",
    });
  }
});

/* =========================================================
   RESET PASSWORD
========================================================= */

app.post("/api/password/reset", async (req, res) => {
  try {
    const { role, email, otp, newPassword } = req.body;

    const reset = await db.collection("password_resets").findOne({
      email: String(email).toLowerCase().trim(),
      role,
      otp: String(otp),
    });

    if (!reset) {
      return res.status(400).json({
        message: "Invalid OTP.",
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const collection = role === "student" ? "students" : "recruiters";

    await db.collection(collection).updateOne(
      {
        email: String(email).toLowerCase().trim(),
      },
      {
        $set: {
          password: hashedPassword,
        },
      },
    );

    await db.collection("password_resets").deleteOne({
      _id: reset._id,
    });

    res.json({
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Password reset failed.",
    });
  }
});

/* =========================================================
   CREATE JOB
========================================================= */

app.post(
  "/api/jobs",
  authRequired,
  requireRole("recruiter"),
  async (req, res) => {
    try {
      const {
        company,
        recruiterId,
        title,
        description,
        minCGPA,
        branch,
        batch,
        batches,
        skills,
        location,
        locations,
      } = req.body;

      if (
        !company ||
        !title ||
        !description ||
        minCGPA === undefined ||
        !branch
      ) {
        return res.status(400).json({
          message: "Required job fields are missing.",
        });
      }

      let finalBatches = normalizeArray(batches);

      if (finalBatches.length === 0) {
        finalBatches = normalizeArray(batch);
      }

      let finalLocations = normalizeArray(locations);

      if (finalLocations.length === 0) {
        finalLocations = normalizeArray(location);
      }

      const finalSkills = normalizeArray(skills);

      const job = {
        company: String(company).trim(),
        recruiterId: recruiterId || req.user.id,

        title: String(title).trim(),
        description: String(description).trim(),

        minCGPA: Number(minCGPA),

        branch: String(branch).trim(),

        batch: finalBatches[0] || "",
        batches: finalBatches,

        skills: finalSkills,

        location: finalLocations[0] || "",
        locations: finalLocations,

        createdAt: new Date(),
      };

      const result = await db.collection("jobs").insertOne(job);

      res.status(201).json({
        message: "Job created successfully.",
        jobId: result.insertedId,
        job: {
          ...job,
          _id: result.insertedId,
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Job creation failed.",
      });
    }
  },
);

/* =========================================================
   GET ALL JOBS
========================================================= */

app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await db
      .collection("jobs")
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray();

    res.json({
      jobs,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Jobs fetch failed.",
    });
  }
});

/* =========================================================
   GET RECRUITER JOBS
========================================================= */

app.get(
  "/api/jobs/recruiter/:company",
  authRequired,
  requireRole("recruiter"),
  async (req, res) => {
    try {
      const company = decodeURIComponent(req.params.company);

      const jobs = await db
        .collection("jobs")
        .find({
          company: company,
        })
        .sort({
          createdAt: -1,
        })
        .toArray();

      res.json({
        jobs,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Recruiter jobs fetch failed.",
      });
    }
  },
);

/* =========================================================
   ELIGIBILITY HELPER
========================================================= */

async function checkStudentEligibility(student, job) {
  if (!student || !job) {
    return {
      eligible: false,
      reason: "Student or job not found.",
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

  const batches = normalizeArray(job.batches?.length ? job.batches : job.batch);

  if (batches.length > 0 && !batches.includes(String(student.batch).trim())) {
    return {
      eligible: false,
      reason: `Eligible batches: ${batches.join(", ")}`,
    };
  }

  return {
    eligible: true,
    reason: "Student is eligible.",
  };
}

/* =========================================================
   APPLY FOR JOB
========================================================= */

app.post(
  "/api/applications",
  authRequired,
  requireRole("student"),
  async (req, res) => {
    try {
      const { studentId, jobId } = req.body;

      if (!studentId || !jobId) {
        return res.status(400).json({
          message: "Student ID and Job ID are required.",
        });
      }

      if (String(studentId) !== String(req.user.id)) {
        return res.status(403).json({
          message: "You can only apply using your own student account.",
        });
      }

      const student = await db.collection("students").findOne({
        _id: toObjectId(studentId),
      });

      const job = await db.collection("jobs").findOne({
        _id: toObjectId(jobId),
      });

      if (!student) {
        return res.status(404).json({
          message: "Student not found.",
        });
      }

      if (!job) {
        return res.status(404).json({
          message: "Job not found.",
        });
      }

      const eligibility = await checkStudentEligibility(student, job);

      if (!eligibility.eligible) {
        return res.status(400).json({
          message: eligibility.reason,
        });
      }

      const existing = await db.collection("applications").findOne({
        studentId: String(studentId),
        jobId: String(jobId),
      });

      if (existing) {
        return res.status(400).json({
          message: "You have already applied for this job.",
        });
      }

      const application = {
        studentId: String(studentId),
        jobId: String(jobId),
        status: "Applied",
        appliedAt: new Date(),
      };

      const result = await db.collection("applications").insertOne(application);

      res.status(201).json({
        message: "Application submitted successfully!",
        applicationId: result.insertedId,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Application failed.",
      });
    }
  },
);

/* =========================================================
   STUDENT APPLICATIONS
========================================================= */

app.get(
  "/api/applications/student/:studentId",
  authRequired,
  requireRole("student"),
  async (req, res) => {
    try {
      const studentId = req.params.studentId;

      if (String(studentId) !== String(req.user.id)) {
        return res.status(403).json({
          message: "Access denied.",
        });
      }

      const applications = await db
        .collection("applications")
        .find({
          studentId: String(studentId),
        })
        .sort({
          appliedAt: -1,
        })
        .toArray();

      res.json({
        applications,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Applications fetch failed.",
      });
    }
  },
);

/* =========================================================
   RECRUITER APPLICANTS
========================================================= */

app.get(
  "/api/applications/job/:jobId",
  authRequired,
  requireRole("recruiter"),
  async (req, res) => {
    try {
      const jobId = req.params.jobId;

      const job = await db.collection("jobs").findOne({
        _id: toObjectId(jobId),
      });

      if (!job) {
        return res.status(404).json({
          message: "Job not found.",
        });
      }

      if (
        String(job.recruiterId || "") !== String(req.user.id) &&
        String(job.recruiterId || "") !== String(req.user._id || "")
      ) {
        return res.status(403).json({
          message: "You cannot view applicants for this job.",
        });
      }

      const applications = await db
        .collection("applications")
        .find({
          jobId: String(jobId),
        })
        .sort({
          appliedAt: -1,
        })
        .toArray();

      const applicants = [];

      for (const application of applications) {
        const student = await db.collection("students").findOne({
          _id: toObjectId(application.studentId),
        });

        if (student) {
          applicants.push({
            applicationId: String(application._id),

            studentId: String(student._id),

            name: student.name,
            email: student.email,
            cgpa: student.cgpa,
            branch: student.branch,
            batch: student.batch,
            skills: student.skills || [],

            status: application.status,
            appliedAt: application.appliedAt,
          });
        }
      }

      res.json({
        applicants,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Applicants fetch failed.",
      });
    }
  },
);

/* =========================================================
   UPDATE APPLICATION STATUS
========================================================= */

app.put(
  "/api/applications/:applicationId/status",
  authRequired,
  requireRole("recruiter"),
  async (req, res) => {
    try {
      const { applicationId } = req.params;

      const { status } = req.body;

      const allowedStatuses = [
        "Applied",
        "Shortlisted",
        "Rejected",
        "Interview Scheduled",
        "Selected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid application status.",
        });
      }

      const application = await db.collection("applications").findOne({
        _id: toObjectId(applicationId),
      });

      if (!application) {
        return res.status(404).json({
          message: "Application not found.",
        });
      }

      const job = await db.collection("jobs").findOne({
        _id: toObjectId(application.jobId),
      });

      if (!job) {
        return res.status(404).json({
          message: "Job not found.",
        });
      }

      if (String(job.recruiterId || "") !== String(req.user.id)) {
        return res.status(403).json({
          message: "You cannot update this application.",
        });
      }

      await db.collection("applications").updateOne(
        {
          _id: application._id,
        },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        },
      );

      res.json({
        message: "Application status updated successfully.",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Application status update failed.",
      });
    }
  },
);

/* =========================================================
   SCHEDULE INTERVIEW
========================================================= */

app.post(
  "/api/interviews",
  authRequired,
  requireRole("recruiter"),
  async (req, res) => {
    try {
      const {
        applicationId,
        studentId,
        jobId,
        date,
        time,
        mode,
        meetingLink,
        location,
      } = req.body;

      if (!applicationId || !studentId || !jobId || !date || !time || !mode) {
        return res.status(400).json({
          message: "Interview details are required.",
        });
      }

      if (!["Online", "Offline"].includes(mode)) {
        return res.status(400).json({
          message: "Interview mode must be Online or Offline.",
        });
      }

      if (mode === "Online" && !meetingLink) {
        return res.status(400).json({
          message: "Meeting link is required for online interview.",
        });
      }

      if (mode === "Offline" && !location) {
        return res.status(400).json({
          message: "Location is required for offline interview.",
        });
      }

      const application = await db.collection("applications").findOne({
        _id: toObjectId(applicationId),
      });

      if (!application) {
        return res.status(404).json({
          message: "Application not found.",
        });
      }

      if (application.status !== "Shortlisted") {
        return res.status(400).json({
          message: "Only shortlisted students can have an interview scheduled.",
        });
      }

      const job = await db.collection("jobs").findOne({
        _id: toObjectId(jobId),
      });

      if (!job) {
        return res.status(404).json({
          message: "Job not found.",
        });
      }

      if (String(job.recruiterId || "") !== String(req.user.id)) {
        return res.status(403).json({
          message: "You cannot schedule an interview for this job.",
        });
      }

      const existingInterview = await db.collection("interviews").findOne({
        applicationId: String(applicationId),
      });

      if (existingInterview) {
        return res.status(400).json({
          message: "Interview is already scheduled.",
        });
      }

      const interview = {
        applicationId: String(applicationId),
        studentId: String(studentId),
        jobId: String(jobId),

        date,
        time,
        mode,

        meetingLink: mode === "Online" ? String(meetingLink).trim() : "",

        location: mode === "Offline" ? String(location).trim() : "",

        createdAt: new Date(),
      };

      const result = await db.collection("interviews").insertOne(interview);

      await db.collection("applications").updateOne(
        {
          _id: application._id,
        },
        {
          $set: {
            status: "Interview Scheduled",
            updatedAt: new Date(),
          },
        },
      );

      res.status(201).json({
        message: "Interview scheduled successfully.",
        interviewId: result.insertedId,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Interview scheduling failed.",
      });
    }
  },
);

/* =========================================================
   STUDENT INTERVIEWS
========================================================= */

app.get(
  "/api/interviews/student/:studentId",
  authRequired,
  requireRole("student"),
  async (req, res) => {
    try {
      const studentId = req.params.studentId;

      if (String(studentId) !== String(req.user.id)) {
        return res.status(403).json({
          message: "Access denied.",
        });
      }

      const interviews = await db
        .collection("interviews")
        .find({
          studentId: String(studentId),
        })
        .sort({
          createdAt: -1,
        })
        .toArray();

      res.json({
        interviews,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Interview fetch failed.",
      });
    }
  },
);

/* =========================================================
   ADMIN STATS
========================================================= */

app.get(
  "/api/admin/stats",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const students = await db.collection("students").countDocuments();

      const recruiters = await db.collection("recruiters").countDocuments();

      const jobs = await db.collection("jobs").countDocuments();

      const applications = await db.collection("applications").countDocuments();

      const selected = await db.collection("applications").countDocuments({
        status: "Selected",
      });

      res.json({
        students,
        recruiters,
        companies: recruiters,
        jobs,
        applications,
        selected,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Admin statistics fetch failed.",
      });
    }
  },
);

/* =========================================================
   ADMIN STUDENTS
========================================================= */

app.get(
  "/api/admin/students",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const students = await db
        .collection("students")
        .find({})
        .project({
          password: 0,
        })
        .sort({
          createdAt: -1,
        })
        .toArray();

      res.json({
        students,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Admin students fetch failed.",
      });
    }
  },
);

/* =========================================================
   ADMIN RECRUITERS
========================================================= */

app.get(
  "/api/admin/recruiters",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const recruiters = await db
        .collection("recruiters")
        .find({})
        .project({
          password: 0,
        })
        .sort({
          createdAt: -1,
        })
        .toArray();

      res.json({
        recruiters,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Admin recruiters fetch failed.",
      });
    }
  },
);

/* =========================================================
   ADMIN JOBS
========================================================= */

app.get(
  "/api/admin/jobs",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const jobs = await db
        .collection("jobs")
        .find({})
        .sort({
          createdAt: -1,
        })
        .toArray();

      res.json({
        jobs,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Admin jobs fetch failed.",
      });
    }
  },
);

/* =========================================================
   ADMIN APPLICATIONS
========================================================= */

app.get(
  "/api/admin/applications",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const applications = await db
        .collection("applications")
        .find({})
        .sort({
          appliedAt: -1,
        })
        .toArray();

      res.json({
        applications,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Admin applications fetch failed.",
      });
    }
  },
);

/* =========================================================
   ADMIN DELETE STUDENT
========================================================= */

app.delete(
  "/api/admin/students/:id",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const id = toObjectId(req.params.id);

      if (!id) {
        return res.status(400).json({
          message: "Invalid student ID.",
        });
      }

      await db.collection("students").deleteOne({
        _id: id,
      });

      res.json({
        message: "Student deleted successfully.",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Student delete failed.",
      });
    }
  },
);

/* =========================================================
   ADMIN DELETE RECRUITER
========================================================= */

app.delete(
  "/api/admin/recruiters/:id",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const id = toObjectId(req.params.id);

      if (!id) {
        return res.status(400).json({
          message: "Invalid recruiter ID.",
        });
      }

      await db.collection("recruiters").deleteOne({
        _id: id,
      });

      res.json({
        message: "Recruiter deleted successfully.",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Recruiter delete failed.",
      });
    }
  },
);

/* =========================================================
   ADMIN DELETE JOB
========================================================= */

app.delete(
  "/api/admin/jobs/:id",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const id = toObjectId(req.params.id);

      if (!id) {
        return res.status(400).json({
          message: "Invalid job ID.",
        });
      }

      await db.collection("jobs").deleteOne({
        _id: id,
      });

      await db.collection("applications").deleteMany({
        jobId: String(id),
      });

      await db.collection("interviews").deleteMany({
        jobId: String(id),
      });

      res.json({
        message: "Job deleted successfully.",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Job delete failed.",
      });
    }
  },
);

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {
  try {
    await client.connect();

    db = client.db("placement_management");

    console.log("MongoDB Atlas Connected Successfully!");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error);
  }
}

startServer();
