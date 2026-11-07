import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — Store Management" },
      { name: "description", content: "Manage your store settings" },
      { property: "og:title", content: "Settings — Store Management" },
      { property: "og:description", content: "Manage your store settings" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SettingsPage() {
  const [storeName, setStoreName] = useState("Acme Store");
  const [email, setEmail] = useState("hello@acme.com");
  const [currency, setCurrency] = useState("USD");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [autoFulfill, setAutoFulfill] = useState(false);

  function save() {
    toast.success("Settings saved");
  }

  return (
    <AdminShell title="Settings" subtitle="Store preferences">
      <Section title="Store details" description="Public information about your store.">
        <Field label="Store name">
          <input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full h-9 px-3 rounded-md bg-card border border-border text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </Field>
        <Field label="Contact email">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-9 px-3 rounded-md bg-card border border-border text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </Field>
        <Field label="Currency">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full h-9 px-3 rounded-md bg-card border border-border text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>JPY</option>
          </select>
        </Field>
      </Section>

      <Section title="Notifications" description="Choose how you'd like to be notified.">
        <Toggle label="Email me on new orders" checked={emailNotifs} onChange={setEmailNotifs} />
        <Toggle label="Auto-fulfill digital products" checked={autoFulfill} onChange={setAutoFulfill} />
      </Section>

      <div className="flex justify-end">
        <button
          onClick={save}
          className="h-9 px-4 rounded-md bg-foreground text-background text-[13px] font-medium hover:bg-foreground/90 transition-colors"
        >
          Save changes
        </button>
      </div>
    </AdminShell>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-card border border-border p-5 sm:p-6">
      <h3 className="text-[13px] font-medium text-foreground">{title}</h3>
      <p className="text-[12px] text-muted-foreground mb-5">{description}</p>
      <div className="space-y-4 max-w-md">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full max-w-md py-1.5"
    >
      <span className="text-[13px] text-foreground">{label}</span>
      <span
        className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-foreground" : "bg-surface"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-card border border-border transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
