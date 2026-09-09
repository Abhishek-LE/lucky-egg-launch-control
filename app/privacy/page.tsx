export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-sm text-slate-700">
      <h1 className="mb-4 text-xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mb-3 text-slate-500 text-xs">Last updated: September 2026</p>
      <p className="mb-4">
        Lucky Egg Launch Control is an internal tool used exclusively by Lucky Egg employees.
        It is not available to the general public.
      </p>
      <h2 className="mb-2 font-semibold text-slate-900">Data collected</h2>
      <p className="mb-4">
        When you sign in with Google, we receive your name and email address solely to
        verify that you are a <strong>@luckyegg.co</strong> account holder. This
        information is not stored, shared, or used for any other purpose.
      </p>
      <h2 className="mb-2 font-semibold text-slate-900">Data storage</h2>
      <p className="mb-4">
        Pre-launch checklist data is stored in Google Sheets accessible only to Lucky Egg
        staff. Post-launch data is stored in a private Supabase database.
      </p>
      <h2 className="mb-2 font-semibold text-slate-900">Contact</h2>
      <p>
        Questions? Email{" "}
        <a href="mailto:abhishek@luckyegg.co" className="text-indigo-600 underline">
          abhishek@luckyegg.co
        </a>
        .
      </p>
    </div>
  );
}
