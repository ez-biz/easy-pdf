import type { RotateOptions } from "../options";

export function RotateForm({ value, onChange }: { value: RotateOptions; onChange: (v: RotateOptions) => void }) {
    return (
        <div className="space-y-3 text-sm">
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Angle</span>
                <select className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                    value={value.angle}
                    onChange={(e) => onChange({ ...value, angle: Number(e.target.value) as RotateOptions["angle"] })}>
                    <option value={90}>90° clockwise</option>
                    <option value={180}>180°</option>
                    <option value={270}>270° clockwise</option>
                </select>
            </label>
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Pages</span>
                <select className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                    value={value.scope}
                    onChange={(e) => onChange({ ...value, scope: e.target.value as RotateOptions["scope"] })}>
                    <option value="all">All pages</option>
                    <option value="odd">Odd pages</option>
                    <option value="even">Even pages</option>
                </select>
            </label>
        </div>
    );
}
