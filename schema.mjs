// The story-profile schema. One source of truth for the interviewer and (later) the build.
import { z } from "zod";

const kv = z.object({ k: z.string(), v: z.string() });
const titled = z.object({ title: z.string(), body: z.string(), todo: z.boolean().optional() });

export const Profile = z.object({
  identity: z.object({
    name: z.string(),
    tagline: z.string().describe("One or two sentences, first person, what they do and what they care about. No buzzwords."),
    location: z.string(),
    languages: z.array(z.string()),
    email: z.string(),
    phone: z.string().optional(),
    links: z.object({ linkedin: z.string().optional(), github: z.string().optional(), website: z.string().optional() }),
  }),
  person: z.object({
    intro: z.string().describe("Two to four sentences in their voice about why this page exists."),
    values: z.array(titled).min(3).max(5),
    howIWork: z.object({
      energizedBy: z.array(z.string()).min(3),
      drainedBy: z.array(z.string()).min(2),
      manual: z.array(kv).min(4).describe("Working manual: how to reach them, how they give and take feedback, how they lead, hours, what happens when they are wrong."),
    }),
  }),
  timeline: z.array(z.object({
    from: z.string(), to: z.string(),
    title: z.string().describe("A chapter title, not a job title."),
    where: z.string(),
    chapter: z.string().describe("What they did, what they learned, in their voice. Verifiable facts from the CV plus what they said in the interview."),
    world: z.string().describe("What was going on in the industry, the city and the world at the time."),
    todo: z.boolean().optional(),
  })).min(3),
  skills: z.array(kv),
  tech: z.array(z.object({ group: z.string(), items: z.array(z.string()).min(1) })).describe("Technologies grouped by area, for the technology wall."),
  projects: z.array(z.object({
    name: z.string(), tag: z.string(), one: z.string(), status: z.string(), kind: z.enum(["pro", "lab"]).describe("pro: for an employer, client or the studio. lab: own things and experiments."), image: z.string().optional(), todo: z.boolean().optional(),
    deck: z.object({
      year: z.string(), role: z.string(),
      problem: z.string().describe("The problem, in two sentences."),
      thesis: z.string().describe("The bet, in two sentences."),
      stack: z.array(z.string()).min(2),
      built: z.string().describe("How it is built or where it stands, one or two sentences."),
    }).optional(),
  })),
  into: z.array(titled).min(3),
  voices: z.array(z.object({ quote: z.string(), who: z.string(), role: z.string() })).describe("Only real recommendations from named people. Empty if none were provided."),
  together: z.array(titled).min(3).describe("Concrete ways to meet or work with them, each one a format they actually accept."),
  studio: z.object({
    name: z.string(), wordmark: z.string().optional(), url: z.string().optional(), email: z.string().optional(),
    tagline: z.string(), intro: z.string(), myRole: z.string(),
    team: z.array(z.object({ name: z.string(), role: z.string(), bio: z.string(), todo: z.boolean().optional() })),
    ethos: z.array(titled).min(2),
    firstProduct: z.object({ name: z.string(), status: z.string(), one: z.string(), deck: z.string().optional() }).optional(),
    stewardship: z.object({ status: z.string(), body: z.string() }).optional(),
  }).optional().describe("A studio, company or collective the person belongs to, if it is central to who they are."),
  agent: z.object({
    summaryHint: z.string().describe("Three to five sentences a screening agent can quote. Facts only."),
    goodFitSignals: z.array(z.string()).min(3),
    poorFitSignals: z.array(z.string()).min(2),
    contact: z.string(),
  }),
});
