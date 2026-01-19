"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, BarChart3, Clock, Trash2, Save, Moon, Sun } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { TOOLS } from "@/lib/constants";

export default function SettingsPage() {
    const {
        settings,
        updateSettings,
        toggleDarkMode,
        recentActivity,
        removeActivity,
        clearActivity,
        totalProcessed
    } = useAppStore();

    const [hasChanges, setHasChanges] = useState(false);
    const [localSettings, setLocalSettings] = useState(settings);

    // Sync localSettings with store when it hydrates from localStorage
    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSettingChange = (key: keyof typeof settings, value: string | boolean) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        updateSettings(localSettings);
        setHasChanges(false);
    };

    const handleClearHistory = () => {
        if (confirm("Are you sure you want to clear all activity history?")) {
            clearActivity();
        }
    };

    // Calculate most used tool
    const toolCounts = recentActivity.reduce((acc, activity) => {
        acc[activity.toolName] = (acc[activity.toolName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const mostUsedTool = Object.entries(toolCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || "None yet";

    // Format timestamp
    const formatTimestamp = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-950 dark:to-surface-900">
            {/* Header */}
            <div className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                            <SettingsIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
                                Settings & Activity
                            </h1>
                            <p className="text-surface-600 dark:text-surface-400">
                                Manage your preferences and view your history
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column - Stats & Activity */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Total Processed */}
                            <div className="bg-white dark:bg-surface-900 rounded-xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-surface-600 dark:text-surface-400">
                                            Total Processed
                                        </p>
                                        <p className="text-3xl font-bold text-surface-900 dark:text-white">
                                            {totalProcessed}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Most Used Tool */}
                            <div className="bg-white dark:bg-surface-900 rounded-xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-surface-600 dark:text-surface-400">
                                            Most Used
                                        </p>
                                        <p className="text-lg font-semibold text-surface-900 dark:text-white truncate">
                                            {mostUsedTool}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
                            <div className="p-6 border-b border-surface-200 dark:border-surface-800">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                                        Recent Activity
                                    </h2>
                                    {recentActivity.length > 0 && (
                                        <Button
                                            variant="outline"
                                            onClick={handleClearHistory}
                                            size="sm"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="p-6">
                                {recentActivity.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Clock className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-3" />
                                        <p className="text-surface-500 dark:text-surface-400">
                                            No activity yet
                                        </p>
                                        <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">
                                            Start processing PDFs to see your history here
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {recentActivity.map((activity) => {
                                            const tool = TOOLS.find(t => t.name === activity.toolName);
                                            return (
                                                <div
                                                    key={activity.id}
                                                    className="group flex items-start gap-4 p-4 rounded-lg bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors relative"
                                                >
                                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${tool?.color || 'from-gray-500 to-gray-600'} flex-shrink-0`}>
                                                        <div className="w-5 h-5 bg-white/20 rounded" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-surface-900 dark:text-white">
                                                            {activity.toolName}
                                                        </p>
                                                        <p className="text-sm text-surface-600 dark:text-surface-400 truncate">
                                                            {activity.fileName}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="text-xs text-surface-500 dark:text-surface-400">
                                                            {formatTimestamp(activity.timestamp)}
                                                        </span>
                                                        <button
                                                            onClick={() => removeActivity(activity.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-surface-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                                                            title="Remove this item"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Settings */}
                    <div className="space-y-6">

                        {/* Appearance */}
                        <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
                            <div className="p-6 border-b border-surface-200 dark:border-surface-800">
                                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                                    Appearance
                                </h2>
                            </div>
                            <div className="p-6">
                                <button
                                    onClick={toggleDarkMode}
                                    className="w-full flex items-center justify-between p-4 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                                >
                                    <div>
                                        <span className="font-medium text-surface-900 dark:text-white block">
                                            Theme
                                        </span>
                                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                            {settings.isDarkMode ? 'Dark Mode' : 'Light Mode'}
                                        </span>
                                    </div>
                                    {settings.isDarkMode ? (
                                        <Moon className="w-5 h-5 text-primary-500" />
                                    ) : (
                                        <Sun className="w-5 h-5 text-amber-500" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
                            <div className="p-6 border-b border-surface-200 dark:border-surface-800">
                                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                                    Default Preferences
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">

                                {/* Page Size */}
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                        Page Size
                                    </label>
                                    <select
                                        value={localSettings.defaultPageSize}
                                        onChange={(e) => handleSettingChange('defaultPageSize', e.target.value as 'a4' | 'letter')}
                                        className="w-full px-4 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="a4">A4 (210 × 297 mm)</option>
                                        <option value="letter">Letter (8.5 × 11 in)</option>
                                    </select>
                                </div>

                                {/* Orientation */}
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                        Orientation
                                    </label>
                                    <select
                                        value={localSettings.defaultOrientation}
                                        onChange={(e) => handleSettingChange('defaultOrientation', e.target.value as 'portrait' | 'landscape')}
                                        className="w-full px-4 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="portrait">Portrait</option>
                                        <option value="landscape">Landscape</option>
                                    </select>
                                </div>

                                {/* Compression Level */}
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                        Default Compression
                                    </label>
                                    <select
                                        value={localSettings.compressionLevel}
                                        onChange={(e) => handleSettingChange('compressionLevel', e.target.value as 'extreme' | 'recommended' | 'less')}
                                        className="w-full px-4 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="extreme">Extreme (Smallest)</option>
                                        <option value="recommended">Recommended (Balanced)</option>
                                        <option value="less">Less (Best Quality)</option>
                                    </select>
                                </div>

                                {/* Save Button */}
                                {hasChanges && (
                                    <Button
                                        onClick={handleSave}
                                        className="w-full"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Data */}
                        <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-sm">
                            <div className="p-6 border-b border-surface-200 dark:border-surface-800">
                                <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
                                    Privacy
                                </h2>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                                    All your data is stored locally in your browser. Nothing is sent to our servers.
                                </p>
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        🔒 <strong>100% Private</strong> - Your files and activity never leave your device
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
