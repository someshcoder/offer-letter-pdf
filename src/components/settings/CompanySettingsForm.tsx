"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Upload, Loader2, CheckCircle2, Globe, Mail, Phone, MapPin, Building } from "lucide-react";
import toast from "react-hot-toast";
import { FormSkeleton } from "@/components/SkeletonLoader";
import {
  btnPrimary,
  formInput,
  formLabel,
  formSectionDesc,
  formSectionTitle,
  formTextarea,
  FormField,
} from "@/components/ui/FormUi";

export default function CompanySettingsForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    companyName: "",
    companyEmail: "",
    companyMobile: "",
    companyWebsite: "",
    companyAddress: "",
    companyLogo: { url: "" },
    directorSignature: { url: "" },
    seniorHrSignature: { url: "" },
  });

  const [previews, setPreviews] = useState<any>({
    logo: "",
    director: "",
    hr: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/company");
      const data = await res.json();
      if (data) {
        setSettings(data);
        setPreviews({
          logo: data.companyLogo?.url || "",
          director: data.directorSignature?.url || "",
          hr: data.seniorHrSignature?.url || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev: any) => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("companyName", settings.companyName);
      formData.append("companyEmail", settings.companyEmail);
      formData.append("companyMobile", settings.companyMobile);
      formData.append("companyWebsite", settings.companyWebsite);
      formData.append("companyAddress", settings.companyAddress);

      const logoInput = document.getElementById("logo-upload") as HTMLInputElement;
      if (logoInput.files?.[0]) formData.append("companyLogo", logoInput.files[0]);

      const directorInput = document.getElementById("director-sign-upload") as HTMLInputElement;
      if (directorInput.files?.[0]) formData.append("directorSignature", directorInput.files[0]);

      const hrInput = document.getElementById("hr-sign-upload") as HTMLInputElement;
      if (hrInput.files?.[0]) formData.append("seniorHrSignature", hrInput.files[0]);

      const res = await fetch("/api/settings/company", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Settings saved successfully");
        fetchSettings();
        router.refresh();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast.error("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <FormSkeleton rows={3} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className={formSectionTitle}>Company Information</h2>
        <p className={formSectionDesc}>Basic details about your organization.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField label="Company Name">
          <div className="relative">
            <Building className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              name="companyName"
              value={settings.companyName}
              onChange={handleChange}
              placeholder="Enter company name"
              className={`${formInput} pl-10`}
            />
          </div>
        </FormField>

        <FormField label="Company Email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              name="companyEmail"
              value={settings.companyEmail}
              onChange={handleChange}
              placeholder="contact@company.com"
              className={`${formInput} pl-10`}
            />
          </div>
        </FormField>

        <FormField label="Mobile Number">
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              name="companyMobile"
              value={settings.companyMobile}
              onChange={handleChange}
              placeholder="+91 0000000000"
              className={`${formInput} pl-10`}
            />
          </div>
        </FormField>

        <FormField label="Website URL">
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              name="companyWebsite"
              value={settings.companyWebsite}
              onChange={handleChange}
              placeholder="https://www.company.com"
              className={`${formInput} pl-10`}
            />
          </div>
        </FormField>

        <FormField label="Company Address" className="md:col-span-2">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3.5 top-3 size-4 text-slate-400" />
            <textarea
              name="companyAddress"
              value={settings.companyAddress}
              onChange={handleChange}
              placeholder="Full office address"
              rows={3}
              className={`${formTextarea} pl-10`}
            />
          </div>
        </FormField>
      </div>

      <hr className="border-slate-100 dark:border-slate-800" />

      <div>
        <h2 className={formSectionTitle}>Assets & Signatures</h2>
        <p className={formSectionDesc}>Upload your logo and authorized signatures.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Company Logo */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Company Logo</label>
          <div className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-950">
            {previews.logo ? (
              <img src={previews.logo} alt="Logo Preview" className="h-full w-full object-contain p-4" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Upload className="size-8" />
                <span className="text-xs">Upload Logo</span>
              </div>
            )}
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "logo")}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>
        </div>

        {/* Director Signature */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Director Signature</label>
          <div className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-950">
            {previews.director ? (
              <img src={previews.director} alt="Director Sign Preview" className="h-full w-full object-contain p-4" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Upload className="size-8" />
                <span className="text-xs">Upload Signature</span>
              </div>
            )}
            <input
              id="director-sign-upload"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "director")}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>
        </div>

        {/* Senior HR Signature */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Senior HR Signature</label>
          <div className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-950">
            {previews.hr ? (
              <img src={previews.hr} alt="HR Sign Preview" className="h-full w-full object-contain p-4" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Upload className="size-8" />
                <span className="text-xs">Upload Signature</span>
              </div>
            )}
            <input
              id="hr-sign-upload"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "hr")}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving} className={`${btnPrimary} px-8 py-3`}>
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </form>
  );
}
