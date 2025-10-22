"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";

type Props = { orgId: string; initialCompanyName: string };

type Stored = {
  companyName: string;
  website: string;
  cloudLink: string;
  tz: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  acceptStatusEmails: boolean;
  acceptResultsInServices: boolean;
};

const AWST_TZ = "Australia/Perth"; // AWST

export default function OnboardingFormClient({ orgId, initialCompanyName }: Props) {
  const storageKey = `onboarding:${orgId}`;
  const [isPending, startTransition] = useTransition();

  // Fields
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [website, setWebsite] = useState("https://");
  const [cloudLink, setCloudLink] = useState("");
  // Time window is fixed to AWST (Australia/Perth)
  const [tz, setTz] = useState(AWST_TZ);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [acceptStatusEmails, setAcceptStatusEmails] = useState(false);
  const [acceptResultsInServices, setAcceptResultsInServices] = useState(false);

  // File (not stored in localStorage)
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Load persisted values once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const s: Partial<Stored> = JSON.parse(raw);
        if (s.companyName) setCompanyName(s.companyName);
        if (s.website) setWebsite(s.website);
        if (s.cloudLink) setCloudLink(s.cloudLink);
        // Force AWST regardless of previous saved tz
        setTz(AWST_TZ);
        if (s.date) setDate(s.date);
        if (s.time) setTime(s.time);
        if (typeof s.acceptStatusEmails === "boolean") setAcceptStatusEmails(s.acceptStatusEmails);
        if (typeof s.acceptResultsInServices === "boolean") setAcceptResultsInServices(s.acceptResultsInServices);
      } else {
        setTz(AWST_TZ);
      }
    } catch {}
  }, [storageKey]);

  // Persist (except file)
  useEffect(() => {
    const s: Stored = {
      companyName,
      website,
      cloudLink,
      tz, // always AWST here
      date,
      time,
      acceptStatusEmails,
      acceptResultsInServices,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {}
  }, [storageKey, companyName, website, cloudLink, tz, date, time, acceptStatusEmails, acceptResultsInServices]);

  // Time slots — fixed 11:00–14:00 AWST, 30-min blocks
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const startH = 11;
    const endHExclusive = 14; // last slot starts 13:30
    for (let h = startH; h < endHExclusive; h++) {
      for (const m of [0, 30]) {
        slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return slots; // ["11:00","11:30","12:00","12:30","13:00","13:30"]
  }, []);

  // File (10MB cap)
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFileError(null);
    setFile(null);
    if (!f) return;
    const max = 10 * 1024 * 1024;
    if (f.size > max) {
      setFileError("File exceeds 10MB limit.");
      toast.error("Upload failed — file exceeds 10MB.");
      return;
    }
    setFile(f);
  }

  // Only allow Mon–Fri; if weekend, clear and warn
  function onDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value; // YYYY-MM-DD
    if (!v) return setDate(v);
    const d = new Date(`${v}T00:00:00`);
    const day = d.getUTCDay(); // 0 Sun .. 6 Sat (UTC is fine for weekday check)
    if (day === 0 || day === 6) {
      toast.error("Please choose a weekday (Mon–Fri).");
      e.target.value = "";
      setDate("");
      return;
    }
    setDate(v);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!companyName.trim()) return toast.error("Company Name is required.");
    if (!date) return toast.error("Select a date (Mon–Fri).");
    if (!time) return toast.error("Select a time slot.");
    if (!acceptStatusEmails || !acceptResultsInServices) {
      return toast.error("Please accept both confirmations.");
    }

    const url = process.env.NEXT_PUBLIC_WEBHOOK_ONBOARDING_URL;
    if (!url) {
      toast.error("Missing webhook URL (NEXT_PUBLIC_WEBHOOK_ONBOARDING_URL).");
      return;
    }

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("orgId", orgId);
        fd.append("companyName", companyName);
        fd.append("website", website);
        fd.append("cloudLink", cloudLink);
        fd.append("timeZone", tz); // always "Australia/Perth" (AWST)
        fd.append("date", date);
        fd.append("time", time);
        fd.append("acceptStatusEmails", String(acceptStatusEmails));
        fd.append("acceptResultsInServices", String(acceptResultsInServices));
        if (file) {
          fd.append("file", file, file.name);
          fd.append("fileName", file.name);
          fd.append("fileSize", String(file.size));
          fd.append("fileType", file.type || "application/octet-stream");
        }

        const res = await fetch(url, { method: "POST", body: fd });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Webhook failed");
        }

        toast.success("Onboarding submitted. We’ll be in touch!");
      } catch (err: any) {
        toast.error(err?.message ?? "Submission failed");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:max-w-2xl">
      <div>
        <label className="mb-1 block text-xs">Company Name</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company Inc."
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">Prefilled from Organization. You can tweak it.</p>
      </div>

      <div>
        <label className="mb-1 block text-xs">Website</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs">Upload List (CSV / Excel) — max 10MB</label>
        <input
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={onFileChange}
          className="w-full rounded border px-3 py-2 text-sm file:mr-3 file:rounded file:border file:px-3 file:py-1"
        />
        {fileError ? <p className="mt-1 text-xs text-destructive">{fileError}</p> : null}
        {file ? <p className="mt-1 text-xs text-muted-foreground">Selected: {file.name}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-xs">
          Cloud Storage Sharable Link (Google Drive, Dropbox, etc.)
        </label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={cloudLink}
          onChange={(e) => setCloudLink(e.target.value)}
          placeholder="https://drive.google.com/..."
        />
      </div>

      <fieldset className="grid gap-2 rounded border p-3">
        <legend className="px-1 text-xs font-medium">Book a Setup Session</legend>
        <div className="grid gap-2 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs">Time Zone</label>
            <input
              readOnly
              className="w-full rounded border bg-muted/50 px-3 py-2 text-sm"
              value={`${AWST_TZ} (AWST)`}
              title="Time slots are fixed to AWST"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Slots are available Monday–Friday, 11:00–14:00 <strong>AWST</strong>.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs">Date (Mon–Fri)</label>
            <input
              type="date"
              className="w-full rounded border px-3 py-2 text-sm"
              value={date}
              onChange={onDateChange}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs">Time Slot (AWST)</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            >
              <option value="" disabled>
                Select time
              </option>
              {timeSlots.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={acceptStatusEmails}
          onChange={(e) => setAcceptStatusEmails(e.target.checked)}
          required
        />
        <span>I understand that I will receive campaign status updates via email and/or SMS.</span>
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={acceptResultsInServices}
          onChange={(e) => setAcceptResultsInServices(e.target.checked)}
          required
        />
        <span>I understand that results will appear under Services.</span>
      </label>

      <div className="pt-2">
        <LoadingButton loading={isPending} className="w-full md:w-auto" type="submit">
          Submit
        </LoadingButton>
      </div>
    </form>
  );
}
