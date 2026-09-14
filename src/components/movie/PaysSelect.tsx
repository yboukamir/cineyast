import { useId } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { PAYS } from "@/lib/pays";

/** Choix du pays des offres : détecté au départ, mémorisé dans le navigateur une fois changé. */
export function PaysSelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="text-sm font-bold">
        Pays
      </label>
      <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value)} className="w-52">
        {PAYS.map((pays) => (
          <option key={pays.code} value={pays.code}>
            {pays.nom}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
