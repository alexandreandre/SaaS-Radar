import { getAllOpportunities } from "@/lib/opportunities";
import { QuizClient } from "./quiz-client";

export default async function QuizPage() {
  const opportunities = await getAllOpportunities();
  return <QuizClient opportunities={opportunities} />;
}
