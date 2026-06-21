import type { MetadataOptions } from "../options";

const FIELDS: { key: keyof MetadataOptions; label: string }[] = [
    { key: "title", label: "Title" }, { key: "author", label: "Author" },
    { key: "subject", label: "Subject" }, { key: "keywords", label: "Keywords (comma-separated)" },
];

export function MetadataForm({ value, onChange }: { value: MetadataOptions; onChange: (v: MetadataOptions) => void }) {
    return (
        <div className="space-y-3 text-sm">
            {FIELDS.map((f) => (
                <label key={f.key} className="block">
                    <span className="text-gray-600 dark:text-gray-300">{f.label}</span>
                    <input className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                        value={value[f.key]} onChange={(e) => onChange({ ...value, [f.key]: e.target.value })} />
                </label>
            ))}
        </div>
    );
}
