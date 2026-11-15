/**
 * Canonical skill name -> aliases dictionary for engineering / IT students and freshers.
 *
 * Matching rules (see findKeywords):
 *  - Case-insensitive.
 *  - Word-bounded: "java" does NOT match "javascript", "c" does not match inside other words.
 *  - Multi-word aliases match as phrases.
 *  - Tokens like c++, c#, .net, node.js are escaped and matched literally.
 *  - Bare short tokens that are common English words (bare "go", bare "r", bare "c") are
 *    deliberately NOT included as aliases — they are matched only via phrase aliases
 *    ("golang", "r language", "c language") so they are not mistaken for verbs/articles.
 *
 * Each canonical name appears exactly once. Aliases are lowercase.
 */

export interface SkillEntry {
  canonical: string;
  aliases: string[];
  category: string;
}

export interface KeywordHit {
  canonical: string;
  count: number;
  offsets: number[];
}

export const SKILL_DICTIONARY: SkillEntry[] = [
  // ─── Programming languages ───
  { canonical: 'JavaScript', aliases: ['javascript', 'js', 'ecmascript', 'es6', 'es2015', 'es2020'], category: 'Programming languages' },
  { canonical: 'TypeScript', aliases: ['typescript', 'ts'], category: 'Programming languages' },
  { canonical: 'Python', aliases: ['python', 'py'], category: 'Programming languages' },
  { canonical: 'Java', aliases: ['java'], category: 'Programming languages' },
  { canonical: 'C++', aliases: ['c++', 'c plus plus', 'cpp'], category: 'Programming languages' },
  { canonical: 'C#', aliases: ['c#', 'c sharp', 'csharp'], category: 'Programming languages' },
  { canonical: 'C', aliases: ['c language', 'c programming', 'ansi c'], category: 'Programming languages' },
  { canonical: 'Go', aliases: ['golang', 'go language', 'go programming'], category: 'Programming languages' },
  { canonical: 'Rust', aliases: ['rust'], category: 'Programming languages' },
  { canonical: 'Swift', aliases: ['swift'], category: 'Programming languages' },
  { canonical: 'Kotlin', aliases: ['kotlin'], category: 'Programming languages' },
  { canonical: 'PHP', aliases: ['php'], category: 'Programming languages' },
  { canonical: 'Ruby', aliases: ['ruby'], category: 'Programming languages' },
  { canonical: 'Dart', aliases: ['dart'], category: 'Programming languages' },
  { canonical: 'Scala', aliases: ['scala'], category: 'Programming languages' },
  { canonical: 'R', aliases: ['r language', 'r programming', 'r stats'], category: 'Programming languages' },
  { canonical: 'MATLAB', aliases: ['matlab'], category: 'Programming languages' },
  { canonical: 'Perl', aliases: ['perl'], category: 'Programming languages' },
  { canonical: 'Lua', aliases: ['lua'], category: 'Programming languages' },
  { canonical: 'Haskell', aliases: ['haskell'], category: 'Programming languages' },
  { canonical: 'Elixir', aliases: ['elixir'], category: 'Programming languages' },
  { canonical: 'Julia', aliases: ['julia'], category: 'Programming languages' },
  { canonical: 'SQL', aliases: ['sql'], category: 'Programming languages' },
  { canonical: 'HTML', aliases: ['html', 'html5'], category: 'Programming languages' },
  { canonical: 'CSS', aliases: ['css', 'css3'], category: 'Programming languages' },

  // ─── Web frontend ───
  { canonical: 'React', aliases: ['react', 'reactjs', 'react.js', 'react js'], category: 'Web frontend' },
  { canonical: 'Next.js', aliases: ['next.js', 'nextjs', 'next'], category: 'Web frontend' },
  { canonical: 'Vue', aliases: ['vue', 'vuejs', 'vue.js', 'vue 3', 'vue2'], category: 'Web frontend' },
  { canonical: 'Angular', aliases: ['angular', 'angularjs', 'angular.js', 'angular 2', 'angular 13'], category: 'Web frontend' },
  { canonical: 'Svelte', aliases: ['svelte', 'sveltekit', 'svelte kit'], category: 'Web frontend' },
  { canonical: 'Tailwind CSS', aliases: ['tailwind', 'tailwind css', 'tailwindcss'], category: 'Web frontend' },
  { canonical: 'Sass', aliases: ['sass', 'scss'], category: 'Web frontend' },
  { canonical: 'Less', aliases: ['less', 'less.js'], category: 'Web frontend' },
  { canonical: 'Bootstrap', aliases: ['bootstrap'], category: 'Web frontend' },
  { canonical: 'jQuery', aliases: ['jquery', 'jquery.js'], category: 'Web frontend' },
  { canonical: 'Astro', aliases: ['astro'], category: 'Web frontend' },
  { canonical: 'Qwik', aliases: ['qwik'], category: 'Web frontend' },
  { canonical: 'Solid', aliases: ['solidjs', 'solid'], category: 'Web frontend' },
  { canonical: 'Lit', aliases: ['lit', 'lit-element'], category: 'Web frontend' },
  { canonical: 'Ember', aliases: ['ember', 'emberjs'], category: 'Web frontend' },
  { canonical: 'Backbone', aliases: ['backbone', 'backbonejs'], category: 'Web frontend' },
  { canonical: 'Webpack', aliases: ['webpack'], category: 'Web frontend' },
  { canonical: 'Vite', aliases: ['vite'], category: 'Web frontend' },
  { canonical: 'Rollup', aliases: ['rollup'], category: 'Web frontend' },
  { canonical: 'Parcel', aliases: ['parcel'], category: 'Web frontend' },
  { canonical: 'ESLint', aliases: ['eslint'], category: 'Web frontend' },
  { canonical: 'Redux', aliases: ['redux'], category: 'Web frontend' },
  { canonical: 'React Query', aliases: ['react query', 'tanstack query'], category: 'Web frontend' },
  { canonical: 'Axios', aliases: ['axios'], category: 'Web frontend' },

  // ─── Backend and frameworks ───
  { canonical: 'Node.js', aliases: ['node.js', 'nodejs', 'node'], category: 'Backend and frameworks' },
  { canonical: 'Express', aliases: ['express', 'expressjs', 'express.js'], category: 'Backend and frameworks' },
  { canonical: 'NestJS', aliases: ['nestjs', 'nest js', 'nest.js'], category: 'Backend and frameworks' },
  { canonical: 'Django', aliases: ['django'], category: 'Backend and frameworks' },
  { canonical: 'Flask', aliases: ['flask'], category: 'Backend and frameworks' },
  { canonical: 'FastAPI', aliases: ['fastapi'], category: 'Backend and frameworks' },
  { canonical: 'Spring Boot', aliases: ['spring boot', 'springboot', 'spring'], category: 'Backend and frameworks' },
  { canonical: 'Ruby on Rails', aliases: ['rails', 'ruby on rails', 'ror'], category: 'Backend and frameworks' },
  { canonical: 'Laravel', aliases: ['laravel'], category: 'Backend and frameworks' },
  { canonical: 'ASP.NET', aliases: ['asp.net', 'aspnet'], category: 'Backend and frameworks' },
  { canonical: '.NET', aliases: ['.net', 'dotnet'], category: 'Backend and frameworks' },
  { canonical: 'Phoenix', aliases: ['phoenix'], category: 'Backend and frameworks' },
  { canonical: 'Gin', aliases: ['gin', 'gin gonic'], category: 'Backend and frameworks' },
  { canonical: 'Fastify', aliases: ['fastify'], category: 'Backend and frameworks' },
  { canonical: 'Koa', aliases: ['koa'], category: 'Backend and frameworks' },

  // ─── Databases ───
  { canonical: 'PostgreSQL', aliases: ['postgresql', 'postgres', 'psql'], category: 'Databases' },
  { canonical: 'MySQL', aliases: ['mysql'], category: 'Databases' },
  { canonical: 'MongoDB', aliases: ['mongodb', 'mongo'], category: 'Databases' },
  { canonical: 'Redis', aliases: ['redis'], category: 'Databases' },
  { canonical: 'SQLite', aliases: ['sqlite'], category: 'Databases' },
  { canonical: 'Elasticsearch', aliases: ['elasticsearch', 'elastic', 'es'], category: 'Databases' },
  { canonical: 'Cassandra', aliases: ['cassandra'], category: 'Databases' },
  { canonical: 'DynamoDB', aliases: ['dynamodb', 'aws dynamodb'], category: 'Databases' },
  { canonical: 'Firebase', aliases: ['firebase'], category: 'Databases' },
  { canonical: 'Supabase', aliases: ['supabase'], category: 'Databases' },
  { canonical: 'Prisma', aliases: ['prisma'], category: 'Databases' },
  { canonical: 'MariaDB', aliases: ['mariadb'], category: 'Databases' },

  // ─── Cloud and DevOps ───
  { canonical: 'AWS', aliases: ['aws', 'amazon web services'], category: 'Cloud and DevOps' },
  { canonical: 'Azure', aliases: ['azure', 'microsoft azure'], category: 'Cloud and DevOps' },
  { canonical: 'GCP', aliases: ['gcp', 'google cloud', 'google cloud platform'], category: 'Cloud and DevOps' },
  { canonical: 'Docker', aliases: ['docker'], category: 'Cloud and DevOps' },
  { canonical: 'Kubernetes', aliases: ['kubernetes', 'k8s', 'kube'], category: 'Cloud and DevOps' },
  { canonical: 'Terraform', aliases: ['terraform'], category: 'Cloud and DevOps' },
  { canonical: 'CI/CD', aliases: ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment'], category: 'Cloud and DevOps' },
  { canonical: 'Jenkins', aliases: ['jenkins'], category: 'Cloud and DevOps' },
  { canonical: 'GitHub Actions', aliases: ['github actions', 'github action'], category: 'Cloud and DevOps' },
  { canonical: 'GitLab CI', aliases: ['gitlab ci'], category: 'Cloud and DevOps' },
  { canonical: 'Ansible', aliases: ['ansible'], category: 'Cloud and DevOps' },
  { canonical: 'Nginx', aliases: ['nginx'], category: 'Cloud and DevOps' },
  { canonical: 'Apache', aliases: ['apache', 'apache httpd'], category: 'Cloud and DevOps' },
  { canonical: 'Linux', aliases: ['linux'], category: 'Cloud and DevOps' },
  { canonical: 'Ubuntu', aliases: ['ubuntu'], category: 'Cloud and DevOps' },
  { canonical: 'Lambda', aliases: ['aws lambda', 'lambda'], category: 'Cloud and DevOps' },
  { canonical: 'S3', aliases: ['s3', 'amazon s3'], category: 'Cloud and DevOps' },
  { canonical: 'Cloudflare', aliases: ['cloudflare'], category: 'Cloud and DevOps' },

  // ─── Data and AI/ML ───
  { canonical: 'Machine Learning', aliases: ['machine learning', 'ml'], category: 'Data and AI/ML' },
  { canonical: 'Deep Learning', aliases: ['deep learning', 'dl'], category: 'Data and AI/ML' },
  { canonical: 'Natural Language Processing', aliases: ['natural language processing', 'nlp'], category: 'Data and AI/ML' },
  { canonical: 'Computer Vision', aliases: ['computer vision', 'cv'], category: 'Data and AI/ML' },
  { canonical: 'TensorFlow', aliases: ['tensorflow', 'tf'], category: 'Data and AI/ML' },
  { canonical: 'PyTorch', aliases: ['pytorch', 'torch'], category: 'Data and AI/ML' },
  { canonical: 'Scikit-learn', aliases: ['scikit-learn', 'sklearn', 'scikit learn'], category: 'Data and AI/ML' },
  { canonical: 'Pandas', aliases: ['pandas'], category: 'Data and AI/ML' },
  { canonical: 'NumPy', aliases: ['numpy', 'numpy'], category: 'Data and AI/ML' },
  { canonical: 'Keras', aliases: ['keras'], category: 'Data and AI/ML' },
  { canonical: 'OpenAI', aliases: ['openai', 'gpt'], category: 'Data and AI/ML' },
  { canonical: 'LangChain', aliases: ['langchain'], category: 'Data and AI/ML' },
  { canonical: 'Hugging Face', aliases: ['hugging face', 'huggingface'], category: 'Data and AI/ML' },
  { canonical: 'Transformers', aliases: ['transformers'], category: 'Data and AI/ML' },
  { canonical: 'Data Analysis', aliases: ['data analysis', 'data analytics'], category: 'Data and AI/ML' },
  { canonical: 'Tableau', aliases: ['tableau'], category: 'Data and AI/ML' },
  { canonical: 'Power BI', aliases: ['power bi', 'powerbi'], category: 'Data and AI/ML' },
  { canonical: 'Excel', aliases: ['excel', 'ms excel', 'microsoft excel'], category: 'Data and AI/ML' },
  { canonical: 'Spark', aliases: ['apache spark', 'spark'], category: 'Data and AI/ML' },
  { canonical: 'Hadoop', aliases: ['hadoop'], category: 'Data and AI/ML' },
  { canonical: 'Kafka', aliases: ['apache kafka', 'kafka'], category: 'Data and AI/ML' },
  { canonical: 'Airflow', aliases: ['apache airflow', 'airflow'], category: 'Data and AI/ML' },
  { canonical: 'Jupyter', aliases: ['jupyter', 'jupyter notebook'], category: 'Data and AI/ML' },

  // ─── Mobile ───
  { canonical: 'iOS', aliases: ['ios', 'iphone', 'ipad'], category: 'Mobile' },
  { canonical: 'Android', aliases: ['android'], category: 'Mobile' },
  { canonical: 'React Native', aliases: ['react native', 'react-native'], category: 'Mobile' },
  { canonical: 'Flutter', aliases: ['flutter'], category: 'Mobile' },
  { canonical: 'SwiftUI', aliases: ['swiftui'], category: 'Mobile' },
  { canonical: 'Jetpack Compose', aliases: ['jetpack compose'], category: 'Mobile' },

  // ─── Testing ───
  { canonical: 'Jest', aliases: ['jest'], category: 'Testing' },
  { canonical: 'Cypress', aliases: ['cypress'], category: 'Testing' },
  { canonical: 'Selenium', aliases: ['selenium'], category: 'Testing' },
  { canonical: 'Playwright', aliases: ['playwright'], category: 'Testing' },
  { canonical: 'Mocha', aliases: ['mocha'], category: 'Testing' },
  { canonical: 'Chai', aliases: ['chai'], category: 'Testing' },
  { canonical: 'PyTest', aliases: ['pytest', 'py test'], category: 'Testing' },
  { canonical: 'JUnit', aliases: ['junit'], category: 'Testing' },
  { canonical: 'Postman', aliases: ['postman'], category: 'Testing' },
  { canonical: 'Insomnia', aliases: ['insomnia'], category: 'Testing' },

  // ─── Tools ───
  { canonical: 'Git', aliases: ['git'], category: 'Tools' },
  { canonical: 'GitHub', aliases: ['github'], category: 'Tools' },
  { canonical: 'GitLab', aliases: ['gitlab'], category: 'Tools' },
  { canonical: 'Jira', aliases: ['jira'], category: 'Tools' },
  { canonical: 'Figma', aliases: ['figma'], category: 'Tools' },
  { canonical: 'Slack', aliases: ['slack'], category: 'Tools' },
  { canonical: 'Trello', aliases: ['trello'], category: 'Tools' },
  { canonical: 'Notion', aliases: ['notion'], category: 'Tools' },
  { canonical: 'Confluence', aliases: ['confluence'], category: 'Tools' },
  { canonical: 'VS Code', aliases: ['vscode', 'vs code', 'visual studio code'], category: 'Tools' },
  { canonical: 'IntelliJ', aliases: ['intellij', 'intellij idea'], category: 'Tools' },
  { canonical: 'PyCharm', aliases: ['pycharm'], category: 'Tools' },
  { canonical: 'Swagger', aliases: ['swagger', 'openapi'], category: 'Tools' },
  { canonical: 'Docker', aliases: ['docker'], category: 'Tools' },
  { canonical: 'Postman', aliases: ['postman'], category: 'Tools' },

  // ─── Core CS ───
  { canonical: 'Data Structures', aliases: ['data structures', 'dsa'], category: 'Core CS' },
  { canonical: 'Algorithms', aliases: ['algorithms', 'algo'], category: 'Core CS' },
  { canonical: 'OOP', aliases: ['oop', 'object oriented programming', 'object-oriented programming'], category: 'Core CS' },
  { canonical: 'DBMS', aliases: ['dbms', 'database management system'], category: 'Core CS' },
  { canonical: 'Operating Systems', aliases: ['operating system', 'operating systems', 'os'], category: 'Core CS' },
  { canonical: 'Computer Networks', aliases: ['computer networks', 'networking', 'tcp/ip', 'udp'], category: 'Core CS' },
  { canonical: 'System Design', aliases: ['system design', 'scalability'], category: 'Core CS' },
  { canonical: 'Big O', aliases: ['big o', 'big o notation', 'time complexity', 'space complexity'], category: 'Core CS' },
  { canonical: 'Recursion', aliases: ['recursion'], category: 'Core CS' },
  { canonical: 'Dynamic Programming', aliases: ['dynamic programming', 'dp'], category: 'Core CS' },

  // ─── Product / design / business ───
  { canonical: 'Product Management', aliases: ['product management', 'product owner'], category: 'Product/design/business' },
  { canonical: 'Agile', aliases: ['agile', 'scrum', 'kanban'], category: 'Product/design/business' },
  { canonical: 'UX Design', aliases: ['ux design', 'user experience'], category: 'Product/design/business' },
  { canonical: 'UI Design', aliases: ['ui design', 'user interface'], category: 'Product/design/business' },
  { canonical: 'Wireframing', aliases: ['wireframing'], category: 'Product/design/business' },
  { canonical: 'Prototyping', aliases: ['prototyping'], category: 'Product/design/business' },
  { canonical: 'Market Research', aliases: ['market research'], category: 'Product/design/business' },
  { canonical: 'Business Analysis', aliases: ['business analysis'], category: 'Product/design/business' },
  { canonical: 'Stakeholder Management', aliases: ['stakeholder management'], category: 'Product/design/business' },
  { canonical: 'Project Management', aliases: ['project management'], category: 'Product/design/business' },

  // ─── Soft skills used in job posts ───
  { canonical: 'Communication', aliases: ['communication', 'communication skills'], category: 'Soft skills' },
  { canonical: 'Leadership', aliases: ['leadership', 'leading', 'led team'], category: 'Soft skills' },
  { canonical: 'Problem Solving', aliases: ['problem solving', 'problem-solving', 'problem solver'], category: 'Soft skills' },
  { canonical: 'Teamwork', aliases: ['teamwork', 'team player', 'team player'], category: 'Soft skills' },
  { canonical: 'Critical Thinking', aliases: ['critical thinking'], category: 'Soft skills' },
  { canonical: 'Time Management', aliases: ['time management'], category: 'Soft skills' },
  { canonical: 'Adaptability', aliases: ['adaptability', 'adaptable'], category: 'Soft skills' },
  { canonical: 'Creativity', aliases: ['creativity', 'creative'], category: 'Soft skills' },
  { canonical: 'Collaboration', aliases: ['collaboration', 'collaborating', 'collaborative'], category: 'Soft skills' },
  { canonical: 'Presentation', aliases: ['presentation', 'presenting', 'public speaking'], category: 'Soft skills' },
];

const BY_ALIAS = new Map<string, SkillEntry>();
for (const entry of SKILL_DICTIONARY) {
  for (const alias of entry.aliases) {
    BY_ALIAS.set(alias.toLowerCase(), entry);
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build a regex that matches the alias as a bounded token:
 *  not preceded or followed by a word char, so "java" never matches "javascript". */
function aliasRegex(alias: string): RegExp {
  const body = alias.split(/\s+/).map(escapeRe).join('\\s+');
  return new RegExp(`(?<!\\w)(${body})(?!\\w)`, 'gi');
}

/** Find all dictionary keywords in `text`. Returns canonical names with counts and
 *  character offsets (offsets index into `text` itself, since lowercase keeps length). */
export function findKeywords(text: string): KeywordHit[] {
  const low = text.toLowerCase();
  const byCanonical = new Map<string, { count: number; offsets: number[] }>();

  for (const entry of SKILL_DICTIONARY) {
    let totalCount = 0;
    const offsets: number[] = [];
    for (const alias of entry.aliases) {
      const re = aliasRegex(alias);
      for (const m of low.matchAll(re)) {
        totalCount += 1;
        if (m.index != null) offsets.push(m.index);
      }
    }
    if (totalCount > 0) {
      const prev = byCanonical.get(entry.canonical);
      if (prev) {
        prev.count += totalCount;
        prev.offsets.push(...offsets);
      } else {
        byCanonical.set(entry.canonical, { count: totalCount, offsets });
      }
    }
  }

  return Array.from(byCanonical.entries()).map(([canonical, v]) => ({
    canonical,
    count: v.count,
    offsets: v.offsets.sort((a, b) => a - b),
  }));
}
