/**
 * Seed data for the AI Job Board & Resume Optimization Studio.
 * Purely client-side mock data — no Supabase dependency.
 */

import type { Job } from '../types/job-matching';

export const JOB_BOARD_SEED: Job[] = [
  {
    id: 'job-1',
    title: 'AI Research Engineer',
    company: 'Google',
    logoUrl: undefined,
    type: 'Full Time',
    experience: '3 - 6 years',
    salary: '₹ 45L - 70L / Annum',
    location: 'Bangalore, India',
    postedAgo: '2 days ago',
    summary: [
      'Design and train large-scale machine learning models.',
      'Deploy AI services on Google Cloud infrastructure.',
      'Collaborate with product teams to integrate AI into user-facing features.',
    ],
    requiredKeywords: [
      { keyword: 'Artificial Intelligence', weight: 'must-have', category: 'concept' },
      { keyword: 'Machine Learning', weight: 'must-have', category: 'concept' },
      { keyword: 'Python', weight: 'must-have', category: 'skill' },
      { keyword: 'TensorFlow', weight: 'good-to-have', category: 'tool' },
      { keyword: 'PyTorch', weight: 'good-to-have', category: 'tool' },
      { keyword: 'Cloud Deployment', weight: 'good-to-have', category: 'skill' },
    ],
  },
  {
    id: 'job-2',
    title: 'Full Stack Developer',
    company: 'Jio Platforms',
    logoUrl: undefined,
    type: 'Full Time',
    experience: '1 - 4 years',
    salary: '₹ 12L - 20L / Annum',
    location: 'Mumbai, India',
    postedAgo: '5 days ago',
    summary: [
      'Build and maintain customer-facing web applications.',
      'Work with React, Node.js, and MongoDB in an agile team.',
      'Integrate third-party APIs and payment gateways.',
    ],
    requiredKeywords: [
      { keyword: 'React', weight: 'must-have', category: 'skill' },
      { keyword: 'Node.js', weight: 'must-have', category: 'skill' },
      { keyword: 'JavaScript', weight: 'must-have', category: 'skill' },
      { keyword: 'MongoDB', weight: 'good-to-have', category: 'tool' },
      { keyword: 'REST APIs', weight: 'good-to-have', category: 'concept' },
      { keyword: 'Next.js', weight: 'good-to-have', category: 'skill' },
    ],
  },
  {
    id: 'job-3',
    title: 'NLP Engineer',
    company: 'Sarvam AI',
    logoUrl: undefined,
    type: 'Full Time',
    experience: '2 - 5 years',
    salary: '₹ 25L - 40L / Annum',
    location: 'Chennai, India',
    postedAgo: '1 week ago',
    summary: [
      'Develop Indic language models for speech and text.',
      'Fine-tune LLMs on multilingual datasets.',
      'Optimize inference latency for production deployment.',
    ],
    requiredKeywords: [
      { keyword: 'Natural Language Processing', weight: 'must-have', category: 'concept' },
      { keyword: 'Python', weight: 'must-have', category: 'skill' },
      { keyword: 'PyTorch', weight: 'must-have', category: 'tool' },
      { keyword: 'Transformers', weight: 'good-to-have', category: 'concept' },
      { keyword: 'Hugging Face', weight: 'good-to-have', category: 'tool' },
      { keyword: 'Indic Languages', weight: 'good-to-have', category: 'concept' },
    ],
  },
  {
    id: 'job-4',
    title: 'Quantitative Analyst',
    company: 'Goldman Sachs',
    logoUrl: undefined,
    type: 'Full Time',
    experience: '0 - 2 years',
    salary: '₹ 18L - 30L / Annum',
    location: 'Bengaluru, India',
    postedAgo: '3 days ago',
    summary: [
      'Build statistical models for risk and trading desks.',
      'Analyze market data to generate alpha signals.',
      'Automate reporting pipelines with Python and SQL.',
    ],
    requiredKeywords: [
      { keyword: 'Python', weight: 'must-have', category: 'skill' },
      { keyword: 'SQL', weight: 'must-have', category: 'skill' },
      { keyword: 'Statistics', weight: 'must-have', category: 'concept' },
      { keyword: 'Financial Modeling', weight: 'good-to-have', category: 'concept' },
      { keyword: 'Excel', weight: 'good-to-have', category: 'tool' },
      { keyword: 'Risk Management', weight: 'good-to-have', category: 'concept' },
    ],
  },
  {
    id: 'job-5',
    title: 'Embedded Systems Engineer',
    company: 'Honeywell',
    logoUrl: undefined,
    type: 'Full Time',
    experience: '2 - 5 years',
    salary: '₹ 15L - 25L / Annum',
    location: 'Pune, India',
    postedAgo: '6 days ago',
    summary: [
      'Develop firmware for IoT and industrial control systems.',
      'Program microcontrollers in C and C++.',
      'Debug hardware-software integration issues.',
    ],
    requiredKeywords: [
      { keyword: 'C++', weight: 'must-have', category: 'skill' },
      { keyword: 'Embedded C', weight: 'must-have', category: 'skill' },
      { keyword: 'Microcontrollers', weight: 'must-have', category: 'concept' },
      { keyword: 'RTOS', weight: 'good-to-have', category: 'concept' },
      { keyword: 'IoT', weight: 'good-to-have', category: 'concept' },
      { keyword: 'Debugging', weight: 'good-to-have', category: 'skill' },
    ],
  },
  {
    id: 'job-6',
    title: 'Data Engineer',
    company: 'LSEG',
    logoUrl: undefined,
    type: 'Full Time',
    experience: '2 - 5 years',
    salary: '₹ 20L - 32L / Annum',
    location: 'Mumbai, India',
    postedAgo: '4 days ago',
    summary: [
      'Build and maintain ETL pipelines for financial data.',
      'Work with AWS, Spark, and SQL at scale.',
      'Ensure data quality and observability across sources.',
    ],
    requiredKeywords: [
      { keyword: 'SQL', weight: 'must-have', category: 'skill' },
      { keyword: 'Python', weight: 'must-have', category: 'skill' },
      { keyword: 'AWS', weight: 'must-have', category: 'tool' },
      { keyword: 'Apache Spark', weight: 'good-to-have', category: 'tool' },
      { keyword: 'ETL', weight: 'good-to-have', category: 'concept' },
      { keyword: 'Data Warehousing', weight: 'good-to-have', category: 'concept' },
    ],
  },
];


export const SAVED_JOBS_STORAGE_KEY = 'almanet_saved_jobs';
export const ACTIVE_RESUME_STORAGE_KEY = 'almanet_active_resume_id';
