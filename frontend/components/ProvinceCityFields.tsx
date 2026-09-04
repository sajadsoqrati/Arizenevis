"use client";

import {
  IRAN_PROVINCES,
  getCitiesForProvince,
  ALL_IRAN_CITIES,
} from "@/lib/iran-locations";
import {
  UseFormRegister,
  UseFormSetValue,
  FieldErrors,
  FieldValues,
  Path,
} from "react-hook-form";

interface Props<T extends FieldValues> {
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  watchProvince: string;
  watchCity: string;
  errors: FieldErrors<T>;
}

export default function ProvinceCityFields<T extends FieldValues>({
  register,
  setValue,
  watchProvince,
  watchCity,
  errors,
}: Props<T>) {
  const cityOptions = watchProvince
    ? getCitiesForProvince(watchProvince)
    : ALL_IRAN_CITIES;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">استان</label>
        <select
          {...register("province" as Path<T>, {
            onChange: (e) => {
              const newProvince = e.target.value;
              if (newProvince && watchCity) {
                const cities = getCitiesForProvince(newProvince);
                if (!cities.includes(watchCity)) {
                  setValue("city" as Path<T>, "" as never, { shouldValidate: true });
                }
              }
            },
          })}
          className="input-field"
        >
          <option value="">انتخاب استان</option>
          {IRAN_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {errors.province && (
          <p className="text-red-500 text-sm mt-1">
            {(errors.province as { message?: string }).message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">شهر</label>
        <select
          {...register("city" as Path<T>)}
          className="input-field"
          disabled={cityOptions.length === 0}
        >
          <option value="">انتخاب شهر</option>
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.city && (
          <p className="text-red-500 text-sm mt-1">
            {(errors.city as { message?: string }).message}
          </p>
        )}
      </div>
    </div>
  );
}
