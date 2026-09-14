"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Input, Label, Select, Textarea, FormError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PARTNER_TYPE_LABELS } from "@/lib/constants";

const STEPS = ["Basic Info", "Professional Info", "Verification", "Business Profile", "Agreement"] as const;

interface FormState {
  fullName: string;
  email: string;
  mobile: string;
  company: string;
  role: string;
  type: string;
  brokerNumber: string;
  orn: string;
  brokerage: string;
  specialization: string;
  areas: string;
  experienceYears: string;
  licenseInfo: string;
  practiceCardInfo: string;
  businessFocus: string[];
  acceptedTerms: boolean;
}

const INITIAL_STATE: FormState = {
  fullName: "",
  email: "",
  mobile: "",
  company: "",
  role: "",
  type: "INDEPENDENT_BROKER",
  brokerNumber: "",
  orn: "",
  brokerage: "",
  specialization: "",
  areas: "",
  experienceYears: "",
  licenseInfo: "",
  practiceCardInfo: "",
  businessFocus: [],
  acceptedTerms: false,
};

const BUSINESS_FOCUS_OPTIONS = ["Sales", "Leasing", "Off-plan", "Commercial", "Luxury", "Investment"];

export function ApplyWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.fullName.trim()) return "Full name is required";
      if (!/^\S+@\S+\.\S+$/.test(form.email)) return "A valid email is required";
      if (form.mobile.trim().length < 6) return "A valid mobile number is required";
    }
    if (step === 4 && !form.acceptedTerms) return "You must accept the partner terms";
    return null;
  }

  function next() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          areas: form.areas.split(",").map((a) => a.trim()).filter(Boolean),
          experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-lg p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-champagne-dark" />
        <h2 className="mt-4 font-display text-2xl font-semibold text-charcoal">Application Submitted</h2>
        <p className="mt-3 text-charcoal/60">
          Your application status is <strong>Pending Verification</strong>. Our
          compliance team will review your details and follow up by email.
        </p>
        <Button href="/" variant="outline" className="mt-6">
          Return to homepage
        </Button>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl p-8">
      <ol className="mb-8 flex flex-wrap gap-2 text-xs">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1 ${index === step ? "bg-champagne text-charcoal" : index < step ? "bg-charcoal/10 text-charcoal/60" : "bg-charcoal/5 text-charcoal/40"}`}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="mobile">Mobile</Label>
            <Input id="mobile" value={form.mobile} onChange={(e) => update("mobile", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="company">Company (optional)</Label>
            <Input id="company" value={form.company} onChange={(e) => update("company", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="role">Role (optional)</Label>
            <Input id="role" value={form.role} onChange={(e) => update("role", e.target.value)} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Partner type</Label>
            <Select id="type" value={form.type} onChange={(e) => update("type", e.target.value)}>
              {Object.entries(PARTNER_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="brokerNumber">Broker number</Label>
            <Input id="brokerNumber" value={form.brokerNumber} onChange={(e) => update("brokerNumber", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="orn">ORN</Label>
            <Input id="orn" value={form.orn} onChange={(e) => update("orn", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="brokerage">Brokerage</Label>
            <Input id="brokerage" value={form.brokerage} onChange={(e) => update("brokerage", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="specialization">Specialization</Label>
            <Input id="specialization" value={form.specialization} onChange={(e) => update("specialization", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="areas">Areas (comma separated)</Label>
            <Input id="areas" placeholder="Dubai Marina, JVC" value={form.areas} onChange={(e) => update("areas", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="experienceYears">Years of experience</Label>
            <Input id="experienceYears" type="number" min={0} value={form.experienceYears} onChange={(e) => update("experienceYears", e.target.value)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="licenseInfo">License information</Label>
            <Textarea id="licenseInfo" value={form.licenseInfo} onChange={(e) => update("licenseInfo", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="practiceCardInfo">Practice card information</Label>
            <Textarea id="practiceCardInfo" value={form.practiceCardInfo} onChange={(e) => update("practiceCardInfo", e.target.value)} />
          </div>
          <p className="text-xs text-charcoal/50">
            Our compliance team performs manual verification. This is not an
            official DLD verification service.
          </p>
        </div>
      )}

      {step === 3 && (
        <div>
          <Label>Business focus</Label>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_FOCUS_OPTIONS.map((option) => {
              const active = form.businessFocus.includes(option);
              return (
                <button
                  type="button"
                  key={option}
                  onClick={() =>
                    update(
                      "businessFocus",
                      active ? form.businessFocus.filter((o) => o !== option) : [...form.businessFocus, option],
                    )
                  }
                  className={`focus-ring rounded-full border px-4 py-2 text-sm ${active ? "border-champagne bg-champagne/20 text-charcoal" : "border-charcoal/15 text-charcoal/60"}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <label className="flex items-start gap-3 text-sm text-charcoal/70">
            <input
              type="checkbox"
              checked={form.acceptedTerms}
              onChange={(e) => update("acceptedTerms", e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            I accept the partner terms and agree to the platform&apos;s
            compliance and verification requirements.
          </label>
        </div>
      )}

      <FormError>{error}</FormError>

      <div className="mt-8 flex justify-between">
        <Button type="button" variant="outline" onClick={back} disabled={step === 0}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button type="button" onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Application"}
          </Button>
        )}
      </div>
    </Card>
  );
}
