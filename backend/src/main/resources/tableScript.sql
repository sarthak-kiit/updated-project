-- ============================================================
--  SkillBuilder — Complete Database Script
--  Expanded Sample Data (SRS US01–US24 compliant)
--  Plain text passwords (training project — Spring Security removed):
--    Admin@123  → TSbcbXihF/Fna2up/FHRQg==$4RqFwO0Dr3T8kcGKz6m1skhxi/qsiswMvaHIQTetsN0=
--    Pass@123   → lo3NwgAZXOwpZYavR/Z5+w==$VL+3SnuY91EU/QV+qBRv90+pbqp/JdS2apj2qbcIuj8=
-- ============================================================

CREATE DATABASE IF NOT EXISTS skillbuilder_db;

USE skillbuilder_db;

-- ============================================================
--  DROP ALL TABLES (clean slate)
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS session_notes;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS mentee_career_goals;
DROP TABLE IF EXISTS mentee_desired_skills;
DROP TABLE IF EXISTS mentee_interests;
DROP TABLE IF EXISTS mentee_profiles;
DROP TABLE IF EXISTS favorite_mentors;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS availabilities;
DROP TABLE IF EXISTS mentor_skills;
DROP TABLE IF EXISTS work_experiences;
DROP TABLE IF EXISTS mentor_industries;
DROP TABLE IF EXISTS mentor_profiles;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  users
-- ============================================================
CREATE TABLE users (
    id                BIGINT          NOT NULL AUTO_INCREMENT,
    full_name         VARCHAR(100)    NOT NULL,
    email             VARCHAR(150)    NOT NULL UNIQUE,
    password          VARCHAR(255)    NOT NULL,
    role              ENUM('MENTOR','MENTEE','ADMIN') NOT NULL,
    profile_image_url VARCHAR(500)    NULL,
    active            TINYINT(1)      NOT NULL DEFAULT 1,
    email_verified    TINYINT(1)      NOT NULL DEFAULT 0,
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- ============================================================
--  mentor_profiles — US01
-- ============================================================
CREATE TABLE mentor_profiles (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    user_id              BIGINT       NOT NULL UNIQUE,
    headline             VARCHAR(200) NULL,
    company              VARCHAR(150) NULL,
    designation          VARCHAR(150) NULL,
    years_of_experience  INT          NULL,
    education            VARCHAR(300) NULL,
    professional_summary TEXT         NULL,
    average_rating       DOUBLE       NOT NULL DEFAULT 0.0,
    total_sessions       INT          NOT NULL DEFAULT 0,
    total_reviews        INT          NOT NULL DEFAULT 0,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_mentor_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
--  mentor_industries — US01, US05
-- ============================================================
CREATE TABLE mentor_industries (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    mentor_profile_id  BIGINT       NOT NULL,
    industry           VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_mentor_industries
        FOREIGN KEY (mentor_profile_id)
        REFERENCES mentor_profiles(id) ON DELETE CASCADE
);

-- ============================================================
--  work_experiences — US01
-- ============================================================
CREATE TABLE work_experiences (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    mentor_profile_id  BIGINT       NOT NULL,
    company_name       VARCHAR(150) NOT NULL,
    job_title          VARCHAR(150) NOT NULL,
    start_date         DATE         NULL,
    end_date           DATE         NULL,
    current_job        TINYINT(1)   NOT NULL DEFAULT 0,
    description        TEXT         NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_work_exp_mentor
        FOREIGN KEY (mentor_profile_id)
        REFERENCES mentor_profiles(id) ON DELETE CASCADE
);

-- ============================================================
--  mentor_skills — US01, US04, US06
-- ============================================================
CREATE TABLE mentor_skills (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    mentor_profile_id  BIGINT       NOT NULL,
    skill_name         VARCHAR(100) NOT NULL,
    category           VARCHAR(100) NULL,
    expertise_level    ENUM('BEGINNER','INTERMEDIATE','EXPERT') NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_mentor_skills_mentor
        FOREIGN KEY (mentor_profile_id)
        REFERENCES mentor_profiles(id) ON DELETE CASCADE
);

-- ============================================================
--  availabilities — US03, US07
-- ============================================================
CREATE TABLE availabilities (
    id                 BIGINT      NOT NULL AUTO_INCREMENT,
    mentor_profile_id  BIGINT      NOT NULL,
    day_of_week        ENUM('MONDAY','TUESDAY','WEDNESDAY','THURSDAY',
                            'FRIDAY','SATURDAY','SUNDAY') NOT NULL,
    start_time         TIME        NOT NULL,
    end_time           TIME        NOT NULL,
    recurring          TINYINT(1)  NOT NULL DEFAULT 1,
    timezone           VARCHAR(50) NOT NULL DEFAULT 'IST',
    PRIMARY KEY (id),
    CONSTRAINT fk_availability_mentor
        FOREIGN KEY (mentor_profile_id)
        REFERENCES mentor_profiles(id) ON DELETE CASCADE
);

-- ============================================================
--  mentee_profiles — US02
-- ============================================================
CREATE TABLE mentee_profiles (
    id                BIGINT   NOT NULL AUTO_INCREMENT,
    user_id           BIGINT   NOT NULL UNIQUE,
    career_objectives TEXT     NULL,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_mentee_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
--  mentee_interests — US02, US09
-- ============================================================
CREATE TABLE mentee_interests (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    mentee_profile_id  BIGINT       NOT NULL,
    industry_interest  VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_mentee_interests
        FOREIGN KEY (mentee_profile_id)
        REFERENCES mentee_profiles(id) ON DELETE CASCADE
);

-- ============================================================
--  mentee_desired_skills — US02, US09
-- ============================================================
CREATE TABLE mentee_desired_skills (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    mentee_profile_id  BIGINT       NOT NULL,
    skill_name         VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_mentee_desired_skills
        FOREIGN KEY (mentee_profile_id)
        REFERENCES mentee_profiles(id) ON DELETE CASCADE
);

-- ============================================================
--  mentee_career_goals — US02
-- ============================================================
CREATE TABLE mentee_career_goals (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    mentee_profile_id  BIGINT       NOT NULL,
    goal               VARCHAR(200) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_mentee_career_goals
        FOREIGN KEY (mentee_profile_id)
        REFERENCES mentee_profiles(id) ON DELETE CASCADE
);

-- ============================================================
--  sessions — US10, US11, US12, US13, US14
-- ============================================================
CREATE TABLE sessions (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    mentor_id         BIGINT       NOT NULL,
    mentee_id         BIGINT       NOT NULL,
    scheduled_at      DATETIME     NOT NULL,
    duration_minutes  INT          NOT NULL DEFAULT 60,
    agenda            TEXT         NULL,
    status            ENUM('PENDING','CONFIRMED','REJECTED',
                          'COMPLETED','CANCELLED','RESCHEDULED')
                                   NOT NULL DEFAULT 'PENDING',
    rejection_reason  VARCHAR(500) NULL,
    meeting_link      VARCHAR(500) NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_sessions_mentor
        FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_sessions_mentee
        FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
--  reviews — US15, US16, US17, US19
-- ============================================================
CREATE TABLE reviews (
    id              BIGINT     NOT NULL AUTO_INCREMENT,
    session_id      BIGINT     NOT NULL UNIQUE,
    mentee_id       BIGINT     NOT NULL,
    mentor_id       BIGINT     NOT NULL,
    rating          INT        NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT       NULL,
    mentor_response TEXT       NULL,
    anonymous       TINYINT(1) NOT NULL DEFAULT 0,
    created_at      DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME   NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_reviews_session
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_mentee
        FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_mentor
        FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
--  favorite_mentors — US08
-- ============================================================
CREATE TABLE favorite_mentors (
    id         BIGINT   NOT NULL AUTO_INCREMENT,
    mentee_id  BIGINT   NOT NULL,
    mentor_id  BIGINT   NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_favorite (mentee_id, mentor_id),
    CONSTRAINT fk_fav_mentee
        FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_fav_mentor
        FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
--  reports — US18
-- ============================================================
CREATE TABLE reports (
    id                BIGINT    NOT NULL AUTO_INCREMENT,
    reporter_id       BIGINT    NOT NULL,
    reported_user_id  BIGINT    NOT NULL,
    category          ENUM(
                          'HARASSMENT',
                          'INAPPROPRIATE_CONTENT',
                          'SPAM',
                          'FAKE_PROFILE',
                          'UNPROFESSIONAL_BEHAVIOUR',
                          'DISCRIMINATION',
                          'OTHER'
                      )         NOT NULL,
    description       TEXT      NOT NULL,
    status            ENUM('PENDING','UNDER_REVIEW','RESOLVED','DISMISSED')
                                NOT NULL DEFAULT 'PENDING',
    admin_note        TEXT      NULL,
    created_at        DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME  NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_reporter_reported (reporter_id, reported_user_id),
    CONSTRAINT fk_reports_reporter
        FOREIGN KEY (reporter_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_reported
        FOREIGN KEY (reported_user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
--  session_notes — US23
--  Mentee progress: personal notes + comma-separated skill tags per session
-- ============================================================
CREATE TABLE session_notes (
    id          BIGINT   NOT NULL AUTO_INCREMENT,
    session_id  BIGINT   NOT NULL,
    mentee_id   BIGINT   NOT NULL,
    notes       TEXT     NULL,
    skills_tags TEXT     NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_session_mentee (session_id, mentee_id),
    CONSTRAINT fk_session_notes_session
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_notes_mentee
        FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ============================================================
--  ██████████  SAMPLE DATA  ██████████
--
--  Users layout:
--    id  1        → Admin
--    id  2–9      → Mentors  (8 mentors across diverse industries)
--    id  10–14    → Mentees  (5 mentees)
-- ============================================================

-- ── 1. USERS ──────────────────────────────────────────────────────
INSERT INTO users (id, full_name, email, password, role, active, email_verified) VALUES
-- Admin (password: Admin@123)
(1,  'Sarthak Admin',    'admin@skillbuilder.com',    'Admin@123', 'ADMIN',  1, 1),

-- Mentors (password: Pass@123)
(2,  'Priya Sharma',     'priya.sharma@mentor.com',   'Pass@123',  'MENTOR', 1, 1),
(3,  'Rahul Mehta',      'rahul.mehta@mentor.com',    'Pass@123',  'MENTOR', 1, 1),
(4,  'Anjali Singh',     'anjali.singh@mentor.com',   'Pass@123',  'MENTOR', 1, 1),
(5,  'Vikram Nair',      'vikram.nair@mentor.com',    'Pass@123',  'MENTOR', 1, 1),
(6,  'Deepika Rao',      'deepika.rao@mentor.com',    'Pass@123',  'MENTOR', 1, 1),
(7,  'Aditya Kulkarni',  'aditya.kulkarni@mentor.com','Pass@123',  'MENTOR', 1, 1),
(8,  'Neha Joshi',       'neha.joshi@mentor.com',     'Pass@123',  'MENTOR', 1, 1),
(9,  'Suresh Pillai',    'suresh.pillai@mentor.com',  'Pass@123',  'MENTOR', 1, 1),

-- Mentees (password: Pass@123)
(10, 'Arjun Patel',      'arjun.patel@mentee.com',   'Pass@123',  'MENTEE', 1, 1),
(11, 'Sneha Reddy',      'sneha.reddy@mentee.com',   'Pass@123',  'MENTEE', 1, 1),
(12, 'Karan Shah',       'karan.shah@mentee.com',    'Pass@123',  'MENTEE', 1, 1),
(13, 'Pooja Iyer',       'pooja.iyer@mentee.com',    'Pass@123',  'MENTEE', 1, 1),
(14, 'Rohan Das',        'rohan.das@mentee.com',     'Pass@123',  'MENTEE', 1, 1);


-- ── 2. MENTOR PROFILES — US01 ─────────────────────────────────────
-- average_rating and total_sessions/reviews are computed values kept in sync with reviews/sessions below
INSERT INTO mentor_profiles
    (id, user_id, headline, company, designation,
     years_of_experience, education, professional_summary,
     average_rating, total_sessions, total_reviews)
VALUES
-- id=1 → user_id=2 : Priya Sharma — Java/Spring Boot (Backend)
(1,  2,
 'Senior Java Architect @ Infosys | 11 Yrs | Spring Boot · Microservices',
 'Infosys', 'Senior Architect', 11,
 'B.Tech Computer Science, IIT Delhi',
 'Led teams building high-throughput banking platforms on Spring Boot microservices. Passionate about clean architecture and mentoring junior developers.',
 4.8, 6, 4),

-- id=2 → user_id=3 : Rahul Mehta — Cloud / DevOps
(2,  3,
 'Cloud Architect @ TCS | AWS Certified | 8 Yrs',
 'TCS', 'Cloud Architect', 8,
 'B.E. Information Technology, BITS Pilani',
 'AWS Certified Solutions Architect with deep expertise in distributed systems, Kubernetes, and CI/CD automation.',
 4.7, 5, 3),

-- id=3 → user_id=4 : Anjali Singh — Frontend (React / Angular)
(3,  4,
 'Frontend Lead @ Accenture | React · Angular · TypeScript | 6 Yrs',
 'Accenture', 'Frontend Lead', 6,
 'B.Tech Computer Science, NIT Trichy',
 'Specialist in React and Angular with a passion for UI/UX excellence and accessibility.',
 4.9, 5, 4),

-- id=4 → user_id=5 : Vikram Nair — Data Science / ML
(4,  5,
 'Senior Data Engineer @ Google | Spark · Kafka · ML | 9 Yrs',
 'Google', 'Senior Data Engineer', 9,
 'M.Tech Data Science, IISc Bangalore',
 'Building petabyte-scale data pipelines using Apache Spark, Kafka, and BigQuery. Also mentor on Python and introductory ML.',
 4.6, 4, 3),

-- id=5 → user_id=6 : Deepika Rao — Cybersecurity
(5,  6,
 'Security Engineer @ Wipro | CISSP | Ethical Hacking | 7 Yrs',
 'Wipro', 'Senior Security Engineer', 7,
 'M.Tech Information Security, BITS Goa',
 'CISSP-certified security professional specialising in penetration testing, SIEM, and secure SDLC practices.',
 4.5, 3, 2),

-- id=6 → user_id=7 : Aditya Kulkarni — Product Management
(6,  7,
 'Product Manager @ Flipkart | 5 Yrs | Agile · Roadmapping',
 'Flipkart', 'Senior Product Manager', 5,
 'MBA, IIM Ahmedabad',
 'Ex-engineer turned product manager. Helping engineers transition into PM roles and master agile product development.',
 4.4, 3, 2),

-- id=7 → user_id=8 : Neha Joshi — Mobile (Android / Flutter)
(7,  8,
 'Android Lead @ Samsung R&D | Flutter · Kotlin | 6 Yrs',
 'Samsung R&D', 'Android Tech Lead', 6,
 'B.Tech Electronics, VJTI Mumbai',
 'Building production-grade Android and Flutter apps. Strong focus on Jetpack Compose, performance optimisation, and app architecture.',
 4.3, 2, 1),

-- id=8 → user_id=9 : Suresh Pillai — DevOps / SRE
(8,  9,
 'SRE @ HCL Tech | Kubernetes · Prometheus · Grafana | 10 Yrs',
 'HCL Tech', 'Principal SRE', 10,
 'B.E. Computer Science, College of Engineering Pune',
 'Site Reliability Engineer with expertise in infrastructure-as-code, observability stacks (Prometheus/Grafana), and large-scale incident management.',
 4.2, 2, 1);


-- ── 3. MENTOR INDUSTRIES — US01, US05 ────────────────────────────
INSERT INTO mentor_industries (mentor_profile_id, industry) VALUES
-- Priya: Java/Backend
(1, 'Technology'), (1, 'FinTech'),
-- Rahul: Cloud
(2, 'Technology'), (2, 'Cloud Computing'),
-- Anjali: Frontend
(3, 'Technology'), (3, 'E-Commerce'),
-- Vikram: Data
(4, 'Technology'), (4, 'Data Science'),
-- Deepika: Security
(5, 'Technology'), (5, 'Cybersecurity'),
-- Aditya: PM
(6, 'Technology'), (6, 'E-Commerce'), (6, 'FinTech'),
-- Neha: Mobile
(7, 'Technology'), (7, 'Mobile Development'),
-- Suresh: DevOps/SRE
(8, 'Technology'), (8, 'Cloud Computing'), (8, 'DevOps');


-- ── 4. WORK EXPERIENCES — US01 ────────────────────────────────────
INSERT INTO work_experiences
    (mentor_profile_id, company_name, job_title, start_date, end_date, current_job, description)
VALUES
-- Priya (mentor_profile_id=1)
(1, 'Infosys',   'Senior Architect',   '2018-01-01', NULL,         1, 'Leading microservices modernisation for 3 major banking clients.'),
(1, 'Wipro',     'Tech Lead',          '2013-06-01', '2017-12-31', 0, 'Built REST APIs for an e-commerce platform serving 5M+ users.'),
-- Rahul (2)
(2, 'TCS',       'Cloud Architect',    '2019-03-01', NULL,         1, 'Architecting multi-cloud solutions on AWS and Azure for BFSI clients.'),
(2, 'HCL',       'DevOps Engineer',    '2015-08-01', '2019-02-28', 0, 'Set up CI/CD pipelines using Jenkins, Docker, and Kubernetes.'),
-- Anjali (3)
(3, 'Accenture', 'Frontend Lead',      '2020-02-01', NULL,         1, 'Leading a team of 8 frontend engineers on React-based digital banking portal.'),
(3, 'Mphasis',   'UI Developer',       '2017-04-01', '2020-01-31', 0, 'Delivered Angular enterprise dashboards for insurance domain.'),
-- Vikram (4)
(4, 'Google',    'Sr. Data Engineer',  '2020-06-01', NULL,         1, 'Building petabyte-scale batch and streaming pipelines with Dataflow and BigQuery.'),
(4, 'Amazon',    'Data Engineer',      '2016-09-01', '2020-05-31', 0, 'ETL pipelines on AWS Glue and Redshift for recommendation systems.'),
-- Deepika (5)
(5, 'Wipro',     'Sr. Security Engr.', '2019-05-01', NULL,         1, 'VAPT and red-team assessments for banking and healthcare clients.'),
(5, 'Tech Mahindra','Security Analyst','2016-07-01', '2019-04-30', 0, 'Implemented SIEM solutions using Splunk and QRadar.'),
-- Aditya (6)
(6, 'Flipkart',  'Sr. Product Manager','2021-01-01', NULL,         1, 'Owns the seller growth product; grew GMV 40% in two quarters.'),
(6, 'Ola',       'Product Manager',    '2018-06-01', '2020-12-31', 0, 'Launched driver incentive product across 50 cities.'),
-- Neha (7)
(7, 'Samsung R&D','Android Tech Lead', '2020-09-01', NULL,         1, 'Leading Android app for Samsung Health with 2M+ DAU.'),
(7, 'Paytm',     'Android Developer',  '2017-05-01', '2020-08-31', 0, 'Built payment flows and UPI integration in Kotlin.'),
-- Suresh (8)
(8, 'HCL Tech',  'Principal SRE',      '2019-04-01', NULL,         1, 'Manages SLOs and error budgets across 30+ microservices.'),
(8, 'Cognizant', 'Systems Engineer',   '2014-02-01', '2019-03-31', 0, 'Administered Linux clusters and built monitoring dashboards in Grafana.');


-- ── 5. MENTOR SKILLS — US04, US06 ────────────────────────────────
-- (up to ~5 skills per mentor so US04 "up to 20 skills" rule is respected in practice)
INSERT INTO mentor_skills (mentor_profile_id, skill_name, category, expertise_level) VALUES
-- Priya (1)
(1, 'Java',            'Backend',      'EXPERT'),
(1, 'Spring Boot',     'Backend',      'EXPERT'),
(1, 'Microservices',   'Architecture', 'EXPERT'),
(1, 'Hibernate',       'Backend',      'EXPERT'),
(1, 'REST APIs',       'Backend',      'EXPERT'),
-- Rahul (2)
(2, 'AWS',             'Cloud',        'EXPERT'),
(2, 'Docker',          'DevOps',       'EXPERT'),
(2, 'Kubernetes',      'DevOps',       'EXPERT'),
(2, 'Terraform',       'DevOps',       'INTERMEDIATE'),
(2, 'Jenkins',         'DevOps',       'EXPERT'),
-- Anjali (3)
(3, 'React',           'Frontend',     'EXPERT'),
(3, 'TypeScript',      'Frontend',     'EXPERT'),
(3, 'Angular',         'Frontend',     'EXPERT'),
(3, 'CSS3',            'Frontend',     'EXPERT'),
(3, 'Redux',           'Frontend',     'INTERMEDIATE'),
-- Vikram (4)
(4, 'Apache Spark',    'Data',         'EXPERT'),
(4, 'Apache Kafka',    'Data',         'EXPERT'),
(4, 'Python',          'Backend',      'EXPERT'),
(4, 'Machine Learning','Data',         'INTERMEDIATE'),
(4, 'BigQuery',        'Data',         'EXPERT'),
-- Deepika (5)
(5, 'Ethical Hacking', 'Security',     'EXPERT'),
(5, 'Penetration Testing','Security',  'EXPERT'),
(5, 'SIEM',            'Security',     'EXPERT'),
(5, 'Network Security','Security',     'EXPERT'),
(5, 'OWASP',           'Security',     'EXPERT'),
-- Aditya (6)
(6, 'Product Management','Management', 'EXPERT'),
(6, 'Agile / Scrum',   'Management',   'EXPERT'),
(6, 'Roadmapping',     'Management',   'EXPERT'),
(6, 'User Research',   'Design',       'INTERMEDIATE'),
(6, 'SQL',             'Backend',      'INTERMEDIATE'),
-- Neha (7)
(7, 'Android',         'Mobile',       'EXPERT'),
(7, 'Kotlin',          'Mobile',       'EXPERT'),
(7, 'Flutter',         'Mobile',       'EXPERT'),
(7, 'Jetpack Compose', 'Mobile',       'EXPERT'),
(7, 'Firebase',        'Backend',      'INTERMEDIATE'),
-- Suresh (8)
(8, 'Kubernetes',      'DevOps',       'EXPERT'),
(8, 'Prometheus',      'DevOps',       'EXPERT'),
(8, 'Grafana',         'DevOps',       'EXPERT'),
(8, 'Linux',           'Infrastructure','EXPERT'),
(8, 'Ansible',         'DevOps',       'INTERMEDIATE');


-- ── 6. AVAILABILITIES — US03, US07 ───────────────────────────────
INSERT INTO availabilities (mentor_profile_id, day_of_week, start_time, end_time, recurring, timezone) VALUES
-- Priya (1)
(1, 'MONDAY',    '18:00:00', '20:00:00', 1, 'IST'),
(1, 'WEDNESDAY', '18:00:00', '20:00:00', 1, 'IST'),
(1, 'SATURDAY',  '10:00:00', '12:00:00', 1, 'IST'),
-- Rahul (2)
(2, 'TUESDAY',   '19:00:00', '21:00:00', 1, 'IST'),
(2, 'THURSDAY',  '19:00:00', '21:00:00', 1, 'IST'),
(2, 'SATURDAY',  '10:00:00', '13:00:00', 1, 'IST'),
-- Anjali (3)
(3, 'THURSDAY',  '18:30:00', '20:30:00', 1, 'IST'),
(3, 'FRIDAY',    '18:30:00', '20:30:00', 1, 'IST'),
(3, 'SUNDAY',    '11:00:00', '13:00:00', 1, 'IST'),
-- Vikram (4)
(4, 'MONDAY',    '20:00:00', '22:00:00', 1, 'IST'),
(4, 'FRIDAY',    '19:00:00', '21:00:00', 1, 'IST'),
-- Deepika (5)
(5, 'WEDNESDAY', '19:00:00', '21:00:00', 1, 'IST'),
(5, 'SATURDAY',  '14:00:00', '16:00:00', 1, 'IST'),
-- Aditya (6)
(6, 'TUESDAY',   '20:00:00', '22:00:00', 1, 'IST'),
(6, 'SATURDAY',  '10:00:00', '12:00:00', 1, 'IST'),
-- Neha (7)
(7, 'WEDNESDAY', '20:00:00', '22:00:00', 1, 'IST'),
(7, 'SUNDAY',    '10:00:00', '12:00:00', 1, 'IST'),
-- Suresh (8)
(8, 'MONDAY',    '19:00:00', '21:00:00', 1, 'IST'),
(8, 'THURSDAY',  '20:00:00', '22:00:00', 1, 'IST');


-- ── 7. MENTEE PROFILES — US02 ─────────────────────────────────────
INSERT INTO mentee_profiles (id, user_id, career_objectives) VALUES
(1, 10, 'Master Spring Boot and microservices to land a backend developer role at a product company within 6 months.'),
(2, 11, 'Transition from manual QA to full-stack development using React and Spring Boot within one year.'),
(3, 12, 'Become an AWS Certified Solutions Architect and move into a cloud engineering role.'),
(4, 13, 'Break into cybersecurity with a focus on penetration testing and security audits.'),
(5, 14, 'Learn Flutter and Android development to build and launch my own mobile app startup.');


-- ── 8. MENTEE INTERESTS — US02, US09 ─────────────────────────────
-- These drive the US09 recommendation algorithm (mentee interest ↔ mentor industry matching)
INSERT INTO mentee_interests (mentee_profile_id, industry_interest) VALUES
-- Arjun (1) — Backend / FinTech
(1, 'Technology'), (1, 'FinTech'),
-- Sneha (2) — Frontend / E-Commerce
(2, 'Technology'), (2, 'E-Commerce'),
-- Karan (3) — Cloud
(3, 'Technology'), (3, 'Cloud Computing'),
-- Pooja (4) — Security
(4, 'Technology'), (4, 'Cybersecurity'),
-- Rohan (5) — Mobile
(5, 'Technology'), (5, 'Mobile Development');


-- ── 9. MENTEE DESIRED SKILLS — US02, US09 ────────────────────────
INSERT INTO mentee_desired_skills (mentee_profile_id, skill_name) VALUES
-- Arjun (1) — matches Priya's skills
(1, 'Java'), (1, 'Spring Boot'), (1, 'Microservices'), (1, 'Hibernate'), (1, 'REST APIs'),
-- Sneha (2) — matches Anjali's skills
(2, 'React'), (2, 'TypeScript'), (2, 'Angular'), (2, 'Spring Boot'),
-- Karan (3) — matches Rahul's skills
(3, 'AWS'), (3, 'Docker'), (3, 'Kubernetes'), (3, 'Terraform'),
-- Pooja (4) — matches Deepika's skills
(4, 'Ethical Hacking'), (4, 'Penetration Testing'), (4, 'OWASP'),
-- Rohan (5) — matches Neha's skills
(5, 'Android'), (5, 'Kotlin'), (5, 'Flutter'), (5, 'Jetpack Compose');


-- ── 10. MENTEE CAREER GOALS — US02 ───────────────────────────────
INSERT INTO mentee_career_goals (mentee_profile_id, goal) VALUES
(1, 'Get backend job-ready'),
(1, 'Crack technical interviews at product companies'),
(1, 'Build and deploy a microservices project on AWS'),
(2, 'Complete career transition to full-stack development'),
(2, 'Build a React + Spring Boot portfolio project'),
(2, 'Pass an online full-stack certification'),
(3, 'Earn AWS Certified Solutions Architect – Associate'),
(3, 'Set up a personal cloud lab on AWS'),
(4, 'Earn CEH (Certified Ethical Hacker) certification'),
(4, 'Complete a bug bounty on HackerOne'),
(5, 'Launch a Flutter app on Google Play Store'),
(5, 'Learn Jetpack Compose for Android');


-- ── 11. SESSIONS — US10–US14 ──────────────────────────────────────
-- Status distribution:
--   COMPLETED  × 14  (enables reviews, session notes, analytics — US15/US20/US21/US22/US23)
--   CONFIRMED  × 5   (upcoming — US07 calendar, US12 reschedule)
--   PENDING    × 4   (US11 accept/reject demo)
--   CANCELLED  × 2   (US13 demo)
--   REJECTED   × 2   (US11 rejection reason demo)
--   RESCHEDULED× 1   (US12 demo)

INSERT INTO sessions
    (id, mentor_id, mentee_id, scheduled_at, duration_minutes, agenda, status, rejection_reason, meeting_link, created_at)
VALUES
-- ── Arjun (10) + Priya (2) ────────────────────────────────────────
-- Session 1: COMPLETED — Spring Boot fundamentals
(1,  2, 10, DATE_ADD(NOW(), INTERVAL -28 DAY), 60,
 'Spring Boot project setup, auto-configuration, and dependency injection',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1001', DATE_ADD(NOW(), INTERVAL -29 DAY)),
-- Session 2: COMPLETED — Hibernate & JPA
(2,  2, 10, DATE_ADD(NOW(), INTERVAL -21 DAY), 60,
 'Hibernate ORM mapping, lazy vs eager loading, JPA repositories',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1002', DATE_ADD(NOW(), INTERVAL -22 DAY)),
-- Session 3: COMPLETED — REST API design
(3,  2, 10, DATE_ADD(NOW(), INTERVAL -14 DAY), 60,
 'REST API best practices, exception handling, and Swagger documentation',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1003', DATE_ADD(NOW(), INTERVAL -15 DAY)),
-- Session 4: COMPLETED — Spring Security
(4,  2, 10, DATE_ADD(NOW(), INTERVAL -7  DAY), 60,
 'Spring Security architecture, session-based auth, and role-based access control',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1004', DATE_ADD(NOW(), INTERVAL -8  DAY)),
-- Session 5: CONFIRMED upcoming
(5,  2, 10, DATE_ADD(NOW(), INTERVAL  4  DAY), 60,
 'Microservices inter-service communication and Spring Cloud Consul',
 'CONFIRMED', NULL, 'https://meet.google.com/abc-1005', NOW()),
-- Session 6: PENDING (US11 demo)
(6,  2, 10, DATE_ADD(NOW(), INTERVAL 11  DAY), 45,
 'AOP logging and performance monitoring patterns',
 'PENDING', NULL, NULL, NOW()),

-- ── Sneha (11) + Anjali (4) ───────────────────────────────────────
-- Session 7: COMPLETED — React hooks
(7,  4, 11, DATE_ADD(NOW(), INTERVAL -25 DAY), 60,
 'React hooks deep dive: useState, useEffect, useCallback, useMemo',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1007', DATE_ADD(NOW(), INTERVAL -26 DAY)),
-- Session 8: COMPLETED — TypeScript
(8,  4, 11, DATE_ADD(NOW(), INTERVAL -18 DAY), 45,
 'TypeScript advanced patterns: generics, utility types, and decorators',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1008', DATE_ADD(NOW(), INTERVAL -19 DAY)),
-- Session 9: COMPLETED — Angular intro
(9,  4, 11, DATE_ADD(NOW(), INTERVAL -11 DAY), 60,
 'Angular fundamentals: modules, components, services, and RxJS basics',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1009', DATE_ADD(NOW(), INTERVAL -12 DAY)),
-- Session 10: CONFIRMED upcoming
(10, 4, 11, DATE_ADD(NOW(), INTERVAL  6  DAY), 60,
 'Redux state management in a React application',
 'CONFIRMED', NULL, 'https://meet.google.com/abc-1010', NOW()),
-- Session 11: REJECTED (US11 demo — outside expertise)
(11, 2, 11, DATE_ADD(NOW(), INTERVAL  2  DAY), 30,
 'Backend basics for a frontend developer',
 'REJECTED', 'This topic falls outside my current mentoring focus area.', NULL, NOW()),

-- ── Karan (12) + Rahul (3) ────────────────────────────────────────
-- Session 12: COMPLETED — AWS core
(12, 3, 12, DATE_ADD(NOW(), INTERVAL -22 DAY), 60,
 'AWS core services: EC2, S3, IAM, VPC fundamentals',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1012', DATE_ADD(NOW(), INTERVAL -23 DAY)),
-- Session 13: COMPLETED — Docker
(13, 3, 12, DATE_ADD(NOW(), INTERVAL -15 DAY), 60,
 'Docker fundamentals: images, containers, volumes, and networking',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1013', DATE_ADD(NOW(), INTERVAL -16 DAY)),
-- Session 14: COMPLETED — Kubernetes basics
(14, 3, 12, DATE_ADD(NOW(), INTERVAL -8  DAY), 60,
 'Kubernetes: pods, deployments, services, and configmaps',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1014', DATE_ADD(NOW(), INTERVAL -9  DAY)),
-- Session 15: CONFIRMED upcoming
(15, 3, 12, DATE_ADD(NOW(), INTERVAL  5  DAY), 60,
 'Terraform infrastructure-as-code basics on AWS',
 'CONFIRMED', NULL, 'https://meet.google.com/abc-1015', NOW()),
-- Session 16: PENDING (US11 demo)
(16, 3, 12, DATE_ADD(NOW(), INTERVAL 12  DAY), 60,
 'Jenkins CI/CD pipeline for a Spring Boot project',
 'PENDING', NULL, NULL, NOW()),

-- ── Pooja (13) + Deepika (6) ──────────────────────────────────────
-- Session 17: COMPLETED — OWASP Top 10
(17, 6, 13, DATE_ADD(NOW(), INTERVAL -20 DAY), 60,
 'OWASP Top 10 vulnerabilities and hands-on exploitation examples',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1017', DATE_ADD(NOW(), INTERVAL -21 DAY)),
-- Session 18: COMPLETED — Penetration testing basics
(18, 6, 13, DATE_ADD(NOW(), INTERVAL -10 DAY), 60,
 'Penetration testing methodology: reconnaissance, scanning, exploitation',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1018', DATE_ADD(NOW(), INTERVAL -11 DAY)),
-- Session 19: CANCELLED by mentee >24h before (US13 demo)
(19, 6, 13, DATE_ADD(NOW(), INTERVAL -3  DAY), 60,
 'SIEM and log analysis with Splunk',
 'CANCELLED', NULL, NULL, DATE_ADD(NOW(), INTERVAL -5  DAY)),
-- Session 20: CONFIRMED upcoming
(20, 6, 13, DATE_ADD(NOW(), INTERVAL  7  DAY), 60,
 'Network security fundamentals and firewall rules',
 'CONFIRMED', NULL, 'https://meet.google.com/abc-1020', NOW()),

-- ── Rohan (14) + Neha (8) ─────────────────────────────────────────
-- Session 21: COMPLETED — Kotlin basics
(21, 8, 14, DATE_ADD(NOW(), INTERVAL -18 DAY), 60,
 'Kotlin fundamentals: null safety, coroutines, data classes, extension functions',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1021', DATE_ADD(NOW(), INTERVAL -19 DAY)),
-- Session 22: COMPLETED — Flutter intro
(22, 8, 14, DATE_ADD(NOW(), INTERVAL -9  DAY), 60,
 'Flutter widget tree, StatefulWidget vs StatelessWidget, navigation',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1022', DATE_ADD(NOW(), INTERVAL -10 DAY)),
-- Session 23: CONFIRMED upcoming
(23, 8, 14, DATE_ADD(NOW(), INTERVAL  8  DAY), 60,
 'Jetpack Compose: composable functions, state hoisting, and theming',
 'CONFIRMED', NULL, 'https://meet.google.com/abc-1023', NOW()),

-- ── Cross-mentor sessions (enrich analytics data — US20/US22) ─────
-- Session 24: Arjun + Vikram: COMPLETED — ML intro
(24, 5, 10, DATE_ADD(NOW(), INTERVAL -10 DAY), 60,
 'Introduction to Machine Learning: supervised vs unsupervised, scikit-learn',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1024', DATE_ADD(NOW(), INTERVAL -11 DAY)),
-- Session 25: Karan + Suresh (9): COMPLETED — Prometheus/Grafana
(25, 9, 12, DATE_ADD(NOW(), INTERVAL -6  DAY), 60,
 'Prometheus metrics, Grafana dashboards, and alerting rules',
 'COMPLETED', NULL, 'https://meet.google.com/abc-1025', DATE_ADD(NOW(), INTERVAL -7  DAY)),
-- Session 26: Sneha + Aditya (7): PENDING — PM basics
(26, 7, 11, DATE_ADD(NOW(), INTERVAL  9  DAY), 45,
 'Understanding product management for engineers',
 'PENDING', NULL, NULL, NOW()),
-- Session 27: Arjun + Priya: CANCELLED (US13 demo — mentee cancelled)
(27, 2, 10, DATE_ADD(NOW(), INTERVAL -1  DAY), 60,
 'Design patterns in Java',
 'CANCELLED', NULL, NULL, DATE_ADD(NOW(), INTERVAL -3  DAY)),
-- Session 28: Sneha + Anjali: RESCHEDULED (US12 demo — original time changed)
(28, 4, 11, DATE_ADD(NOW(), INTERVAL  3  DAY), 60,
 'CSS Grid and Flexbox advanced layouts',
 'RESCHEDULED', NULL, 'https://meet.google.com/abc-1028', DATE_ADD(NOW(), INTERVAL -1  DAY)),
-- Session 29: Rohan + Neha: REJECTED (scheduling conflict)
(29, 8, 14, DATE_ADD(NOW(), INTERVAL  5  DAY), 60,
 'Firebase Firestore integration in Flutter',
 'REJECTED', 'Scheduling conflict — please rebook for next week.', NULL, NOW());


-- ── 12. REVIEWS — US15, US16, US17, US19 ─────────────────────────
-- Reviews only exist for COMPLETED sessions.
-- mentor_response = NULL means mentor hasn't responded yet (US19 pending action).
INSERT INTO reviews
    (session_id, mentee_id, mentor_id, rating, comment, mentor_response, anonymous, created_at)
VALUES
-- Arjun reviews Priya — session 1 (5★, mentor responded)
(1,  10, 2, 5,
 'Spring Boot clicked completely in one session. Priya explains auto-configuration better than any tutorial I have watched.',
 'Thank you Arjun! Make sure to practice creating your own @Configuration classes before next session.',
 0, DATE_ADD(NOW(), INTERVAL -27 DAY)),

-- Arjun reviews Priya — session 2 (5★, mentor responded)
(2,  10, 2, 5,
 'Hibernate session was brilliant. The lazy vs eager loading explanation with a live N+1 demo was very insightful.',
 'Great progress! Build a small Spring Data project this week — hands-on practice is the fastest way to solidify ORM concepts.',
 0, DATE_ADD(NOW(), INTERVAL -20 DAY)),

-- Arjun reviews Priya — session 3 (5★, no mentor response yet — US19 pending)
(3,  10, 2, 5,
 'REST API session was very practical. Exception handling with @ControllerAdvice and Swagger setup covered end-to-end.',
 NULL,
 0, DATE_ADD(NOW(), INTERVAL -13 DAY)),

-- Arjun reviews Priya — session 4 (4★, anonymous — US15 skip option, US17 anonymous)
(4,  10, 2, 4,
 'Spring Security session was good but a bit rushed. Would have liked more time on method-level security.',
 'Noted — will cover @PreAuthorize and @PostFilter in detail next time. Thanks for the honest feedback.',
 1, DATE_ADD(NOW(), INTERVAL -6  DAY)),

-- Sneha reviews Anjali — session 7 (5★, mentor responded)
(7,  11, 4, 5,
 'Anjali is the best React teacher I have had. useState, useEffect, and useCallback finally make sense together.',
 'So glad it clicked! Your assignment: build a small todo app using all three hooks before next session.',
 0, DATE_ADD(NOW(), INTERVAL -24 DAY)),

-- Sneha reviews Anjali — session 8 (4★, anonymous)
(8,  11, 4, 4,
 'TypeScript session was very solid. Generics explanation was clear, though decorators section felt a bit rushed.',
 NULL,
 1, DATE_ADD(NOW(), INTERVAL -17 DAY)),

-- Sneha reviews Anjali — session 9 (5★, mentor responded)
(9,  11, 4, 5,
 'Angular fundamentals covered brilliantly. The side-by-side comparison with React made the differences very easy to understand.',
 'Excellent engagement Sneha! Start building a simple Angular CRUD app this week — it will cement everything.',
 0, DATE_ADD(NOW(), INTERVAL -10 DAY)),

-- Karan reviews Rahul — session 12 (5★, mentor responded)
(12, 12, 3, 5,
 'Rahul has unbelievable depth on AWS. EC2, S3, and IAM concepts are crystal clear now. Highly recommend.',
 'Great to hear Karan! Install AWS CLI and try spinning up an EC2 instance manually before our Docker session.',
 0, DATE_ADD(NOW(), INTERVAL -21 DAY)),

-- Karan reviews Rahul — session 13 (5★, no mentor response yet)
(13, 12, 3, 5,
 'Docker session was hands-on and practical. Built and ran a containerised Spring Boot app during the session itself.',
 NULL,
 0, DATE_ADD(NOW(), INTERVAL -14 DAY)),

-- Karan reviews Rahul — session 14 (4★, mentor responded)
(14, 12, 3, 4,
 'Kubernetes session was good. Covered pods and deployments well. StatefulSets and Helm were not covered — hoping next session.',
 'Valid point — I will add Helm and StatefulSets to the Terraform session agenda. Thanks for flagging.',
 0, DATE_ADD(NOW(), INTERVAL -7  DAY)),

-- Pooja reviews Deepika — session 17 (5★, mentor responded)
(17, 13, 6, 5,
 'Deepika walked through all OWASP Top 10 with live examples in Burp Suite. This is the best security session I have attended.',
 'Thank you Pooja! Set up a local DVWA lab this week for hands-on practice — link shared in email.',
 0, DATE_ADD(NOW(), INTERVAL -19 DAY)),

-- Pooja reviews Deepika — session 18 (4★, no mentor response yet — US19 demo)
(18, 13, 6, 4,
 'Pen testing methodology was clear. Could have used more time on the exploitation phase with Metasploit.',
 NULL,
 0, DATE_ADD(NOW(), INTERVAL -9  DAY)),

-- Rohan reviews Neha — session 21 (5★, mentor responded)
(21, 14, 8, 5,
 'Neha is an amazing Kotlin teacher. Coroutines and null safety explained in a way I had never seen before.',
 'Great work Rohan! Practice coroutines with a small async API call app this week.',
 0, DATE_ADD(NOW(), INTERVAL -17 DAY)),

-- Rohan reviews Neha — session 22 (4★, no mentor response yet)
(22, 14, 8, 4,
 'Flutter session was good. Widget tree and navigation covered well. State management felt a bit rushed toward the end.',
 NULL,
 0, DATE_ADD(NOW(), INTERVAL -8  DAY)),

-- Arjun reviews Vikram — session 24 (5★, mentor responded)
(24, 10, 5, 5,
 'Vikram introduced ML concepts in a way that makes them approachable for a backend developer. Excellent session.',
 'Great attitude Arjun! Try a simple linear regression on a Kaggle dataset as a starter exercise.',
 0, DATE_ADD(NOW(), INTERVAL -9  DAY)),

-- Karan reviews Suresh — session 25 (4★, no mentor response yet)
(25, 12, 9, 4,
 'Prometheus and Grafana setup was very practical. Would have loved to cover alertmanager config in more depth.',
 NULL,
 0, DATE_ADD(NOW(), INTERVAL -5  DAY));


-- ── 13. FAVOURITE MENTORS — US08 ──────────────────────────────────
-- Each mentee has 2–3 saved favourites; overlaps demonstrate "multiple mentees saving same mentor"
INSERT INTO favorite_mentors (mentee_id, mentor_id) VALUES
-- Arjun's favourites: Priya (primary), Vikram
(10, 2), (10, 5),
-- Sneha's favourites: Anjali (primary), Priya, Aditya
(11, 4), (11, 2), (11, 7),
-- Karan's favourites: Rahul (primary), Suresh
(12, 3), (12, 9),
-- Pooja's favourites: Deepika (primary)
(13, 6),
-- Rohan's favourites: Neha (primary), Aditya
(14, 8), (14, 7);


-- ── 14. REPORTS — US18 ────────────────────────────────────────────
-- Cover all 4 statuses: PENDING, UNDER_REVIEW, RESOLVED, DISMISSED
-- Note: unique constraint (reporter_id, reported_user_id) means one report per pair
INSERT INTO reports
    (reporter_id, reported_user_id, category, description, status, admin_note)
VALUES
-- Sneha reports Priya — PENDING
(11, 2,
 'UNPROFESSIONAL_BEHAVIOUR',
 'Mentor was 25 minutes late to the session without prior notice and did not follow up on promised reading materials.',
 'PENDING', NULL),

-- Karan reports Rahul — UNDER_REVIEW
(12, 3,
 'SPAM',
 'Mentor repeatedly messaged me outside the platform asking for direct payment via UPI, which felt inappropriate.',
 'UNDER_REVIEW', 'Admin has reached out to both parties. Investigating payment solicitation claim.'),

-- Rohan reports Neha — RESOLVED
(14, 8,
 'INAPPROPRIATE_CONTENT',
 'Mentor shared an external paid course link during the free session and pressured me to purchase it.',
 'RESOLVED', 'Mentor counselled on platform guidelines. No further action required — first-time offence.'),

-- Pooja reports an inactive user — DISMISSED (false report)
(13, 7,
 'FAKE_PROFILE',
 'I believe this mentor profile is using stock photos and may not be a real person.',
 'DISMISSED', 'Admin verified profile via LinkedIn and company email. Report dismissed — profile is genuine.');


-- ── 15. SESSION NOTES — US23 ──────────────────────────────────────
-- Personal mentee notes with skills_tags; covers all completed sessions with meaningful content
INSERT INTO session_notes (session_id, mentee_id, notes, skills_tags) VALUES
-- Arjun — session 1 (Spring Boot fundamentals)
(1,  10,
 'Covered: Spring Boot auto-configuration magic, @SpringBootApplication, @ComponentScan, and dependency injection via @Autowired. Key insight: @Autowired on constructors is preferred over field injection for testability. TODO: practice creating custom @Bean methods in a @Configuration class.',
 'Spring Boot,Java,Dependency Injection'),

-- Arjun — session 2 (Hibernate)
(2,  10,
 'Topics: JPA entity mapping with @Entity/@Table, relationship annotations @OneToMany/@ManyToOne, FetchType.LAZY vs EAGER, CascadeType options, JpaRepository vs CrudRepository. Key insight: always use LAZY to avoid N+1 — use @EntityGraph or JOIN FETCH in JPQL when eager load is genuinely needed.',
 'Hibernate,Java,Spring Boot,JPA'),

-- Arjun — session 3 (REST API)
(3,  10,
 'Covered: REST design principles, @RestController, @RequestMapping, @PathVariable/@RequestParam, ResponseEntity, and @ControllerAdvice for centralised exception handling. Also set up Swagger/OpenAPI 3 with springdoc-openapi. TODO: add bean validation (@Valid, @NotBlank) to all DTOs.',
 'REST APIs,Spring Boot,Swagger,Java'),

-- Arjun — session 4 (Spring Security)
(4,  10,
 'Spring Security filter chain, session-based authentication, UserDetailsService implementation, BCrypt password encoding, and @PreAuthorize for method-level security. Key gap: need to revisit @PostFilter for collection filtering. TODO: implement a small RBAC demo app.',
 'Spring Security,Java,Spring Boot'),

-- Arjun — session 24 (ML intro with Vikram)
(24, 10,
 'ML intro: supervised (regression, classification) vs unsupervised (clustering, PCA). Python sklearn pipeline for a simple linear regression on the Boston Housing dataset. Key takeaway: feature scaling matters — always StandardScaler before model fitting. TODO: Kaggle titanic challenge.',
 'Machine Learning,Python,Data Science'),

-- Sneha — session 7 (React hooks)
(7,  11,
 'React hooks deep dive: useState for local state, useEffect for side effects with cleanup, useCallback for memoising callbacks to prevent child re-renders, useMemo for expensive computations. Common mistake: forgetting dependency array in useEffect causing infinite loops. TODO: build a todo app using all three.',
 'React,TypeScript,JavaScript'),

-- Sneha — session 8 (TypeScript)
(8,  11,
 'TypeScript: interfaces vs type aliases, generics <T>, utility types (Partial, Required, Readonly, Pick, Omit). Decorators skipped — will revisit in Angular session. Key insight: use unknown instead of any for truly unknown types. TODO: rewrite a plain JS function library in TypeScript with generics.',
 'TypeScript,React,Frontend'),

-- Sneha — session 9 (Angular)
(9,  11,
 'Angular architecture: NgModules, Components with @Input/@Output, Services with DI via @Injectable, and RxJS fundamentals (Observable, Subject, BehaviorSubject). Compared with React: Angular is opinionated, React is flexible. TODO: build a simple Angular CRUD app with a mock HTTP service using HttpClientModule.',
 'Angular,TypeScript,RxJS,Frontend'),

-- Karan — session 12 (AWS core)
(12, 12,
 'AWS fundamentals: EC2 (instance types, key pairs, security groups, user data scripts), S3 (buckets, policies, static hosting), IAM (users, groups, roles, policies — least privilege principle), and VPC basics. Key insight: never use root account credentials for application access — always create IAM roles. TODO: AWS CLI setup + launch an EC2 t2.micro.',
 'AWS,Cloud,IAM,EC2'),

-- Karan — session 13 (Docker)
(13, 12,
 'Docker: image vs container, Dockerfile (FROM, RUN, COPY, EXPOSE, CMD), multi-stage builds to reduce image size, volumes for persistent storage, networking (bridge, host), and docker-compose for multi-container setups. Containerised a Spring Boot app live. TODO: push image to Docker Hub and pull on a fresh EC2 instance.',
 'Docker,DevOps,Spring Boot'),

-- Karan — session 14 (Kubernetes)
(14, 12,
 'Kubernetes: control plane vs worker nodes, Pod, ReplicaSet, Deployment (rolling update strategy), Service (ClusterIP, NodePort, LoadBalancer), ConfigMap, and Secrets. Applied manifests to a local Minikube cluster. Gap: Helm charts and StatefulSets not covered — scheduled for next session. TODO: deploy containerised app on Minikube.',
 'Kubernetes,DevOps,Cloud'),

-- Karan — session 25 (Prometheus/Grafana with Suresh)
(25, 12,
 'Observability stack: Prometheus metrics model (counters, gauges, histograms, summaries), PromQL basics, scrape configs, and setting up a Grafana dashboard. Key insight: instrument your Spring Boot app with micrometer-registry-prometheus for out-of-the-box /actuator/prometheus endpoint. TODO: add alertmanager for Slack notifications.',
 'Prometheus,Grafana,DevOps,Kubernetes'),

-- Pooja — session 17 (OWASP)
(17, 13,
 'OWASP Top 10: injection (SQL/Command), broken authentication, XSS (stored/reflected/DOM), IDOR, security misconfiguration. Live demos in Burp Suite and DVWA. Key insight: parameterised queries are the only reliable defence against SQL injection — ORMs help but are not foolproof. TODO: set up local DVWA in Docker.',
 'OWASP,Security,Penetration Testing,Burp Suite'),

-- Pooja — session 18 (Pen testing methodology)
(18, 13,
 'Pen testing phases: reconnaissance (passive/active), scanning (Nmap, Nessus), exploitation (Metasploit framework basics), post-exploitation, and reporting. Key gap: Metasploit exploitation phase covered at surface level only — need deeper practice. TODO: complete TryHackMe "OWASP Top 10" room.',
 'Penetration Testing,Security,Metasploit,Nmap'),

-- Rohan — session 21 (Kotlin)
(21, 14,
 'Kotlin: null safety (?, !!, let/run/apply/also), data classes, sealed classes, coroutines (suspend functions, CoroutineScope, Dispatchers), and extension functions. Key insight: coroutines replace RxJava for async in modern Android — Dispatchers.IO for network, Dispatchers.Main for UI updates. TODO: build a simple async API call app with Retrofit + coroutines.',
 'Kotlin,Android,Coroutines'),

-- Rohan — session 22 (Flutter)
(22, 14,
 'Flutter: Widget tree (MaterialApp → Scaffold), StatelessWidget vs StatefulWidget, setState() lifecycle, Navigator 2.0 for routing, and basic animations. State management not covered in depth — Riverpod recommended for next session. TODO: build a simple 3-screen Flutter app with bottom navigation.',
 'Flutter,Dart,Mobile Development');


-- ============================================================
--  VERIFY ROW COUNTS
-- ============================================================
SELECT 'users'                AS tbl, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'mentor_profiles',  COUNT(*) FROM mentor_profiles
UNION ALL SELECT 'mentor_industries',COUNT(*) FROM mentor_industries
UNION ALL SELECT 'work_experiences', COUNT(*) FROM work_experiences
UNION ALL SELECT 'mentor_skills',    COUNT(*) FROM mentor_skills
UNION ALL SELECT 'availabilities',   COUNT(*) FROM availabilities
UNION ALL SELECT 'mentee_profiles',  COUNT(*) FROM mentee_profiles
UNION ALL SELECT 'mentee_interests', COUNT(*) FROM mentee_interests
UNION ALL SELECT 'mentee_desired_skills', COUNT(*) FROM mentee_desired_skills
UNION ALL SELECT 'mentee_career_goals',   COUNT(*) FROM mentee_career_goals
UNION ALL SELECT 'sessions',         COUNT(*) FROM sessions
UNION ALL SELECT 'reviews',          COUNT(*) FROM reviews
UNION ALL SELECT 'favorite_mentors', COUNT(*) FROM favorite_mentors
UNION ALL SELECT 'reports',          COUNT(*) FROM reports
UNION ALL SELECT 'session_notes',    COUNT(*) FROM session_notes;