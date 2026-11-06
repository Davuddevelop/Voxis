// Creates the stage demo: one job at /v/demo and three SAMPLE candidates so the ranked list has something to rank.
// Safe to run twice (it does nothing if the job already exists). The samples are scored by the real scoreProfile and are
// labelled "(nümunə)" at the end of their names so nobody mistakes them for real people.
//
// Run:  set -a; . ./.env.local; set +a; NODE_USE_ENV_PROXY=1 npm run seed:demo
// Remove the samples later:  delete from jobs where slug = 'demo';   (applications go with it)
import { questionsForCriteria } from "@/lib/catalog";
import { createApplication, createJob, getJob, setApplicationStatus } from "@/lib/db";
import { CriteriaSchema, type Profile } from "@/lib/schema";
import { scoreProfile } from "@/lib/scoring";

const SLUG = "demo";

// Three criteria, two topics = two questions: short enough for a candidate to answer in about 20 seconds on stage.
const criteria = CriteriaSchema.parse([
  { id: "c1", label: "Ən azı 6 ay təcrübə", field: "experience_months", op: "number_gte", value: 6, priority: 4 },
  { id: "c2", label: "Növbəli işləyə bilər", field: "can_work_shifts", op: "bool_true", priority: 5 },
  { id: "c3", label: "Həftəsonu işləyə bilər", field: "can_work_weekends", op: "bool_true", priority: 2 },
]);
const questions = questionsForCriteria(criteria);

const blank = { languages: null, has_driving_license: null, available_within_days: null };
const samples: { name: string; phone: string; experience: string; schedule: string; profile: Profile }[] = [
  {
    name: "Aysel M. (nümunə)", phone: "+994500000001",
    experience: "Bir ildir marketdə kassir işləyirəm.",
    schedule: "Növbəli işləyə bilərəm, həftəsonu da problem deyil.",
    profile: { ...blank, experience_months: 12, can_work_shifts: true, can_work_weekends: true,
      evidence: { experience_months: "Bir ildir marketdə kassir işləyirəm", can_work_shifts: "Növbəli işləyə bilərəm", can_work_weekends: "həftəsonu da problem deyil" } },
  },
  {
    name: "Rəşad Ə. (nümunə)", phone: "+994500000002",
    experience: "Dörd aydır satıcı işləyirəm.",
    schedule: "Növbəli işləyə bilərəm, amma həftəsonu işləyə bilmirəm, dərsim var.",
    profile: { ...blank, experience_months: 4, can_work_shifts: true, can_work_weekends: false,
      evidence: { experience_months: "Dörd aydır satıcı işləyirəm", can_work_shifts: "Növbəli işləyə bilərəm", can_work_weekends: "həftəsonu işləyə bilmirəm" } },
  },
  {
    name: "Nigar H. (nümunə)", phone: "+994500000003",
    experience: "Təcrübəm yoxdur, amma öyrənməyə hazıram.",
    schedule: "Həftəsonu işləyə bilərəm.",
    profile: { ...blank, experience_months: 0, can_work_shifts: null, can_work_weekends: true,
      evidence: { experience_months: "Təcrübəm yoxdur", can_work_weekends: "Həftəsonu işləyə bilərəm" } },
  },
];

async function main() {
  if (await getJob(SLUG)) return console.log(`/v/${SLUG} already exists: nothing to do.`);

  const job = await createJob({
    slug: SLUG, title: "Kassir", company: "Demo Market", location: "Nəsimi filialı",
    description: "Marketdə kassir. Növbəli iş. CV lazım deyil: səslə müraciət edin.",
    questions, criteria,
  });
  console.log(`created job ${job.id} at /v/${SLUG}  (${questions.length} questions: ${questions.map((q) => q.id).join(", ")})`);

  for (const s of samples) {
    const result = scoreProfile(s.profile, criteria);
    const application = await createApplication({
      job_id: job.id, candidate_name: s.name, phone: s.phone,
      answers: [
        { questionId: "experience", question: questions[0]?.text ?? "", transcript: s.experience },
        { questionId: "schedule", question: questions[1]?.text ?? "", transcript: s.schedule },
      ],
      extracted_profile: s.profile, profile: s.profile, edited_fields: [],
      consent_at: new Date().toISOString(), score: result.score, band: result.band, breakdown: result.breakdown,
    });
    // Samples are already "seen", so a candidate who applies live is the only one with the blue "Yeni" dot.
    await setApplicationStatus(application.id, "viewed");
    console.log(`  ${s.name.padEnd(20)} score ${String(result.score).padStart(3)} (${result.band})`);
  }
}

main().catch((error) => {
  console.error("seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
