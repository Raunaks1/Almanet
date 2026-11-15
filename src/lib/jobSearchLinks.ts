// ─── External job-site search links ───
// Builds "search on other sites" URLs from a role, city and fresher flag.
// Nothing is fetched from these sites; the links are only opened in a new tab.

export interface JobSearchLink {
  id: string;
  name: string;
  url: string;
}

export interface JobSearchParams {
  role: string;
  city: string;
  fresher: boolean;
}

// Sites that are more internship/startup oriented get "intern" instead of
// "fresher" appended to the keywords when the fresher flag is on.

const SITES: Array<{
  id: string;
  name: string;
  internshipStyle: boolean;
  generalUrl: string;
  searchUrl: (params: { keyword: string; city: string }) => string;
}> = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    internshipStyle: false,
    generalUrl: 'https://www.linkedin.com/jobs/',
    searchUrl: ({ keyword, city }) => {
      const params = new URLSearchParams();
      if (keyword) params.set('keywords', keyword);
      if (city) params.set('location', city);
      return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
    },
  },
  {
    id: 'naukri',
    name: 'Naukri',
    internshipStyle: false,
    generalUrl: 'https://www.naukri.com/',
    searchUrl: ({ keyword, city }) => {
      const roleSlug = slugify(keyword);
      if (!roleSlug) return 'https://www.naukri.com/';
      const citySlug = city ? slugify(city) : '';
      if (citySlug) return `https://www.naukri.com/${roleSlug}-jobs-in-${citySlug}`;
      return `https://www.naukri.com/${roleSlug}-jobs`;
    },
  },
  {
    id: 'instahyre',
    name: 'Instahyre',
    internshipStyle: false,
    generalUrl: 'https://www.instahyre.com/',
    searchUrl: () => 'https://www.instahyre.com/',
  },
  {
    id: 'glassdoor',
    name: 'Glassdoor',
    internshipStyle: false,
    generalUrl: 'https://www.glassdoor.co.in/Job/jobs.htm',
    searchUrl: ({ keyword, city }) => {
      const params = new URLSearchParams();
      if (keyword) params.set('sc.keyword', keyword);
      if (city) params.set('locKeyword', city);
      return `https://www.glassdoor.co.in/Job/jobs.htm?${params.toString()}`;
    },
  },
  {
    id: 'indeed',
    name: 'Indeed',
    internshipStyle: false,
    generalUrl: 'https://in.indeed.com/jobs',
    searchUrl: ({ keyword, city }) => {
      const params = new URLSearchParams();
      if (keyword) params.set('q', keyword);
      if (city) params.set('l', city);
      return `https://in.indeed.com/jobs?${params.toString()}`;
    },
  },
  {
    id: 'wellfound',
    name: 'Wellfound',
    internshipStyle: true,
    generalUrl: 'https://wellfound.com/jobs',
    searchUrl: () => 'https://wellfound.com/jobs',
  },
  {
    id: 'workatastartup',
    name: 'Y Combinator (Work at a Startup)',
    internshipStyle: true,
    generalUrl: 'https://www.workatastartup.com/jobs',
    searchUrl: () => 'https://www.workatastartup.com/jobs',
  },
  {
    id: 'weworkremotely',
    name: 'We Work Remotely',
    internshipStyle: false,
    generalUrl: 'https://weworkremotely.com/remote-jobs',
    searchUrl: ({ keyword }) => {
      const params = new URLSearchParams();
      if (keyword) params.set('term', keyword);
      return `https://weworkremotely.com/remote-jobs/search?${params.toString()}`;
    },
  },
];

// Lowercase slug with hyphens; strips special characters so no encoding
// artifacts appear in path-style URLs.
const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export function buildJobSearchLinks({
  role,
  city,
  fresher,
}: JobSearchParams): JobSearchLink[] {
  const hasRole = role.trim().length > 0;

  const links = SITES.map((site) => {
    const modifier = fresher ? (site.internshipStyle ? 'intern' : 'fresher') : '';
    const keyword = hasRole
      ? `${role.trim()}${modifier ? ` ${modifier}` : ''}`.trim()
      : '';

    return {
      id: site.id,
      name: site.name,
      url: hasRole
        ? site.searchUrl({ keyword, city: city.trim() })
        : site.generalUrl,
    };
  });

  // Development-only safety check: %25 means a value was encoded twice.
  if (import.meta.env.DEV) {
    for (const link of links) {
      if (link.url.includes('%25')) {
        console.warn('Double-encoded URL detected:', link.id, link.url);
      }
    }
  }

  return links;
}
