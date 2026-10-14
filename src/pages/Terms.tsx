import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
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
                    <h1 className="text-4xl font-bold">Terms of Service</h1>
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
                            Welcome to iFilmDirectory. These Terms of Service ("Terms") govern your access to and use of our platform,
                            services, and applications. By accessing or using iFilmDirectory, you agree to be bound by these Terms.
                            If you do not agree to these Terms, please do not use our platform.
                        </p>
                    </section>

                    {/* Acceptance of Terms */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            1. Acceptance of Terms
                        </h2>
                        <div className="text-[var(--color-text-secondary)] space-y-4">
                            <p>
                                By creating an account, accessing, or using iFilmDirectory, you acknowledge that you have read,
                                understood, and agree to be bound by these Terms and our Privacy Policy. These Terms apply to all
                                users of the platform, including browsers, registered users, and contributors of content.
                            </p>
                            <p>
                                We reserve the right to modify these Terms at any time. We will notify you of any changes by posting
                                the new Terms on this page. Your continued use of the platform after such modifications constitutes
                                your acceptance of the updated Terms.
                            </p>
                        </div>
                    </section>

                    {/* Eligibility */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            2. Eligibility
                        </h2>
                        <div className="text-[var(--color-text-secondary)] space-y-2">
                            <p>To use iFilmDirectory, you must:</p>
                            <ul className="list-disc ml-6 space-y-2">
                                <li>Be at least 13 years of age (or the age of majority in your jurisdiction)</li>
                                <li>Have the legal capacity to enter into a binding contract</li>
                                <li>Not be prohibited from using the platform under applicable laws</li>
                                <li>Provide accurate and complete registration information</li>
                                <li>Maintain the security of your account credentials</li>
                            </ul>
                        </div>
                    </section>

                    {/* Account Registration */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            3. Account Registration and Security
                        </h2>
                        <div className="text-[var(--color-text-secondary)] space-y-4">
                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    3.1 Account Creation
                                </h3>
                                <p>
                                    You may create an account using your email address or through third-party authentication providers
                                    (e.g., Google). You agree to provide accurate, current, and complete information during registration
                                    and to update such information to keep it accurate, current, and complete.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    3.2 Account Security
                                </h3>
                                <p>
                                    You are responsible for maintaining the confidentiality of your account credentials and for all
                                    activities that occur under your account. You agree to immediately notify us of any unauthorized
                                    use of your account or any other breach of security.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    3.3 Account Termination
                                </h3>
                                <p>
                                    We reserve the right to suspend or terminate your account at any time, with or without notice, for
                                    any reason, including violation of these Terms.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* User Conduct */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            4. User Conduct and Content
                        </h2>
                        <div className="text-[var(--color-text-secondary)] space-y-4">
                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    4.1 Acceptable Use
                                </h3>
                                <p>You agree to use iFilmDirectory only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
                                <ul className="list-disc ml-6 space-y-2 mt-2">
                                    <li>Violate any applicable laws or regulations</li>
                                    <li>Infringe on the intellectual property rights of others</li>
                                    <li>Upload or transmit viruses, malware, or other malicious code</li>
                                    <li>Harass, abuse, or harm other users</li>
                                    <li>Impersonate any person or entity</li>
                                    <li>Engage in spam, phishing, or other deceptive practices</li>
                                    <li>Scrape, crawl, or use automated means to access the platform</li>
                                    <li>Interfere with or disrupt the platform's operation</li>
                                    <li>Post false, misleading, or fraudulent content</li>
                                    <li>Engage in any activity that could damage our reputation</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    4.2 User Content
                                </h3>
                                <p>
                                    You retain ownership of all content you post on iFilmDirectory ("User Content"). By posting User Content,
                                    you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish,
                                    translate, distribute, and display such content in connection with operating and promoting the platform.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    4.3 Content Standards
                                </h3>
                                <p>All User Content must:</p>
                                <ul className="list-disc ml-6 space-y-2 mt-2">
                                    <li>Be accurate and not misleading</li>
                                    <li>Comply with applicable laws and regulations</li>
                                    <li>Not infringe on any third-party rights</li>
                                    <li>Not contain offensive, defamatory, or inappropriate material</li>
                                    <li>Be relevant to the film and entertainment industry</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Intellectual Property */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            5. Intellectual Property Rights
                        </h2>
                        <div className="text-[var(--color-text-secondary)] space-y-4">
                            <p>
                                The platform, including its design, features, functionality, and content (excluding User Content),
                                is owned by iFilmDirectory and is protected by copyright, trademark, and other intellectual property laws.
                            </p>
                            <p>
                                You may not copy, modify, distribute, sell, or lease any part of our platform or included software,
                                nor may you reverse engineer or attempt to extract the source code of that software, unless laws prohibit
                                these restrictions or you have our written permission.
                            </p>
                        </div>
                    </section>

                    {/* Services and Features */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            6. Services and Features
                        </h2>
                        <div className="text-[var(--color-text-secondary)] space-y-4">
                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    6.1 Platform Services
                                </h3>
                                <p>iFilmDirectory provides a platform for film professionals to:</p>
                                <ul className="list-disc ml-6 space-y-2 mt-2">
                                    <li>Create professional profiles and portfolios</li>
                                    <li>Upload and share showreels and work samples</li>
                                    <li>Connect with other industry professionals</li>
                                    <li>Post and apply for jobs</li>
                                    <li>Participate in forums and discussions</li>
                                    <li>Access industry resources and tools</li>
                                    <li>Book facilities and equipment</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    6.2 Premium Features
                                </h3>
                                <p>
                                    Some features may require payment or subscription. Pricing and terms for premium features will be
                                    clearly displayed before purchase. All fees are non-refundable unless otherwise stated.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    6.3 Service Modifications
                                </h3>
                                <p>
                                    We reserve the right to modify, suspend, or discontinue any aspect of the platform at any time,
                                    with or without notice. We will not be liable to you or any third party for any modification,
                                    suspension, or discontinuation of the platform.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Third-Party Services */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            7. Third-Party Services and Links
                        </h2>
                        <p className="text-[var(--color-text-secondary)]">
                            Our platform may contain links to third-party websites or services that are not owned or controlled by
                            iFilmDirectory. We have no control over and assume no responsibility for the content, privacy policies,
                            or practices of any third-party websites or services. You acknowledge and agree that we shall not be
                            responsible or liable for any damage or loss caused by your use of any such content, goods, or services.
                        </p>
                    </section>

                    {/* Disclaimers */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            8. Disclaimers and Limitations of Liability
                        </h2>
                        <div className="text-[var(--color-text-secondary)] space-y-4">
                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    8.1 "As Is" Basis
                                </h3>
                                <p>
                                    THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND,
                                    EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR
                                    A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    8.2 Limitation of Liability
                                </h3>
                                <p>
                                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, iFilmDirectory SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                                    SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
                                    DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    8.3 User Interactions
                                </h3>
                                <p>
                                    We are not responsible for the conduct of any user or the content posted by users. You are solely
                                    responsible for your interactions with other users. We reserve the right, but have no obligation,
                                    to monitor disputes between you and other users.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Indemnification */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            9. Indemnification
                        </h2>
                        <p className="text-[var(--color-text-secondary)]">
                            You agree to indemnify, defend, and hold harmless iFilmDirectory, its officers, directors, employees,
                            and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable
                            attorneys' fees, arising out of or in any way connected with your access to or use of the platform,
                            your User Content, or your violation of these Terms.
                        </p>
                    </section>

                    {/* Dispute Resolution */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            10. Dispute Resolution
                        </h2>
                        <div className="text-[var(--color-text-secondary)] space-y-4">
                            <p>
                                Any dispute arising out of or relating to these Terms or the platform shall first be attempted to be
                                resolved through good faith negotiations between the parties.
                            </p>
                            <p>
                                If the dispute cannot be resolved through negotiation, it shall be resolved through binding arbitration
                                in accordance with the applicable arbitration rules, or through the courts in the jurisdiction where
                                iFilmDirectory is located.
                            </p>
                        </div>
                    </section>

                    {/* General Provisions */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            11. General Provisions
                        </h2>
                        <div className="text-[var(--color-text-secondary)] space-y-4">
                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    11.1 Entire Agreement
                                </h3>
                                <p>
                                    These Terms, together with our Privacy Policy, constitute the entire agreement between you and
                                    iFilmDirectory regarding the use of the platform.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    11.2 Severability
                                </h3>
                                <p>
                                    If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions
                                    shall remain in full force and effect.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    11.3 Waiver
                                </h3>
                                <p>
                                    No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term
                                    or any other term.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
                                    11.4 Assignment
                                </h3>
                                <p>
                                    You may not assign or transfer these Terms or your rights hereunder without our prior written consent.
                                    We may assign these Terms without restriction.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Contact */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-4 text-[var(--color-text)]">
                            12. Contact Information
                        </h2>
                        <div className="text-[var(--color-text-secondary)]">
                            <p className="mb-4">
                                If you have any questions about these Terms of Service, please contact us:
                            </p>
                            <div className="bg-[var(--color-surface)] p-6 rounded-lg border border-[var(--color-border)]">
                                <p className="font-semibold text-[var(--color-text)] mb-2">iFilmDirectory</p>
                                <p>Email: <a href="mailto:ifilmdirectory@gmail.com" className="text-[var(--color-primary)] hover:underline">ifilmdirectory@gmail.com</a></p>
                                <p>Website: <a href="https://ifilmdirectory.com" className="text-[var(--color-primary)] hover:underline">https://ifilmdirectory.com</a></p>
                            </div>
                        </div>
                    </section>

                    {/* Acknowledgment */}
                    <section className="mb-12">
                        <div className="bg-[var(--color-surface)] p-6 rounded-lg border-2 border-[var(--color-primary)]">
                            <p className="text-[var(--color-text)] font-semibold">
                                By using iFilmDirectory, you acknowledge that you have read, understood, and agree to be bound by
                                these Terms of Service.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
