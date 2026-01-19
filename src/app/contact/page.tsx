"use client";

import { useState } from "react";
import { Mail, Github, Twitter, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real application, you would send this to a backend
        console.log("Form submitted:", formData);
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ name: "", email: "", subject: "", message: "" });
        }, 3000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-800">
            <div className="max-w-5xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-surface-900 dark:text-white mb-4">
                        Contact Us
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
                        Have questions, feedback, or need support? We&apos;d love to hear from you.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Contact Form */}
                    <div className="md:col-span-2">
                        <div className="bg-white dark:bg-surface-800 rounded-2xl p-8 shadow-xl">
                            <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-6">
                                Send us a message
                            </h2>

                            {submitted ? (
                                <div className="p-6 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-center">
                                    <p className="font-medium">Thank you for your message!</p>
                                    <p className="text-sm mt-2">We&apos;ll get back to you soon.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label
                                                htmlFor="name"
                                                className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                                            >
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="email"
                                                className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                                            >
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="subject"
                                            className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                                        >
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="How can we help?"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="message"
                                            className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                                        >
                                            Message
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows={6}
                                            className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                            placeholder="Tell us more about your question or feedback..."
                                        />
                                    </div>

                                    <Button type="submit" size="lg" className="w-full" leftIcon={<Send className="w-4 h-4" />}>
                                        Send Message
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-xl">
                            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                                Get in Touch
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-3 text-surface-600 dark:text-surface-300">
                                        <Mail className="w-5 h-5 text-primary-600" />
                                        <div>
                                            <p className="text-sm font-medium">Email</p>
                                            <a
                                                href="mailto:support@easypdf.com"
                                                className="text-primary-600 hover:text-primary-700"
                                            >
                                                support@easypdf.com
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-xl">
                            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                                Follow Us
                            </h3>
                            <div className="space-y-3">
                                <a
                                    href="https://github.com/yourusername/easypdf"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-surface-600 dark:text-surface-300 hover:text-primary-600 transition-colors"
                                >
                                    <Github className="w-5 h-5" />
                                    <span>GitHub</span>
                                </a>
                                <a
                                    href="https://twitter.com/easypdf"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-surface-600 dark:text-surface-300 hover:text-primary-600 transition-colors"
                                >
                                    <Twitter className="w-5 h-5" />
                                    <span>Twitter</span>
                                </a>
                            </div>
                        </div>

                        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-2">
                                Privacy First
                            </h3>
                            <p className="text-sm text-primary-700 dark:text-primary-300">
                                All PDF processing happens in your browser. We never store or access your files.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
