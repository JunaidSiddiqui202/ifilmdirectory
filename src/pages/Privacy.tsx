import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function Privacy() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { success } = useToast();
    const { currentUser } = useAuth();

    const [hasAgreed, setHasAgreed] = useState(false);
    const [agreedTimestamp, setAgreedTimestamp] = useState<string | null>(null);
    const [isChecked, setIsChecked] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);

        // Check prior acceptance
        const storedDate = localStorage.getItem('ifilm_privacy_accepted_date');
        const storedVersion = localStorage.getItem('ifilm_privacy_accepted_version');
        if (storedDate && storedVersion === '2026-10-15') {
            setHasAgreed(true);
            setAgreedTimestamp(storedDate);
            setIsChecked(true);
        }
    }, []);

    const handleAgree = () => {
        const now = new Date().toISOString();
        localStorage.setItem('ifilm_privacy_accepted_date', now);
        localStorage.setItem('ifilm_privacy_accepted_version', '2026-10-15');
        localStorage.setItem('ifilm_terms_accepted', 'true');
        if (currentUser?.uid) {
            localStorage.setItem(`ifilm_privacy_accepted_${currentUser.uid}`, now);
        }
        setHasAgreed(true);
        setAgreedTimestamp(now);
        setIsChecked(true);

        success('Thank you! You have acknowledged and agreed to the Privacy Policy.');

        const redirect = searchParams.get('redirect');
        if (redirect) {
            setTimeout(() => {
                navigate(redirect);
            }, 1200);
        }
    };

    const formattedAgreedDate = agreedTimestamp 
        ? new Date(agreedTimestamp).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : null;

    const sections = [
        { id: "s1", title: "1. Introduction" },
        { id: "s2", title: "2. Information We Collect" },
        { id: "s3", title: "3. How We Use Personal Information" },
        { id: "s4", title: "4. Lawful Processing and Consent" },
        { id: "s5", title: "5. Public Profiles and Information Visibility" },
        { id: "s6", title: "6. Sharing and Disclosure of Information" },
        { id: "s7", title: "7. Firebase and Google Analytics" },
        { id: "s8", title: "8. Cookies and Similar Technologies" },
        { id: "s9", title: "9. Data Security" },
        { id: "s10", title: "10. Data Retention" },
        { id: "s11", title: "11. User Rights and Privacy Requests" },
        { id: "s12", title: "12. Account Deletion" },
        { id: "s13", title: "13. Children's Privacy" },
        { id: "s14", title: "14. International Data Processing and Transfers" },
        { id: "s15", title: "15. Artificial Intelligence and Automated Features" },
        { id: "s16", title: "16. Third-Party Websites and External Content" },
        { id: "s17", title: "17. Data Breaches and Security Incidents" },
        { id: "s18", title: "18. Changes to This Privacy Policy" },
        { id: "s19", title: "19. Privacy Grievances and Contact Details" },
        { id: "s20", title: "20. Privacy Notice and Rights Under Phased Legislation" },
        { id: "s21", title: "21. Final Notice" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-500 selection:text-black transition-colors">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-40 bg-white/90 dark:bg-[#090A0C]/90 backdrop-blur-md border-b border-zinc-200 dark:border-white/10 px-4 sm:px-8 py-3.5">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        <span>Back</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {hasAgreed ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                <span className="material-symbols-outlined text-sm filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                <span>Policy Acknowledged</span>
                            </span>
                        ) : (
                            <button
                                onClick={() => {
                                    const el = document.getElementById('user-acknowledgement');
                                    el?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-extrabold transition-all active:scale-95 shadow-md flex items-center gap-1"
                            >
                                <span>Review & Acknowledge</span>
                                <span className="material-symbols-outlined text-sm">arrow_downward</span>
                            </button>
                        )}
                        <button
                            onClick={() => window.print()}
                            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                            title="Print or Save PDF"
                        >
                            <span className="material-symbols-outlined text-base">print</span>
                            <span>Print</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Header / Banner */}
            <header className="relative border-b border-zinc-200 dark:border-white/10 bg-gradient-to-b from-zinc-100 dark:from-[#121316] to-slate-50 dark:to-[#090A0C] px-4 sm:px-8 pt-10 pb-12 overflow-hidden">
                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
                        <span className="size-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                        Official Legal Document • iFilmDirectory.com
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
                        Privacy Policy
                    </h1>

                    <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-3xl leading-relaxed mb-6">
                        This Privacy Policy outlines how <strong>5M Collective Services Private Limited (5MC)</strong> collects, uses, protects, and handles personal and professional data across the iFilmDirectory platform.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none">
                            <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">A Property Of</span>
                            <span className="text-zinc-900 dark:text-white font-semibold mt-0.5 block">5M Collective Services Pvt. Ltd. (5MC)</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none">
                            <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Effective & Updated</span>
                            <span className="text-zinc-900 dark:text-white font-semibold mt-0.5 block">October 15, 2026</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none">
                            <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Privacy Contact</span>
                            <a href="mailto:ifilmdirectory@gmail.com" className="text-amber-600 dark:text-amber-400 font-semibold mt-0.5 block hover:underline truncate">
                                ifilmdirectory@gmail.com
                            </a>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none">
                            <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Governing Framework</span>
                            <span className="text-zinc-900 dark:text-white font-semibold mt-0.5 block">DPDPA 2023 & IT Act 2000 (India)</span>
                        </div>
                    </div>

                    {/* Registered Address */}
                    <div className="mt-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                        <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-base shrink-0 mt-0.5">location_on</span>
                        <span>
                            <strong>Correspondence Address:</strong> 105, First Floor, Sahiti Sri Vidya Petals, Street No. 1, Patrika Nagar, HITEC City, Hyderabad, Telangana 500081, India
                        </span>
                    </div>
                </div>
            </header>

            {/* Content Body */}
            <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
                {/* Table of Contents Pill Bar */}
                <div className="mb-12 p-5 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">toc</span>
                        <span>Table of Contents (21 Sections)</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {sections.map((s) => (
                            <a
                                key={s.id}
                                href={`#${s.id}`}
                                className="text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-zinc-100 dark:hover:bg-white/5 px-2 py-1.5 rounded-lg transition-colors truncate block"
                            >
                                {s.title}
                            </a>
                        ))}
                    </div>
                </div>

                {/* All 21 Detailed Privacy Policy Sections */}
                <div className="space-y-12 text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">

                    {/* Section 1 */}
                    <section id="s1" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-4">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">1.</span> Introduction
                        </h2>
                        <p><strong>1.1.</strong> iFilmDirectory (&quot;iFilmDirectory&quot;, &quot;Platform&quot;, &quot;Website&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;) is a digital platform designed for film-industry professionals, production companies, artists, technicians, casting professionals, studios, equipment providers and members of the entertainment community.</p>
                        <p><strong>1.2.</strong> The Platform is a proprietary property owned and operated by 5M Collective Services Private Limited (&quot;Company&quot; or &quot;5MC&quot;), which determines the purposes and means of processing personal information collected through its services.</p>
                        <p><strong>1.3.</strong> This Privacy Policy explains how we collect, use, store, process, disclose, protect and delete personal information when individuals access or interact with iFilmDirectory.</p>
                        <p><strong>1.4.</strong> This Policy applies to users of our website, registered members, visitors, job applicants, recruiters, content contributors, service providers and other individuals whose personal information we process through the Platform.</p>
                        <p><strong>1.5.</strong> Our handling of personal information is subject to applicable Indian laws, including applicable provisions of the Information Technology Act, 2000, the Digital Personal Data Protection Act, 2023, and rules made under those laws as they come into force.</p>
                        <p><strong>1.6.</strong> By using the Platform, users acknowledge that they have been provided access to this Privacy Policy. Where consent is legally required for particular processing activities, we will seek it separately in an appropriate manner.</p>
                        <p><strong>1.7.</strong> The Terms of Service govern use of the Platform. This Privacy Policy governs our handling of personal information.</p>
                    </section>

                    {/* Section 2 */}
                    <section id="s2" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-4">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">2.</span> Information We Collect
                        </h2>
                        <p>We collect information necessary to operate the Platform, provide its features, communicate with users, maintain security and comply with applicable law.</p>

                        <div className="space-y-4 pl-2">
                            <div>
                                <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-1.5">2.1. Account and Registration Information</h3>
                                <p className="mb-2">When users register or maintain accounts, we may collect:</p>
                                <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
                                    <li>Full name or professional display name.</li>
                                    <li>Email address.</li>
                                    <li>Phone number.</li>
                                    <li>Profile photograph.</li>
                                    <li>Authentication-related identifiers.</li>
                                    <li>Account preferences and settings.</li>
                                    <li>Registration and account activity information.</li>
                                </ul>
                                <p className="mt-2 text-xs text-zinc-400 italic">Firebase is a confirmed technology provider. The specific Firebase products handling sign-in and account information depend on the services enabled in our deployment.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-1.5">2.2. Professional Profile Information</h3>
                                <p className="mb-2">Members may voluntarily provide professional information, including:</p>
                                <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
                                    <li>Occupation, designation and professional category.</li>
                                    <li>Film-industry experience.</li>
                                    <li>Skills, qualifications and specialisations.</li>
                                    <li>Professional biographies.</li>
                                    <li>Film credits and portfolios.</li>
                                    <li>Photographs, video showreels and work samples.</li>
                                    <li>City, region and professional availability.</li>
                                    <li>Professional website and social media links.</li>
                                    <li>Production-house or company affiliation.</li>
                                    <li>Professional achievements and other profile information.</li>
                                </ul>
                                <p className="mt-2 text-xs text-amber-300/90">Information supplied for public professional profiles may be visible to other visitors or registered users, depending on the Platform&apos;s applicable visibility settings. Users should not publish personal information they do not want disclosed to others.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-1.5">2.3. User-Generated Content</h3>
                                <p className="mb-2">We may process content submitted through the Platform, including posts, comments, images, videos, stories, showreels, film reviews and ratings, guild/forum discussions, casting listings, and equipment listings. Users are responsible for ensuring that their submissions do not unlawfully disclose personal information about other individuals.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-1.5">2.4. Film Projects and Professional Collaboration Information</h3>
                                <p>Where supported by the Platform, we may process film project titles, crew requirements, collaboration invitations, job applications, and shared production materials. Access depends on configured permission settings. Users should not assume that voluntarily sharing information with another member prevents that recipient from independently retaining or redisclosing it.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-1.5">2.5. Messages and Communications</h3>
                                <p>Where the Platform provides direct or group messaging, we process sender and recipient account identifiers, message content, attachments, and timestamps. Messages are not publicly displayed merely because they are transmitted through the Platform. Authorized access may occur where reasonably necessary for security, abuse investigations, or lawful requests. We do not represent that messages are end-to-end encrypted unless expressly identified.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-1.5">2.6. Jobs, Casting and Recruitment Information</h3>
                                <p>Where users apply for opportunities or advertise professional engagements, we process applicant identity, resumes, portfolios, and application communications. Information submitted to recruiters or prospective employers may be accessible to those receiving parties, who are responsible for their own subsequent handling under applicable law.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-1.5">2.7. Technical and Usage Information</h3>
                                <p>When users access the Platform, technical information may be collected automatically, including IP address, browser type and version, operating system, device identifiers, pages viewed, session navigation, and security logs.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-1.5">2.8. Payment and Billing Information</h3>
                                <p>We have not confirmed that integrated payments are currently enabled. If paid features are offered, information necessary to invoice or confirm payment may be collected, and a separate payment provider may process transaction details. Before such processing begins, checkout flows will identify the relevant provider. Users should not submit card numbers or bank credentials in profiles or messages.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-zinc-900 dark:text-white text-base mb-1.5">2.9. Support, Complaints and Verification</h3>
                                <p>When contacting support, submitting a complaint, or seeking professional verification, we process the correspondence, account identifiers, and evidence supplied. We encourage users not to submit unnecessary identification documents or sensitive personal information.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section id="s3" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-4">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">3.</span> How We Use Personal Information
                        </h2>
                        <p>We process personal information for lawful and relevant purposes:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                                <h4 className="font-bold text-amber-400 text-sm">3.1. Operating the Platform</h4>
                                <p>Registering accounts, maintaining professional profiles, enabling networking, running messaging, managing casting interactions, and search.</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                                <h4 className="font-bold text-amber-400 text-sm">3.2. Platform Security & Abuse Prevention</h4>
                                <p>Protecting accounts, investigating suspicious activity, detecting fraudulent casting calls, preventing impersonation, and handling harassment.</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                                <h4 className="font-bold text-amber-400 text-sm">3.3. Communications & Support</h4>
                                <p>Responding to customer inquiries, sending account notices, security alerts, processing grievances, and copyright notices.</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                                <h4 className="font-bold text-amber-400 text-sm">3.4. Analytics & Service Improvement</h4>
                                <p>Measuring engagement, diagnosing technical issues, and improving accessibility. Google Analytics is used for website metrics.</p>
                            </div>
                        </div>
                        <p><strong>3.5. Personalisation:</strong> Where supported, profile data is used to provide relevant professional search results and recommendations.</p>
                        <p><strong>3.6. Marketing:</strong> We may communicate about Platform features and events where permitted by law. Users can opt out of non-essential marketing at any time.</p>
                        <p><strong>3.7. Compliance:</strong> Processing where required for statutory duties, responding to lawful government or court orders, and defending legal rights.</p>
                    </section>

                    {/* Section 4 */}
                    <section id="s4" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">4.</span> Lawful Processing and Consent
                        </h2>
                        <p><strong>4.1.</strong> We process personal information only where a valid legal basis exists under applicable law.</p>
                        <p><strong>4.2.</strong> Where consent is required, it will be requested for specified purposes using appropriate notices and affirmative actions.</p>
                        <p><strong>4.3.</strong> Consent for optional purposes will not be treated as automatically granted merely because a user accepts the Terms of Service.</p>
                        <p><strong>4.4.</strong> Users may withdraw consent where the relevant processing is based on consent, subject to applicable law.</p>
                        <p><strong>4.5.</strong> Withdrawal of consent may prevent access to features that cannot operate without the relevant data.</p>
                        <p><strong>4.6.</strong> Withdrawal does not necessarily affect processing already lawfully completed or information retained under statutory obligations.</p>
                        <p><strong>4.7.</strong> Where additional processing purposes arise, we will provide further notice or obtain additional consent.</p>
                    </section>

                    {/* Section 5 */}
                    <section id="s5" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">5.</span> Public Profiles and Information Visibility
                        </h2>
                        <p><strong>5.1.</strong> iFilmDirectory is designed to facilitate professional visibility and networking in the film community.</p>
                        <p><strong>5.2.</strong> Information placed in public profiles, public posts, film reviews, forums or listings may be accessible to other users, visitors, and search engines.</p>
                        <p><strong>5.3.</strong> Users should carefully consider what personal information they choose to publish.</p>
                        <p><strong>5.4.</strong> Publicly disclosed information may be viewed, copied, shared or retained by other persons outside the Company&apos;s direct control.</p>
                        <p><strong>5.5.</strong> Deleting information from iFilmDirectory does not guarantee removal of independently retained copies or content previously indexed by external search engines.</p>
                        <p><strong>5.6.</strong> Available visibility controls are those presented in the account interface. Contact us if any control is not operating properly.</p>
                        <p><strong>5.7.</strong> Private project materials and private messages are not disclosed as public information merely because a member has a public profile.</p>
                    </section>

                    {/* Section 6 */}
                    <section id="s6" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">6.</span> Sharing and Disclosure of Information
                        </h2>
                        <p>We do not treat access to the Platform as unrestricted authorization to disclose personal data. Disclosures occur only in defined circumstances:</p>
                        <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-400">
                            <li><strong>6.1. Other Users:</strong> Information disclosed for public profiles, direct messages, casting applications, and collaboration invitations.</li>
                            <li><strong>6.2. Firebase & Google Services:</strong> Google processes data necessary for authentication, database storage, diagnostics, and Google Analytics under applicable terms (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">Google Privacy Policy</a>).</li>
                            <li><strong>6.3. Professional Counterparties:</strong> Disclosures to recruiters, production houses, and casting directors when users apply or submit inquiries.</li>
                            <li><strong>6.4. Legal & Regulatory:</strong> Disclosures required by statutory obligations, court orders, or to investigate unlawful conduct and defend legal claims.</li>
                            <li><strong>6.5. Business Transfers:</strong> Data transfer in the event of a merger, acquisition, restructuring, or transfer of business assets.</li>
                            <li><strong>6.6. No Unrestricted Sale:</strong> The Company does not authorize third-party scraping, harvesting, or commercial resale of member information.</li>
                        </ul>
                    </section>

                    {/* Section 7 */}
                    <section id="s7" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">7.</span> Firebase and Google Analytics
                        </h2>
                        <p><strong>7.1.</strong> Firebase is utilized for authentication, cloud storage, real-time sync, and notification delivery. While Firebase provides infrastructure security, effective data protection also relies on the Company&apos;s configured security rules.</p>
                        <p><strong>7.2.</strong> Google Analytics collects aggregate interaction data to help understand user journeys and optimize platform stability.</p>
                        <p><strong>7.3. Google Privacy Resources:</strong></p>
                        <ul className="list-disc list-inside space-y-1 pl-4 text-xs text-amber-300">
                            <li><a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="underline">Firebase Privacy and Security</a></li>
                            <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Google Privacy Policy</a></li>
                            <li><a href="https://support.google.com/analytics/answer/9019185" target="_blank" rel="noopener noreferrer" className="underline">Google Analytics Privacy Controls</a></li>
                        </ul>
                        <p><strong>7.4.</strong> Material changes to service providers affecting personal data processing will be reflected in updates to this Policy.</p>
                    </section>

                    {/* Section 8 */}
                    <section id="s8" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">8.</span> Cookies and Similar Technologies
                        </h2>
                        <p><strong>8.1.</strong> iFilmDirectory uses cookies, local browser storage, and session tokens for authentication, site preferences, and analytics.</p>
                        <p><strong>8.2.</strong> Essential technologies are strictly necessary for logging in, routing, and platform navigation.</p>
                        <p><strong>8.3.</strong> Users can manage or restrict cookies through standard browser controls. Disabling essential storage may prevent login.</p>
                    </section>

                    {/* Section 9 */}
                    <section id="s9" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">9.</span> Data Security
                        </h2>
                        <p><strong>9.1.</strong> The Company implements reasonable technical and organizational safeguards appropriate to the sensitivity of personal information.</p>
                        <p><strong>9.2.</strong> Measures include Firebase security rules, SSL/TLS encrypted transmissions, restricted staff access, and continuous monitoring.</p>
                        <p><strong>9.3.</strong> Users are responsible for safeguarding their login credentials and promptly reporting unauthorized access.</p>
                        <p><strong>9.4.</strong> No digital platform can guarantee absolute security, but we maintain active incident-response procedures.</p>
                    </section>

                    {/* Section 10 */}
                    <section id="s10" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">10.</span> Data Retention
                        </h2>
                        <p><strong>10.1.</strong> Personal information is retained only as long as necessary for the operational purposes for which it was gathered.</p>
                        <p><strong>10.2.</strong> Account data is maintained while the account is active and for a lawful period following closure.</p>
                        <p><strong>10.3.</strong> Content remains available until deleted by the user or removed under Platform policies.</p>
                        <p><strong>10.4.</strong> Information required for fraud prevention, audit trails, or lawful obligations may be preserved as authorized by statute.</p>
                    </section>

                    {/* Section 11 */}
                    <section id="s11" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">11.</span> User Rights and Privacy Requests
                        </h2>
                        <p>Under applicable Indian data protection laws, members are entitled to:</p>
                        <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-400">
                            <li><strong>11.1. Access to Information:</strong> Confirm what personal information is processed and summary of disclosures.</li>
                            <li><strong>11.2. Correction & Updating:</strong> Request rectification of inaccurate or outdated profile details.</li>
                            <li><strong>11.3. Erasure:</strong> Request deletion of personal information where legally applicable.</li>
                            <li><strong>11.4. Withdrawal of Consent:</strong> Revoke consent previously granted for specific non-essential features.</li>
                            <li><strong>11.5. Grievance Redressal:</strong> Submit formal privacy complaints to our designated officer.</li>
                        </ul>
                        <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                            <p className="text-xs text-zinc-900 dark:text-white">
                                <strong>Submitting a Privacy Request:</strong> Send your request along with account verification to{' '}
                                <a href="mailto:ifilmdirectory@gmail.com" className="text-amber-500 dark:text-amber-400 font-bold underline">ifilmdirectory@gmail.com</a>. Requests are handled within statutory timelines.
                            </p>
                        </div>
                    </section>

                    {/* Section 12 */}
                    <section id="s12" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">12.</span> Account Deletion
                        </h2>
                        <p><strong>12.1.</strong> Users can request account closure or data erasure by writing to <a href="mailto:ifilmdirectory@gmail.com" className="text-amber-400 underline">ifilmdirectory@gmail.com</a>.</p>
                        <p><strong>12.2.</strong> Upon receiving a valid request, we process account deletion and personal-data erasure according to statutory rules.</p>
                        <p><strong>12.3.</strong> Information independently shared with collaborators prior to deletion may remain in those recipients&apos; possession.</p>
                    </section>

                    {/* Section 13 */}
                    <section id="s13" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">13.</span> Children&apos;s Privacy
                        </h2>
                        <p><strong>13.1.</strong> Account registration on iFilmDirectory is restricted to individuals aged <strong>18 years or older</strong>.</p>
                        <p><strong>13.2.</strong> Where productions involve minor artists, parent/guardian legal representation and verified consent must be provided.</p>
                        <p><strong>13.3.</strong> Accounts registered by unauthorized minors will be terminated upon notice.</p>
                    </section>

                    {/* Section 14 */}
                    <section id="s14" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">14.</span> International Data Processing and Transfers
                        </h2>
                        <p><strong>14.1.</strong> The Company operates from India. Technology providers (including Firebase/Google Cloud) may maintain servers across global infrastructure.</p>
                        <p><strong>14.2.</strong> Cross-border processing is handled in compliance with applicable Indian data protection regulations and required safeguards.</p>
                    </section>

                    {/* Section 15 */}
                    <section id="s15" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">15.</span> Artificial Intelligence and Automated Features
                        </h2>
                        <p><strong>15.1.</strong> Automated algorithms may assist in search indexing, recommendations, and spam detection.</p>
                        <p><strong>15.2.</strong> Private scripts, unpublished project treatments, and audition tapes are <strong>NOT</strong> provided to third parties for generative AI training without explicit consent.</p>
                    </section>

                    {/* Section 16 */}
                    <section id="s16" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">16.</span> Third-Party Websites and External Content
                        </h2>
                        <p><strong>16.1.</strong> iFilmDirectory aggregates cinema news, trade updates, and links to external industry portals.</p>
                        <p><strong>16.2.</strong> Third-party websites maintain independent privacy policies. We encourage users to inspect external notices before sharing sensitive details.</p>
                    </section>

                    {/* Section 17 */}
                    <section id="s17" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">17.</span> Data Breaches and Security Incidents
                        </h2>
                        <p><strong>17.1.</strong> Suspected security events are subject to technical investigation and immediate remediation.</p>
                        <p><strong>17.2.</strong> Where required by law, affected individuals and competent supervisory authorities will be notified promptly.</p>
                    </section>

                    {/* Section 18 */}
                    <section id="s18" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">18.</span> Changes to This Privacy Policy
                        </h2>
                        <p><strong>18.1.</strong> The Company may revise this Privacy Policy to reflect technical upgrades, new features, or legislative changes.</p>
                        <p><strong>18.2.</strong> Material alterations will be communicated with an updated effective date.</p>
                    </section>

                    {/* Section 19 */}
                    <section id="s19" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-4">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">19.</span> Privacy Grievances and Contact Details
                        </h2>
                        <p>For inquiries, privacy requests, or complaints relating to personal data processing:</p>
                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 space-y-2 text-xs text-zinc-800 dark:text-zinc-200">
                            <p><strong>Company / Owner:</strong> 5M Collective Services Private Limited (5MC)</p>
                            <p><strong>Platform:</strong> iFilmDirectory</p>
                            <p><strong>Privacy Contact:</strong> <a href="mailto:ifilmdirectory@gmail.com" className="text-amber-500 dark:text-amber-400 underline font-semibold">ifilmdirectory@gmail.com</a></p>
                            <p><strong>Registered Correspondence Address:</strong> 105, First Floor, Sahiti Sri Vidya Petals, Street No. 1, Patrika Nagar, HITEC City, Hyderabad, Telangana 500081, India</p>
                        </div>
                    </section>

                    {/* Section 20 */}
                    <section id="s20" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">20.</span> Privacy Notice and Rights Under Phased Legislation
                        </h2>
                        <p><strong>20.1.</strong> Indian personal-data law is evolving through phased commencement of the Digital Personal Data Protection Act, 2023 and Digital Personal Data Protection Rules, 2025. We implement obligations as they come into statutory force.</p>
                        <p><strong>20.2.</strong> This Policy represents an informative notice and does not serve as a waiver of user rights.</p>
                    </section>

                    {/* Section 21 */}
                    <section id="s21" className="scroll-mt-24 p-6 rounded-2xl bg-white dark:bg-[#121316]/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none space-y-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3">
                            <span className="text-amber-400">21.</span> Final Notice
                        </h2>
                        <p>iFilmDirectory is built to empower filmmakers, artists, technicians, and production companies to connect, collaborate, and create cinema. Users remain responsible for deciding what details they voluntarily publish. 5M Collective Services Private Limited (5MC) assumes legal responsibility under applicable laws for its processing activities as the platform owner and operator.</p>
                        <div className="pt-2 text-xs text-zinc-400">
                            <p><strong>Website:</strong> <a href="https://ifilmdirectory.com" className="text-amber-400 underline">https://ifilmdirectory.com</a></p>
                            <p><strong>Email:</strong> <a href="mailto:ifilmdirectory@gmail.com" className="text-amber-400 underline">ifilmdirectory@gmail.com</a></p>
                        </div>
                    </section>
                </div>

                {/* USER ACKNOWLEDGEMENT & ACCEPTANCE DRAWER */}
                <div
                    id="user-acknowledgement"
                    className="mt-16 p-6 sm:p-8 rounded-3xl bg-white dark:bg-gradient-to-br dark:from-[#18191D] dark:to-[#121316] border border-amber-500/30 shadow-xl dark:shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-2 max-w-xl">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">
                                <span className="material-symbols-outlined text-sm">verified_user</span>
                                <span>Consent & Privacy Acknowledgment</span>
                            </span>

                            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                                {hasAgreed ? "You have acknowledged this Privacy Policy" : "Review and Acknowledge the Privacy Policy"}
                            </h3>

                            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                By acknowledging, you confirm you have reviewed how 5M Collective Services Private Limited (5MC) collects, safeguards, and handles your information on iFilmDirectory.
                            </p>

                            {hasAgreed && formattedAgreedDate && (
                                <p className="text-xs text-emerald-500 dark:text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
                                    <span className="material-symbols-outlined text-sm filled" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <span>Acknowledged on {formattedAgreedDate}</span>
                                </p>
                            )}
                        </div>

                        <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-3 shrink-0">
                            {!hasAgreed && (
                                <label className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => setIsChecked(e.target.checked)}
                                        className="size-4 rounded bg-white dark:bg-black/60 border-zinc-300 dark:border-white/20 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer accent-amber-500"
                                    />
                                    <span>I have read and agree to this Privacy Policy</span>
                                </label>
                            )}

                            <button
                                onClick={handleAgree}
                                disabled={hasAgreed || !isChecked}
                                className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                                    hasAgreed
                                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default"
                                        : isChecked
                                        ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-amber-500/20 cursor-pointer"
                                        : "bg-zinc-200 dark:bg-white/10 text-zinc-400 dark:text-zinc-500 border border-zinc-300 dark:border-white/10 cursor-not-allowed"
                                }`}
                            >
                                <span className="material-symbols-outlined text-base">
                                    {hasAgreed ? "check" : "thumb_up"}
                                </span>
                                <span>{hasAgreed ? "Acknowledged" : "I Acknowledge & Agree"}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Return to App Bar */}
                <div className="mt-12 text-center text-xs text-zinc-500 space-y-3">
                    <div className="flex justify-center gap-4 text-xs font-semibold">
                        <Link to="/terms" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Terms of Service</Link>
                        <span>•</span>
                        <Link to="/home" className="text-amber-500 dark:text-amber-400 hover:underline">Return to Home</Link>
                        <span>•</span>
                        <Link to="/login" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Sign In</Link>
                    </div>
                    <p className="text-[11px] text-zinc-600">
                        © 2026 iFilmDirectory. A property of 5M Collective Services Pvt. Ltd. (5MC). All rights reserved.
                    </p>
                </div>
            </main>
        </div>
    );
}
