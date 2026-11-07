/**
 * FAQ data for the Almanet Home page.
 *
 * TODO(owner): fill in SUPPORT_EMAIL and VERIFICATION_TIME before launch.
 * In development, console.warn logs the items flagged needsReview and any
 * empty constants so they are not shipped as placeholders.
 */

export const SUPPORT_EMAIL = '' // TODO(owner): put the real support email here
export const VERIFICATION_TIME = '' // TODO(owner): e.g. '24 to 48 hours'

export interface FaqItem {
  id: string
  question: string
  answer: string
  fallback?: string
  needsReview?: boolean
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what',
    question: 'What is Almanet?',
    answer:
      'Almanet is a trusted network for students and alumni of engineering colleges in Maharashtra. You can find people from your college, chat with your batch, discover jobs and events, and join discussions.',
  },
  {
    id: 'who',
    question: 'Who can join?',
    answer:
      'Current students and alumni of the engineering colleges listed on Almanet. Choose your college from the list when you register. Alumni can join from anywhere in the world.',
  },
  {
    id: 'free',
    question: 'Is Almanet free?',
    answer: 'Yes, Almanet is free for students and alumni.',
    needsReview: true,
  },
  {
    id: 'signup',
    question: 'How do I create an account?',
    answer:
      'Select Get started, choose whether you are an alumnus or a student, and fill in your name, college, degree, branch, graduation year, email and password. You can add a profile photo too. Then confirm your email address.',
  },
  {
    id: 'email',
    question: "I didn't get the confirmation email. What now?",
    answer:
      "Check your spam or promotions folder and make sure you typed your email address correctly. Wait a few minutes, then try again. If it still doesn't arrive, contact {SUPPORT_EMAIL}.",
  },
  {
    id: 'verify',
    question: 'Why do I need to be verified?',
    answer:
      'An admin reviews every new member to confirm they belong to the college they selected. This keeps the network real and trusted, so you know the people you talk to are genuine students and alumni.',
  },
  {
    id: 'time',
    question: 'How long does verification take?',
    answer: 'Most requests are reviewed within {VERIFICATION_TIME}. You can use your account fully as soon as you are approved.',
    fallback:
      'An admin reviews each request as soon as possible. You can use your account fully as soon as you are approved.',
    needsReview: true,
  },
  {
    id: 'pending',
    question: 'What can I do while my verification is pending?',
    answer:
      'You can sign in and see your dashboard, which shows your verification status. The directory, forums, jobs, events and chat unlock once you are approved.',
  },
  {
    id: 'privacy',
    question: 'Who can see my profile?',
    answer:
      'Only verified members of Almanet. Your profile is not visible to people outside the network, and you can use the visibility setting on your profile to control what others see.',
    needsReview: true,
  },
  {
    id: 'find',
    question: 'How do I find and contact alumni?',
    answer:
      'Open the Directory and search by name or skill, then filter by industry and graduation year. Select Message on someone\'s card to start a direct chat.',
  },
  {
    id: 'jobs',
    question: 'Does Almanet verify the jobs posted?',
    answer:
      'No. Jobs are shared by members, so please check the company and details yourself. Never pay a fee to apply for a job.',
  },
  {
    id: 'delete',
    question: 'How do I delete my account?',
    answer:
      'Open your profile, scroll to the bottom and choose Delete account. This permanently removes your account, and it cannot be undone.',
  },
]

const PUNCTUATION_BEAT = new Set(['.', '!', '?'])
const SHORT_BEAT = new Set([',', ';', ':'])

/**
 * Apply placeholder substitution rules:
 * - {SUPPORT_EMAIL} -> SUPPORT_EMAIL, or "the Almanet team" when empty
 * - {VERIFICATION_TIME} -> VERIFICATION_TIME, or the item's fallback (whole answer) when empty
 */
export function getAnswer(item: FaqItem): string {
  let answer = item.answer

  if (answer.includes('{VERIFICATION_TIME}')) {
    if (VERIFICATION_TIME) {
      answer = answer.replace('{VERIFICATION_TIME}', VERIFICATION_TIME)
    } else if (item.fallback) {
      answer = item.fallback
    }
  }

  if (answer.includes('{SUPPORT_EMAIL}')) {
    answer = answer.replace('{SUPPORT_EMAIL}', SUPPORT_EMAIL || 'the Almanet team')
  }

  return answer
}

/**
 * Precompute per-character cumulative reveal times (ms) for an answer string.
 * Base: 12ms per character. Punctuation beats: .!? = 140ms, ,;: = 70ms.
 * Includes a 250ms start delay at index 0.
 */
export function buildRevealSchedule(text: string): number[] {
  const times: number[] = []
  let t = 250 // startDelay
  for (let i = 0; i < text.length; i++) {
    times.push(t)
    const ch = text[i]
    if (PUNCTUATION_BEAT.has(ch)) t += 140
    else if (SHORT_BEAT.has(ch)) t += 70
    else t += 12
  }
  return times
}

if (import.meta.env.DEV) {
  const needsReview = FAQ_ITEMS.filter((item) => item.needsReview)
  if (needsReview.length) {
    console.warn(
      '[FAQ] Items needing review:',
      needsReview.map((item) => `${item.id}: ${item.question}`),
    )
  }
  if (!SUPPORT_EMAIL) {
    console.warn('[FAQ] SUPPORT_EMAIL is empty — {SUPPORT_EMAIL} will render as "the Almanet team"')
  }
  if (!VERIFICATION_TIME) {
    console.warn(
      '[FAQ] VERIFICATION_TIME is empty — items referencing it will use their fallback answer',
    )
  }
}
