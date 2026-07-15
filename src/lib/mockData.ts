export type UserType = 'alumni' | 'student' | 'admin';

export interface UserProfile {
  id: string;
  full_name: string;
  user_type: UserType;
  email: string;
  graduation_year?: number;
  industry?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  is_verified: boolean;
  skills: string[];
}

export const mockUsers: UserProfile[] = [
  {
    id: '1',
    full_name: 'Dr. Jane Smith',
    user_type: 'alumni',
    email: 'jane.smith@example.com',
    graduation_year: 2015,
    industry: 'Software Engineering',
    location: 'Bangalore, India',
    bio: 'Senior Staff Engineer at Google. Passionate about distributed systems and mentoring young talent from my alma mater.',
    is_verified: true,
    skills: ['System Design', 'Go', 'Kubernetes', 'Mentorship']
  },
  {
    id: '2',
    full_name: 'Rahul Sharma',
    user_type: 'alumni',
    email: 'rahul.s@example.com',
    graduation_year: 2020,
    industry: 'Data Science',
    location: 'Pune, India',
    bio: 'Data Scientist at an exciting fintech startup. Always looking to connect with fellow data enthusiasts.',
    is_verified: true,
    skills: ['Python', 'Machine Learning', 'SQL']
  },
  {
    id: '3',
    full_name: 'Anita Desai',
    user_type: 'alumni',
    email: 'anita.d@example.com',
    graduation_year: 2012,
    industry: 'Product Management',
    location: 'Mumbai, India',
    bio: 'VP of Product at InnovateCorp. Helping shape the future of EdTech.',
    is_verified: true,
    skills: ['Product Strategy', 'Agile', 'Leadership']
  },
  {
    id: '4',
    full_name: 'Vikram Singh',
    user_type: 'student',
    email: 'vikram.s@example.com',
    graduation_year: 2025,
    industry: 'Software Engineering',
    location: 'Jaipur, India',
    bio: 'Final year CS student looking for guidance in backend development and cloud architecture.',
    is_verified: false,
    skills: ['Java', 'Spring Boot', 'AWS Basic']
  },
  {
    id: '5',
    full_name: 'Neha Gupta',
    user_type: 'alumni',
    email: 'neha.g@example.com',
    graduation_year: 2018,
    industry: 'Cybersecurity',
    location: 'Delhi, India',
    bio: 'Security Analyst focused on web application security. Happy to review resumes or conduct mock interviews.',
    is_verified: true,
    skills: ['Pen Testing', 'Network Security', 'Cryptography']
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

