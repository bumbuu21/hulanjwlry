"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, RefreshCw } from "lucide-react";
export function CopyButton({ value, label = "Хуулах" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false),
    [error, setError] = useState(false);
  return (
    <button
      className="text-link"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setError(false);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          setError(true);
        }
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {error ? "Гараар хуулна уу" : copied ? "Хууллаа" : label}
    </button>
  );
}
export function RefreshOrder() {
  const router = useRouter();
  return (
    <button className="button outline" onClick={() => router.refresh()}>
      <RefreshCw size={16} /> Төлөв шинэчлэх
    </button>
  );
}
