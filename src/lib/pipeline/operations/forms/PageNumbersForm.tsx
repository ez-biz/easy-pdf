import type { PageNumbersOptions } from "../options";

const FORMATS = [
    { v: "number", label: "1, 2, 3" },
    { v: "page-number", label: "Page 1" },
    { v: "number-of-total", label: "1 of N" },
] as const;
const POSITIONS = ["bottom-center", "bottom-left", "bottom-right", "top-center", "top-left", "top-right"] as const;

export function PageNumbersForm({ value, onChange }: { value: PageNumbersOptions; onChange: (v: PageNumbersOptions) => void }) {
    return (
        <div className="space-y-3 text-sm">
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Format</span>
                <select className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                    value={value.format} onChange={(e) => onChange({ ...value, format: e.target.value as PageNumbersOptions["format"] })}>
                    {FORMATS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
                </select>
            </label>
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Position</span>
                <select className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                    value={value.position} onChange={(e) => onChange({ ...value, position: e.target.value as PageNumbersOptions["position"] })}>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
            </label>
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Start at</span>
                <input type="number" min={1} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                    value={value.startNumber} onChange={(e) => onChange({ ...value, startNumber: Math.max(1, Number(e.target.value) || 1) })} />
            </label>
        </div>
    );
}
