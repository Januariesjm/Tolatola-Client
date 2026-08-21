/**
 * Open roles and their presentation metadata.
 *
 * Extracted from app/careers/careers-page-client.tsx, where 170 lines of role
 * data and colour maps sat above the component. Keeping it here means editing a
 * job posting is a data change, not a component change.
 */

export interface Job {
  title: string
  type: string
  mode: string
  location: string
  desc: string
  dept: string
}

export const JOBS: Job[] = [
  {
    title: "Senior Software Engineer",
    type: "FULL-TIME",
    mode: "HYBRID",
    location: "Dar es Salaam",
    desc: "Help build and scale our digital trade and logistics platform.",
    dept: "Engineering",
  },
  {
    title: "Mobile App Developer (Android / iOS)",
    type: "FULL-TIME",
    mode: "HYBRID",
    location: "Dar es Salaam",
    desc: "Develop and maintain high-performance mobile applications.",
    dept: "Engineering",
  },
  {
    title: "UI/UX Designer",
    type: "FULL-TIME",
    mode: "HYBRID",
    location: "Dar es Salaam",
    desc: "Design intuitive and user-friendly digital experiences.",
    dept: "Design",
  },
  {
    title: "QA / Software Tester",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Ensure system quality through testing and performance checks.",
    dept: "Engineering",
  },
  {
    title: "Brand Marketing Lead",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Drive brand growth and digital marketing strategies.",
    dept: "Marketing",
  },
  {
    title: "Sales Executive",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Acquire customers and grow platform usage.",
    dept: "Sales",
  },
  {
    title: "Business Development Officer",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Build partnerships and expand business opportunities.",
    dept: "Business",
  },
  {
    title: "Customer Success Manager",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Manage customer relationships and improve retention.",
    dept: "Operations",
  },
  {
    title: "Customer Support Officer",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Handle user support and resolve issues efficiently.",
    dept: "Operations",
  },
  {
    title: "Operations Officer",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Coordinate daily logistics and platform operations.",
    dept: "Operations",
  },
  {
    title: "Logistics Coordinator",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Manage deliveries, fleet, and supply chain flow.",
    dept: "Logistics",
  },
  {
    title: "Data Analyst",
    type: "FULL-TIME",
    mode: "HYBRID",
    location: "Dar es Salaam",
    desc: "Analyze data to support business decisions.",
    dept: "Data",
  },
  {
    title: "Finance & Admin Officer",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Handle financial records and administrative tasks.",
    dept: "Finance",
  },
  {
    title: "HR Officer",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Manage recruitment and employee relations.",
    dept: "Human Resources",
  },
  {
    title: "Compliance Officer",
    type: "FULL-TIME",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Ensure regulatory and legal compliance.",
    dept: "Legal",
  },
  {
    title: "Internship Program",
    type: "INTERNSHIP",
    mode: "ON-SITE",
    location: "Dar es Salaam",
    desc: "Opportunities for students and fresh graduates.",
    dept: "Various",
  },
  {
    title: "Open Talent Pool (Always Hiring)",
    type: "OPEN",
    mode: "FLEXIBLE",
    location: "Dar es Salaam",
    desc: "Apply anytime—Engineering, Sales, Operations, or Support.",
    dept: "Various",
  },
]

// Department color mapping
export const DEPARTMENT_COLORS: Record<string, string> = {
  Engineering: "bg-blue-50 text-blue-700 border-blue-200",
  Design: "bg-violet-50 text-violet-700 border-violet-200",
  Marketing: "bg-pink-50 text-pink-700 border-pink-200",
  Sales: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Business: "bg-amber-50 text-amber-700 border-amber-200",
  Operations: "bg-slate-50 text-slate-700 border-slate-200",
  Logistics: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Data: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Finance: "bg-green-50 text-green-700 border-green-200",
  "Human Resources": "bg-rose-50 text-rose-700 border-rose-200",
  Legal: "bg-orange-50 text-orange-700 border-orange-200",
  Various: "bg-purple-50 text-purple-700 border-purple-200",
}

export const WORK_MODE_ICONS: Record<string, string> = {
  HYBRID: "🏠",
  "ON-SITE": "🏢",
  FLEXIBLE: "🌍",
}

/**
 * Tailwind classes for a department badge.
 *
 * The fallback is the one the careers page already used inline, kept identical
 * so badge styling does not shift for a department not in the map.
 */
export function departmentColor(department: string): string {
  return DEPARTMENT_COLORS[department] || "bg-muted text-muted-foreground"
}

/**
 * Emoji for a work mode. Falls back to an empty string, matching the page's
 * previous `modeIcons[job.mode] || ""` — an unknown mode renders no icon rather
 * than a placeholder one.
 */
export function workModeIcon(mode: string): string {
  return WORK_MODE_ICONS[mode] || ""
}
