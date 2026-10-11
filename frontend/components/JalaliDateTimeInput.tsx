"use client";

import { useEffect, useRef, useState } from "react";
import {
  isoToJalaliParts,
  jalaliPartsToIso,
  JALALI_MONTHS,
  JalaliDateTimeParts,
} from "@/lib/jalali";

interface Props {
  value?: string;
  onChange: (iso: string) => void;
  error?: string;
}

const emptyParts = (): JalaliDateTimeParts => {
  const now = new Date();
  const parts = isoToJalaliParts(now.toISOString());
  return (
    parts ?? {
      year: 1404,
      month: 1,
      day: 1,
      hour: 12,
      minute: 0,
    }
  );
};

export default function JalaliDateTimeInput({ value, onChange, error }: Props) {
  const [parts, setParts] = useState<JalaliDateTimeParts>(emptyParts);
  const timeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value) return;
    const parsed = isoToJalaliParts(value);
    if (parsed) setParts(parsed);
  }, [value]);

  const update = (next: Partial<JalaliDateTimeParts>) => {
    const merged = { ...parts, ...next };
    setParts(merged);
    const iso = jalaliPartsToIso(merged);
    if (iso) onChange(iso);
  };

  const years = Array.from({ length: 6 }, (_, i) => 1403 + i);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        زمان پاسخ‌دهی (تاریخ شمسی)
      </label>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={parts.day}
          onChange={(e) => update({ day: Number(e.target.value) })}
          className="input-field"
        >
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <option key={day} value={day}>
              {day} ام
            </option>
          ))}
        </select>

        <select
          value={parts.month}
          onChange={(e) => update({ month: Number(e.target.value) })}
          className="input-field"
        >
          {JALALI_MONTHS.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={parts.year}
          onChange={(e) => update({ year: Number(e.target.value) })}
          className="input-field"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <input
        ref={timeInputRef}
        type="time"
        value={`${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`}
        onClick={() => timeInputRef.current?.showPicker?.()}
        onChange={(e) => {
          const [hour, minute] = e.target.value.split(":").map(Number);
          update({ hour: hour ?? 0, minute: minute ?? 0 });
        }}
        className="input-field"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
