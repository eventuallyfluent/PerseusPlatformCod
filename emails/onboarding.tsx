type OnboardingProps = {
  courseTitle: string;
};

export function OnboardingEmail({ courseTitle }: OnboardingProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "24px", color: "#111827" }}>
      <h1>Welcome to {courseTitle}</h1>
      <p>Your learner dashboard is ready.</p>
      <p>Start with the preview lesson, then continue through the curriculum as lessons unlock.</p>
    </div>
  );
}
