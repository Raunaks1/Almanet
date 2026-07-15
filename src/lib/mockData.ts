export type UserType = 'alumni' | 'student' | 'admin';

export interface MockEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  registeredCount: number;
}

export const mockEvents: MockEvent[] = [
  {
    id: '1',
    title: 'Annual Tech Symposium 2026',
    date: 'August 15, 2026 • 10:00 AM',
    location: 'Main Auditorium, Engineering College',
    description: 'Join us for our biggest tech event of the year featuring keynote speakers from top FAANG companies and exciting startup pitches.',
    registeredCount: 142
  },
  {
    id: '2',
    title: 'Alumni Networking Mixer',
    date: 'September 5, 2026 • 6:00 PM',
    location: 'Grand Hotel, City Center',
    description: 'An exclusive networking evening for all verified alumni and final-year students. Great opportunity to connect and find mentors.',
    registeredCount: 85
  }
];

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  user_type: 'alumni' | 'student' | 'admin';
  college?: string;
  degree?: string;
  branch?: string;
  graduation_year?: number;
  industry?: string;
  location?: string;
  skills: string[];
  is_verified: boolean; // Deprecated, use verification_status
  verification_status: 'pending' | 'approved' | 'rejected';
  bio?: string;
}

export const mockUsers: UserProfile[] = [
  {
    id: '1',
    email: 'jane.doe@example.com',
    full_name: 'Jane Doe',
    user_type: 'alumni',
    college: 'Engineering College',
    degree: 'B.Tech',
    branch: 'Computer Science',
    graduation_year: 2018,
    industry: 'Software Engineering',
    location: 'Bangalore, India',
    skills: ['React', 'Node.js', 'System Design', 'Mentor'],
    is_verified: true,
    verification_status: 'approved',
    bio: 'Senior SDE at TechCorp. Passionate about helping juniors transition into tech.'
  },
  {
    id: '2',
    email: 'john.smith@example.com',
    full_name: 'John Smith',
    user_type: 'student',
    college: 'Engineering College',
    degree: 'B.Tech',
    branch: 'Computer Science',
    graduation_year: 2025,
    industry: '',
    location: 'Mumbai, India',
    skills: ['React', 'TypeScript'],
    is_verified: false,
    verification_status: 'pending',
    bio: 'Final year CS student looking for roles.'
  },
  {
    id: '3',
    email: 'admin@college.edu',
    full_name: 'Dr. College Admin',
    user_type: 'admin',
    college: 'Engineering College',
    skills: ['Administration'],
    is_verified: true,
    verification_status: 'approved',
    bio: 'Official College Administrator.'
  },
  {
    id: '4',
    email: 'vikram.s@example.com',
    full_name: 'Vikram Singh',
    user_type: 'alumni',
    college: 'Engineering College',
    degree: 'B.Tech',
    branch: 'Mechanical',
    graduation_year: 2020,
    industry: 'Automotive',
    location: 'Pune, India',
    skills: ['CAD', 'Design'],
    is_verified: false,
    verification_status: 'pending',
    bio: 'Working in auto design.'
  }
];

export const industries = Array.from(new Set(mockUsers.filter(u => u.industry).map(u => u.industry as string)));
export const locations = Array.from(new Set(mockUsers.filter(u => u.location).map(u => u.location as string)));
export const years = Array.from(new Set(mockUsers.filter(u => u.graduation_year).map(u => u.graduation_year as number))).sort((a, b) => b - a);

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  category: string;
  createdAt: string;
  repliesCount: number;
}

export const mockForumPosts: ForumPost[] = [
  {
    id: '1',
    title: 'Tips for passing the AWS Solutions Architect exam?',
    content: 'Hi everyone, I am planning to take the AWS SAA exam next month. Any tips or resources you recommend?',
    authorId: '4', // Vikram
    category: 'Technical Help',
    createdAt: '2 hours ago',
    repliesCount: 5
  },
  {
    id: '2',
    title: 'Hiring for a Junior Product Manager in Mumbai',
    content: 'My team at InnovateCorp is expanding! We are looking for fresh graduates with a passion for EdTech.',
    authorId: '3', // Anita
    category: 'Career Advice',
    createdAt: '1 day ago',
    repliesCount: 12
  },
  {
    id: '3',
    title: 'Upcoming Alumni Meetup in Bangalore',
    content: 'Let us gather at the UB City next Friday evening. Please RSVP!',
    authorId: '1', // Jane
    category: 'General',
    createdAt: '3 days ago',
    repliesCount: 20
  }
];

export const forumCategories = ['General', 'Career Advice', 'Technical Help', 'Campus News'];

export interface JobPost {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
  salary?: string;
  postedBy: string; // Author ID
  createdAt: string;
  tags: string[];
}

export const mockJobs: JobPost[] = [
  {
    id: 'j1',
    title: 'Frontend Engineer (React)',
    company: 'TechFlow Solutions',
    location: 'Remote (India)',
    type: 'Full-time',
    salary: '₹12L - ₹18L',
    postedBy: '1', // Jane
    createdAt: '2 days ago',
    tags: ['React', 'TypeScript', 'Frontend']
  },
  {
    id: 'j2',
    title: 'Product Management Intern',
    company: 'InnovateCorp',
    location: 'Mumbai, MH',
    type: 'Internship',
    salary: '₹25k / month',
    postedBy: '3', // Anita
    createdAt: '5 hours ago',
    tags: ['Product', 'Agile', 'Internship']
  },
  {
    id: 'j3',
    title: 'Senior DevOps Engineer',
    company: 'CloudScale Inc',
    location: 'Bangalore, KA',
    type: 'Full-time',
    salary: '₹30L - ₹45L',
    postedBy: '4', // Vikram
    createdAt: '1 week ago',
    tags: ['AWS', 'Kubernetes', 'CI/CD']
  }
];

