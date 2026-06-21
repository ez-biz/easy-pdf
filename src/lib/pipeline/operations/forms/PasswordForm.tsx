import type { PasswordOptions } from "../options";

export function PasswordForm({ value, onChange }: { value: PasswordOptions; onChange: (v: PasswordOptions) => void }) {
    return (
        <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-300">Password</span>
            <input type="password" className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2"
                value={value.password} onChange={(e) => onChange({ ...value, password: e.target.value })} />
        </label>
    );
}
