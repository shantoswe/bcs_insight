// Pure MCQ scoring — no I/O.
//
// questions: [{ id, marks, correctOptionId, subjectId }]
// answers:   [{ questionId, selectedOptionId|null }]
// negativeMarking: marks deducted per WRONG answer (skips deduct nothing)

export function scoreAttempt({ questions, answers, negativeMarking }) {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedOptionId]));
  const neg = Number(negativeMarking) || 0;

  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let earned = 0;
  const perQuestion = [];
  const bySubject = new Map();

  for (const q of questions) {
    const selected = answerMap.get(q.id) ?? null;
    const marks = Number(q.marks) || 1;

    let bucket = bySubject.get(q.subjectId);
    if (!bucket) {
      bucket = { subjectId: q.subjectId, correct: 0, wrong: 0, skipped: 0, marks: 0 };
      bySubject.set(q.subjectId, bucket);
    }

    if (selected == null) {
      skippedCount++;
      bucket.skipped++;
      perQuestion.push({ questionId: q.id, selectedOptionId: null, isCorrect: null });
    } else if (selected === q.correctOptionId) {
      correctCount++;
      earned += marks;
      bucket.correct++;
      bucket.marks += marks;
      perQuestion.push({ questionId: q.id, selectedOptionId: selected, isCorrect: true });
    } else {
      wrongCount++;
      bucket.wrong++;
      bucket.marks -= neg;
      perQuestion.push({ questionId: q.id, selectedOptionId: selected, isCorrect: false });
    }
  }

  const negativeMarks = round2(wrongCount * neg);
  const score = round2(earned - negativeMarks);

  return {
    score,
    correctCount,
    wrongCount,
    skippedCount,
    negativeMarks,
    perQuestion,
    subjectBreakdown: [...bySubject.values()].map((b) => ({ ...b, marks: round2(b.marks) })),
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
