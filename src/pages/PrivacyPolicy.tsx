import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-full bg-background pb-20">
      <header className="safe-top px-5 pb-3 pt-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-serif font-bold">Privacy policy</h1>
      </header>

      <main className="px-5 space-y-4 text-[14px] leading-relaxed text-foreground/90">
        <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <h2 className="text-base font-bold">Your data stays on your device</h2>
          <p className="text-muted-foreground">
            Daily Routines is an offline-first app. Your routines, tasks, history, moods, and
            settings are stored locally on your device. We do not run servers, accounts, or
            cloud sync.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <h2 className="text-base font-bold">No tracking, no analytics</h2>
          <p className="text-muted-foreground">
            We don't collect, transmit, or sell any personal information. There are no third
            party analytics, ads, or trackers in the app.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <h2 className="text-base font-bold">Backups &amp; imports</h2>
          <p className="text-muted-foreground">
            When you export a backup, the file is saved directly to your device. If you choose
            to share it, you alone control where it goes.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <h2 className="text-base font-bold">Permissions</h2>
          <p className="text-muted-foreground">
            Notifications (if enabled) are scheduled locally on your device. No data is sent
            to any external server.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <h2 className="text-base font-bold">Contact</h2>
          <p className="text-muted-foreground">
            Questions or feedback? Email{" "}
            <a className="underline" href="mailto:try.sandeshk@gmail.com">
              try.sandeshk@gmail.com
            </a>
            .
          </p>
        </section>

        <p className="text-[12px] text-muted-foreground/80 text-center pt-2">
          Last updated: May 2026
        </p>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
