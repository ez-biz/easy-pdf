import type { WatermarkOptions } from "../options";

const POSITIONS = ["diagonal", "center", "top-left", "top-right", "bottom-left", "bottom-right"] as const;

export function WatermarkForm({ value, onChange }: { value: WatermarkOptions; onChange: (v: WatermarkOptions) => void }) {
    return (
        <div className="space-y-3 text-sm">
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Text</span>
                <input className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                    value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} />
            </label>
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Opacity: {Math.round(value.opacity * 100)}%</span>
                <input type="range" min={0.05} max={1} step={0.05} className="mt-1 w-full"
                    value={value.opacity} onChange={(e) => onChange({ ...value, opacity: Number(e.target.value) })} />
            </label>
            <label className="block">
                <span className="text-gray-600 dark:text-gray-300">Position</span>
                <select className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                    value={value.position} onChange={(e) => onChange({ ...value, position: e.target.value as WatermarkOptions["position"] })}>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
            </label>
        </div>
    );
}
