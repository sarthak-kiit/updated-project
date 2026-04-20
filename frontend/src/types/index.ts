// ── Auth types ─────────────────────────────────────────────────────
export interface AuthResponse {
  email: string;
  fullName: string;
  role: string;
  userId: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

// ── User (stored in AuthContext) ───────────────────────────────────
export interface User {
  userId: number;
  fullName: string;
  email: string;
  role: 'MENTOR' | 'MENTEE' | 'ADMIN';
}

// ── Mentor profile sub-types ───────────────────────────────────────
export interface SkillDTO {
  id?: number;
  skillName: string;
  category?: string;
  expertiseLevel: string;
}

export interface WorkExperienceDTO {
  id?: number;
  companyName: string;
  jobTitle: string;
  startDate?: string;
  endDate?: string;
  currentJob: boolean;
  description?: string;
}

export interface AvailabilityDTO {
  id?: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  recurring: boolean;
  timezone: string;
}

// ── MentorProfile ──────────────────────────────────────────────────
export interface MentorProfile {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  profileImageUrl?: string;
  headline?: string;
  company?: string;
  designation?: string;
  yearsOfExperience?: number;
  education?: string;
  professionalSummary?: string;
  averageRating: number;
  totalSessions: number;
  totalReviews: number;
  industries: string[];
  skills: SkillDTO[];
  workExperiences: WorkExperienceDTO[];
  availabilities: AvailabilityDTO[];
}

// ── MenteeProfile ──────────────────────────────────────────────────
export interface MenteeProfile {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  careerObjectives?: string;
  interests: string[];
  desiredSkills: string[];
  careerGoals: string[];
}

// ── Session ────────────────────────────────────────────────────────
export interface SessionDTO {
  id: number;
  mentorId: number;
  mentorName: string;
  menteeId: number;
  menteeName: string;
  scheduledAt: string;
  durationMinutes: number;
  agenda?: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface SessionRequest {
  mentorId: number;
  scheduledAt: string;
  durationMinutes: number;
  agenda?: string;
}

// ── Review ─────────────────────────────────────────────────────────
export interface ReviewDTO {
  id: number;
  mentorId: number;
  menteeName: string;
  rating: number;
  comment?: string;
  mentorResponse?: string;
  anonymous: boolean;
  createdAt: string;
}

// ── Session Note — US23 Progress Tracking ─────────────────────────
export interface SessionNoteDTO {
  id: number;
  sessionId: number;
  mentorName: string;
  sessionDate: string;
  durationMinutes: number;
  agenda?: string;
  notes?: string;
  skillsTags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionNoteRequest {
  sessionId: number;
  notes?: string;
  skillsTags: string[];
}
