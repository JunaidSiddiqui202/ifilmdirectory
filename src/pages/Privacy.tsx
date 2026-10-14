import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
            {/* Header */}
            <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-4 transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back
                    </button>
                    <h1 className="text-4xl font-bold">Privacy Policy</h1>
                    <p className="text-[var(--color-text-secondary)] mt-2">
                        Last updated: December 29, 2025
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="prose prose-invert max-w-none">
                    {/* Introduction */}
                    <section className="mb-12">
                        <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                            Welcome to iFilmDirectory. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy will inform you about how we look after your personal data when you visit our platform
                            and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            1. Information We Collect
                        </h2>
                        <div className="space-y-4 text-[var(--color-text-secondary)]">
                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    1.1 Information You Provide
                                </h3>
                                <ul className="list-disc ml-6 space-y-2">
                                    <li><strong>Account Information:</strong> Name, email address, phone number, and profile picture</li>
                                    <li><strong>Profile Data:</strong> Professional information, skills, experience, portfolio items, showreels</li>
                                    <li><strong>Content:</strong> Posts, comments, messages, job listings, and other content you create</li>
                                    <li><strong>Payment Information:</strong> Billing details for premium features (processed securely by third-party providers)</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    1.2 Information We Collect Automatically
                                </h3>
                                <ul className="list-disc ml-6 space-y-2">
                                    <li><strong>Usage Data:</strong> How you interact with our platform, features used, pages visited</li>
                                    <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                                    <li><strong>Location Data:</strong> Approximate location based on IP address (for location-based features)</li>
                                    <li><strong>Cookies:</strong> We use cookies and similar technologies to enhance your experience</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* How We Use Your Information */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            2. How We Use Your Information
                        </h2>
                        <div className="text-[var(--color-text-secondary)] space-y-2">
                            <p>We use your information to:</p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Provide, maintain, and improve our services</li>
                                <li>Create and manage your account</li>
                                <li>Connect you with film professionals, production houses, and opportunities</li>
                                <li>Process transactions and send related information</li>
                                <li>Send you technical notices, updates, security alerts, and support messages</li>
                                <li>Respond to your comments, questions, and customer service requests</li>
                                <li>Communicate about products, services, offers, and events</li>
                                <li>Monitor and analyze trends, usage, and activities</li>
                                <li>Detect, prevent, and address technical issues and fraudulent activity</li>
                                <li>Personalize your experience and provide relevant content and recommendations</li>
                            </ul>
                        </div>
                    </section>

                    {/* Information Sharing */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            3. How We Share Your Information
                        </h2>
                        <div className="text-[var(--color-text-secondary)] space-y-4">
                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    3.1 Public Information
                                </h3>
                                <p>
                                    Your profile information, posts, showreels, and portfolio items are publicly visible to other users
                                    of the platform to facilitate networking and collaboration.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    3.2 Service Providers
                                </h3>
                                <p>
                                    We share information with third-party service providers who perform services on our behalf, including:
                                </p>
                                <ul className="list-disc ml-6 space-y-2 mt-2">
                                    <li>Cloud hosting providers (Firebase, Google Cloud)</li>
                                    <li>Analytics providers (Google Analytics)</li>
                                    <li>Payment processors</li>
                                    <li>Email service providers</li>
                                    <li>AI service providers (for content enhancement features)</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    3.3 Legal Requirements
                                </h3>
                                <p>
                                    We may disclose your information if required by law or in response to valid requests by public authorities.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Data Security */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            4. Data Security
                        </h2>
                        <p className="text-[var(--color-text-secondary)]">
                            We implement appropriate technical and organizational measures to protect your personal data against
                            unauthorized or unlawful processing, accidental loss, destruction, or damage. However, no method of
                            transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                        </p>
                    </section>

                    {/* Your Rights */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            5. Your Rights and Choices
                        </h2>
                        <div className="text-[var(--color-text-secondary)] space-y-2">
                            <p>You have the right to:</p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li><strong>Access:</strong> Request access to your personal data</li>
                                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                                <li><strong>Portability:</strong> Request a copy of your data in a structured format</li>
                                <li><strong>Objection:</strong> Object to processing of your personal data</li>
                                <li><strong>Restriction:</strong> Request restriction of processing your personal data</li>
                                <li><strong>Withdraw Consent:</strong> Withdraw consent at any time (where processing is based on consent)</li>
                            </ul>
                            <p className="mt-4">
                                To exercise these rights, please contact us at <a href="mailto:ifilmdirectory@gmail.com" className="text-[var(--color-primary)] hover:underline">ifilmdirectory@gmail.com</a>
                            </p>
                        </div>
                    </section>

                    {/* Cookies */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            6. Cookies and Tracking Technologies
                        </h2>
                        <p className="text-[var(--color-text-secondary)]">
                            We use cookies and similar tracking technologies to track activity on our platform and hold certain information.
                            Cookies are files with small amounts of data. You can instruct your browser to refuse all cookies or to
                            indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use
                            some portions of our platform.
                        </p>
                    </section>

                    {/* Third-Party Links */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            7. Third-Party Links
                        </h2>
                        <p className="text-[var(--color-text-secondary)]">
                            Our platform may contain links to third-party websites. We are not responsible for the privacy practices
                            or content of these third-party sites. We encourage you to read the privacy policies of any third-party
                            sites you visit.
                        </p>
                    </section>

                    {/* Children's Privacy */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            8. Children's Privacy
                        </h2>
                        <p className="text-[var(--color-text-secondary)]">
                            Our platform is not intended for children under 13 years of age. We do not knowingly collect personal
                            information from children under 13. If you are a parent or guardian and believe your child has provided
                            us with personal information, please contact us.
                        </p>
                    </section>

                    {/* International Transfers */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            9. International Data Transfers
                        </h2>
                        <p className="text-[var(--color-text-secondary)]">
                            Your information may be transferred to and maintained on servers located outside of your country where
                            data protection laws may differ. By using our platform, you consent to the transfer of your information
                            to our facilities and service providers.
                        </p>
                    </section>

                    {/* Changes to Privacy Policy */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            10. Changes to This Privacy Policy
                        </h2>
                        <p className="text-[var(--color-text-secondary)]">
                            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
                            Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy
                            Policy periodically for any changes.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            11. Contact Us
                        </h2>
                        <div className="text-[var(--color-text-secondary)]">
                            <p className="mb-4">
                                If you have any questions about this Privacy Policy, please contact us:
                            </p>
                            <div className="bg-[var(--color-surface)] p-6 rounded-lg border border-[var(--color-border)]">
                                <p className="font-semibold text-[var(--color-text)] mb-2">iFilmDirectory</p>
                                <p>Email: <a href="mailto:ifilmdirectory@gmail.com" className="text-[var(--color-primary)] hover:underline">ifilmdirectory@gmail.com</a></p>
                                <p>Website: <a href="https://ifilmdirectory.com" className="text-[var(--color-primary)] hover:underline">https://ifilmdirectory.com</a></p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
