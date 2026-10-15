import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function Terms() {
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
        const storedDate = localStorage.getItem('ifilm_terms_accepted_date');
        const storedVersion = localStorage.getItem('ifilm_terms_accepted_version');
        if (storedDate && storedVersion === '2026-10-15') {
            setHasAgreed(true);
            setAgreedTimestamp(storedDate);
            setIsChecked(true);
        }
    }, []);

    const handleAgree = () => {
        const now = new Date().toISOString();
        localStorage.setItem('ifilm_terms_accepted_date', now);
        localStorage.setItem('ifilm_terms_accepted_version', '2026-10-15');
        if (currentUser?.uid) {
            localStorage.setItem(`ifilm_terms_accepted_${currentUser.uid}`, now);
        }
        setHasAgreed(true);
        setAgreedTimestamp(now);
        setIsChecked(true);

        success('Thank you! You have accepted the Terms of Service.');

        // If redirect param exists, navigate to it after a brief pause
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

    return (
        <div className="min-h-screen bg-[#090A0C] text-zinc-100 font-sans selection:bg-amber-500 selection:text-black">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-40 bg-[#090A0C]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        <span>Back</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {hasAgreed ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                                <span className="material-symbols-outlined text-sm filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                <span>Terms Accepted</span>
                            </span>
                        ) : (
                            <button
                                onClick={() => {
                                    const el = document.getElementById('user-acknowledgement');
                                    el?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold transition-all active:scale-95 shadow-md flex items-center gap-1"
                            >
                                <span>Review & Agree</span>
                                <span className="material-symbols-outlined text-sm">arrow_downward</span>
                            </button>
                        )}
                        <button
                            onClick={() => window.print()}
                            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300"
                            title="Print or Save PDF"
                        >
                            <span className="material-symbols-outlined text-base">print</span>
                            <span>Print</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Document Header & Legal Identification Meta */}
            <div className="border-b border-white/10 bg-gradient-to-b from-[#14151a] to-[#090A0C] px-4 sm:px-8 pt-10 pb-8">
                <div className="max-w-5xl mx-auto space-y-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
                        <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                        Official Legal Document • iFilmDirectory.com
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                        Terms of Service
                    </h1>

                    <p className="text-zinc-400 text-sm sm:text-base max-w-3xl leading-relaxed">
                        Please review these Terms of Service carefully before accessing, registering for, or using iFilmDirectory.
                        These terms constitute a legally binding electronic agreement under the laws of India.
                    </p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
                        <div className="p-3.5 rounded-2xl bg-[#121316] border border-white/5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Effective Date</span>
                            <p className="text-xs font-bold text-white mt-1">October 15, 2026</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-[#121316] border border-white/5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Operated By</span>
                            <p className="text-xs font-bold text-white mt-1 leading-snug">5M Collective Services Private Limited (5MC)</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-[#121316] border border-white/5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Governing Law</span>
                            <p className="text-xs font-bold text-white mt-1">Laws of India (Hyderabad)</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-[#121316] border border-white/5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Grievance Officer</span>
                            <p className="text-xs font-bold text-amber-400 mt-1">Junaid Siddiqui</p>
                        </div>
                    </div>

                    {/* Accepted Status Banner */}
                    {hasAgreed && (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-xl filled">verified</span>
                                </div>
                                <div>
                                    <h2 className="text-xs font-bold text-emerald-300">You have formally accepted these Terms of Service</h2>
                                    <p className="text-[11px] text-zinc-400 mt-0.5">
                                        Recorded on: {formattedAgreedDate || 'October 15, 2026'} • Version: October 15, 2026
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/')}
                                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold transition-all self-end sm:self-auto shrink-0 shadow-sm"
                            >
                                Continue to Home
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Document Body */}
            <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-10 text-sm leading-relaxed text-zinc-300">
                {/* 1. INTRODUCTION AND ACCEPTANCE OF TERMS */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">01.</span>
                        INTRODUCTION AND ACCEPTANCE OF TERMS
                    </h2>
                    <p>
                        <strong className="text-white">1.1.</strong> Welcome to iFilmDirectory ("iFilmDirectory", "Platform", "Website", "we", "us", or "our"), a digital film-industry networking, professional directory, content-sharing, recruitment, production resource and entertainment information platform owned and operated by 5M Collective Services Private Limited ("Company" or "5MC").
                    </p>
                    <p>
                        <strong className="text-white">1.2.</strong> These Terms of Service ("Terms") govern your access to and use of the Platform, including its website, applications, professional profiles, feeds, forums, communication systems, film news, reviews, casting opportunities, project-management features, studio listings and related services.
                    </p>
                    <p>
                        <strong className="text-white">1.3.</strong> When you create an account and affirmatively accept these Terms, you enter into an agreement with the Company. Browsing public pages remains subject to applicable website-use rules to the extent enforceable. Our Privacy Policy describes our personal-data practices; acknowledgment of that notice is not a substitute for any consent required by law.
                    </p>
                    <p>
                        <strong className="text-white">1.4.</strong> If you do not agree with these Terms, you must discontinue your use of the Platform.
                    </p>
                    <p>
                        <strong className="text-white">1.5.</strong> These Terms constitute an electronic agreement under applicable Indian law and do not require physical signatures where electronic acceptance is legally sufficient.
                    </p>
                    <p>
                        <strong className="text-white">1.6.</strong> The Company may update these Terms to reflect changes in law, functionality, security or business operations. Material changes will be notified where required by applicable law.
                    </p>
                    <p>
                        <strong className="text-white">1.7.</strong> We will display the updated effective date and give notice of material changes where required. Where fresh affirmative agreement is legally required, we will request it before applying the relevant revised terms.
                    </p>
                </section>

                {/* 2. NATURE AND SCOPE OF THE PLATFORM */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">02.</span>
                        NATURE AND SCOPE OF THE PLATFORM
                    </h2>
                    <p>
                        <strong className="text-white">2.1.</strong> iFilmDirectory is an online platform intended to connect film-industry participants, including:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-zinc-300">
                        <li>Actors, models and performers.</li>
                        <li>Directors, writers, editors and cinematographers.</li>
                        <li>Producers and production companies.</li>
                        <li>Casting directors and talent representatives.</li>
                        <li>Technicians, artists and production crew.</li>
                        <li>Film studios and equipment providers.</li>
                        <li>Post-production facilities and service providers.</li>
                        <li>Film journalists, reviewers and entertainment professionals.</li>
                        <li>Other lawful participants in the film and entertainment industry.</li>
                    </ul>
                    <p>
                        <strong className="text-white">2.2.</strong> The Platform may provide:
                    </p>
                    <ol className="list-none pl-4 space-y-1 text-zinc-300">
                        <li><strong>a.</strong> Professional profiles and talent directories.</li>
                        <li><strong>b.</strong> Social networking, posts, stories and showreels.</li>
                        <li><strong>c.</strong> Recruitment, casting calls and crew opportunities.</li>
                        <li><strong>d.</strong> Film projects, professional collaboration and shortlisting.</li>
                        <li><strong>e.</strong> Studio, location, production facility and equipment listings.</li>
                        <li><strong>f.</strong> Guilds, professional groups and discussion forums.</li>
                        <li><strong>g.</strong> Private and group messaging.</li>
                        <li><strong>h.</strong> Cinema news aggregation, RSS feeds and entertainment updates.</li>
                        <li><strong>i.</strong> Film reviews, ratings and discussions.</li>
                        <li><strong>j.</strong> Advertising, promotional placements and other supplementary services.</li>
                    </ol>
                    <p>
                        <strong className="text-white">2.3.</strong> Unless expressly stated otherwise, iFilmDirectory acts as a technology platform facilitating discovery, information sharing and communication between independent participants.
                    </p>
                    <p>
                        <strong className="text-white">2.4.</strong> The Company is not automatically the employer, casting agency, talent manager, producer, professional agent, contracting party, booking provider or legal representative of users or entities listed on the Platform.
                    </p>
                    <p>
                        <strong className="text-white">2.5.</strong> The Company does not guarantee employment, casting selection, professional engagements, project funding, commercial success, bookings, payments or other business outcomes.
                    </p>
                    <p>
                        <strong className="text-white">2.6.</strong> Certain content, including Company-created editorial material, advertisements and sponsored content, may be subject to additional responsibilities distinct from those applicable to independent third-party content.
                    </p>
                </section>

                {/* 3. USER ELIGIBILITY */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">03.</span>
                        USER ELIGIBILITY
                    </h2>
                    <p><strong className="text-white">3.1.</strong> Account registration is restricted to individuals aged 18 years or above.</p>
                    <p><strong className="text-white">3.2.</strong> Users must have the legal capacity to enter into binding agreements.</p>
                    <p><strong className="text-white">3.3.</strong> Individuals registering on behalf of companies, production houses, studios or other organisations represent that they possess the necessary authority.</p>
                    <p><strong className="text-white">3.4.</strong> Registration using fraudulent identities, stolen credentials, impersonated profiles or fabricated professional details is prohibited.</p>
                    <p><strong className="text-white">3.5.</strong> Where child artists are involved in productions advertised through the Platform, the relevant producers, employers, guardians and other responsible persons must comply with applicable child protection, labour, consent and entertainment-industry requirements.</p>
                    <p><strong className="text-white">3.6.</strong> The Company may refuse or restrict registrations when reasonably necessary to protect the Platform, comply with law or prevent misuse.</p>
                </section>

                {/* 4. ACCOUNTS, SECURITY AND PROFILE INFORMATION */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">04.</span>
                        ACCOUNTS, SECURITY AND PROFILE INFORMATION
                    </h2>
                    <p><strong className="text-white">4.1.</strong> Users must provide accurate, current and lawful account information.</p>
                    <p><strong className="text-white">4.2.</strong> Users are responsible for maintaining the confidentiality of their account credentials.</p>
                    <p><strong className="text-white">4.3.</strong> Users must promptly report suspected unauthorised account access or fraudulent activity.</p>
                    <p><strong className="text-white">4.4.</strong> Users must not share accounts, impersonate other members, sell access credentials or use automated systems to create misleading accounts.</p>
                    <p><strong className="text-white">4.5.</strong> Users are responsible for activities undertaken through their accounts to the extent such activities are attributable to them, subject to applicable law.</p>
                    <p><strong className="text-white">4.6.</strong> The Company may investigate suspicious accounts and temporarily restrict access where appropriate.</p>
                    <p><strong className="text-white">4.7.</strong> A professional profile, claimed designation, film credit, employment history or membership does not constitute a Company endorsement.</p>
                    <p><strong className="text-white">4.8.</strong> Users must not falsely claim association with studios, film productions, streaming services, celebrities, guilds, companies or industry organisations.</p>
                </section>

                {/* 5. USER CONDUCT AND INDIVIDUAL RESPONSIBILITY */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">05.</span>
                        USER CONDUCT AND INDIVIDUAL RESPONSIBILITY
                    </h2>
                    <p><strong className="text-white">5.1.</strong> Every user is independently responsible for their own actions, behaviour, representations, communications, uploads, transactions and professional dealings.</p>
                    <p><strong className="text-white">5.2.</strong> Users agree to comply with applicable laws, these Terms and the Platform's Community Guidelines.</p>
                    <p><strong className="text-white">5.3.</strong> Users must not engage in:</p>
                    <ol className="list-none pl-4 space-y-1.5 text-zinc-300">
                        <li><strong>a.</strong> Fraud, identity theft, impersonation or financial deception.</li>
                        <li><strong>b.</strong> Harassment, stalking, bullying or unlawful intimidation.</li>
                        <li><strong>c.</strong> Sexual harassment, coercion, exploitation or inappropriate casting demands.</li>
                        <li><strong>d.</strong> Defamation, unlawful threats or knowingly false allegations.</li>
                        <li><strong>e.</strong> Unauthorised disclosure of personal, private or confidential information.</li>
                        <li><strong>f.</strong> Uploading or distributing illegal or infringing material.</li>
                        <li><strong>g.</strong> Recruitment scams, false auditions or fictitious employment opportunities.</li>
                        <li><strong>h.</strong> Unlawful discrimination or other prohibited conduct.</li>
                        <li><strong>i.</strong> Circulation of malicious software, phishing links or fraudulent payment requests.</li>
                        <li><strong>j.</strong> Manipulation of reviews, ratings, recommendations or professional credentials.</li>
                        <li><strong>k.</strong> Misleading AI-generated content, unlawful deepfakes or unauthorised impersonation.</li>
                        <li><strong>l.</strong> Any content or conduct prohibited under applicable Indian law, including the Information Technology Act, 2000 and applicable rules.</li>
                    </ol>
                    <p><strong className="text-white">5.4.</strong> The Company may implement moderation, reporting, investigation and enforcement measures to address prohibited activities.</p>
                    <p><strong className="text-white">5.5.</strong> Failure to detect misconduct immediately does not constitute Company approval, endorsement or acceptance of that misconduct.</p>
                </section>

                {/* 6. INDEPENDENT USER BEHAVIOUR AND THIRD-PARTY LIABILITY */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">06.</span>
                        INDEPENDENT USER BEHAVIOUR AND THIRD-PARTY LIABILITY
                    </h2>
                    <p><strong className="text-white">6.1. Independent Responsibility:</strong> All users, including actors, producers, casting directors, technicians, studios, advertisers, reviewers, recruiters and other members, act in their individual or independent professional capacities unless the Company expressly states otherwise.</p>
                    <p><strong className="text-white">6.2. No General Responsibility for Independent User Conduct:</strong> To the fullest extent permitted by applicable law, the Company shall not be responsible or liable merely because an independent user engages in misconduct, fraud, harassment, deception, misrepresentation, contractual breach, unlawful activity or other wrongful behaviour.</p>
                    <p><strong className="text-white">6.3. User-to-User Interactions:</strong> Users are solely responsible for deciding whether, when and how to communicate, meet, collaborate, recruit, employ, hire, engage or transact with other users.</p>
                    <p><strong className="text-white">6.4. Offline Conduct:</strong> The Company does not organise, supervise or control independent offline interactions between users unless expressly identified as the organiser of a particular activity. Accordingly, to the maximum extent permitted by law, the Company disclaims liability arising solely from independent third-party conduct during:</p>
                    <ul className="list-disc pl-6 space-y-1 text-zinc-300">
                        <li>Auditions and casting meetings.</li>
                        <li>Film shootings and production assignments.</li>
                        <li>Professional interviews and employment discussions.</li>
                        <li>Studio visits and equipment inspections.</li>
                        <li>Private meetings and personal interactions.</li>
                        <li>Accommodation or travel independently arranged between users.</li>
                        <li>Independent production collaborations and business engagements.</li>
                    </ul>
                    <p><strong className="text-white">6.5. Criminal and Unlawful Acts:</strong> A user who commits fraud, harassment, assault, theft, exploitation, copyright infringement or another unlawful act remains independently responsible for that conduct. The Company is not a guarantor of user behaviour and does not assume responsibility for independent criminal acts merely because the relevant persons discovered one another through the Platform.</p>
                    <p><strong className="text-white">6.6. No General Guarantee of Safety or Authenticity:</strong> The Company does not guarantee that every member is trustworthy, that every opportunity is genuine, or that every interaction is free from risk.</p>
                    <p><strong className="text-white">6.7. Third-Party Disputes:</strong> Unless the Company is itself a contracting party or is otherwise legally responsible, disputes between users shall be resolved between the relevant parties or through appropriate legal processes.</p>
                    <p><strong className="text-white">6.8. Statutory Exceptions:</strong> Nothing in this section excludes the Company's obligations under applicable law, liability for its own unlawful conduct, or any liability that cannot legally be excluded.</p>
                </section>

                {/* 7. TALENT DIRECTORY AND PROFESSIONAL VERIFICATION */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">07.</span>
                        TALENT DIRECTORY AND PROFESSIONAL VERIFICATION
                    </h2>
                    <p><strong className="text-white">7.1.</strong> Users may create profiles showing professional qualifications, experience, film credits, portfolios, showreels, skills, locations and availability.</p>
                    <p><strong className="text-white">7.2.</strong> Users warrant that information in their profiles is accurate and that they possess the necessary permissions for uploaded materials.</p>
                    <p><strong className="text-white">7.3.</strong> Unless expressly indicated otherwise, professional claims are submitted by the relevant users and are not independently certified by the Company.</p>
                    <p><strong className="text-white">7.4.</strong> A verification badge, where offered, indicates only the specific checks disclosed by the Platform.</p>
                    <p><strong className="text-white">7.5.</strong> Verification may be limited to email ownership, phone control, identity documentation, company authorisation or other designated checks.</p>
                    <p><strong className="text-white">7.6.</strong> Verification does not guarantee honesty, professional competence, payment reliability, lawful behaviour or suitability for any engagement.</p>
                    <p><strong className="text-white">7.7.</strong> The Company may withdraw verification where it becomes unreliable or where the relevant account breaches these Terms.</p>
                    <p><strong className="text-white">7.8.</strong> Users must not fabricate film credits, IMDb associations, awards, educational qualifications, production affiliations or professional achievements.</p>
                    <p><strong className="text-white">7.9.</strong> A person whose identity, likeness, business identity or credentials are falsely represented may submit a complaint through the Platform's reporting mechanism.</p>
                </section>

                {/* 8. JOBS, CASTING CALLS AND RECRUITMENT */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">08.</span>
                        JOBS, CASTING CALLS AND RECRUITMENT
                    </h2>
                    <p><strong className="text-white">8.1.</strong> Casting calls, crew requirements, employment opportunities and production-related advertisements may be submitted by independent individuals or organisations.</p>
                    <p><strong className="text-white">8.2.</strong> The posting party is solely responsible for the accuracy, authenticity and legality of its listing.</p>
                    <p><strong className="text-white">8.3.</strong> Recruiters must disclose accurate information regarding the nature of the opportunity, role, location, compensation where stated, relevant eligibility criteria and recruiting entity.</p>
                    <p><strong className="text-white">8.4.</strong> Fake auditions, misleading production announcements, fraudulent job offers, unauthorised brand associations and advance-payment scams are prohibited.</p>
                    <p><strong className="text-white">8.5.</strong> Users must not demand compulsory audition fees, casting selection charges or recruitment deposits as a condition for being considered for work on the Platform.</p>
                    <p><strong className="text-white">8.6.</strong> Legitimate standalone professional services, such as training or portfolio photography, must not be falsely represented as guaranteed routes to casting or employment.</p>
                    <p><strong className="text-white">8.7.</strong> The Company does not guarantee:</p>
                    <ol className="list-none pl-4 space-y-1 text-zinc-300">
                        <li><strong>a.</strong> The availability of any advertised role.</li>
                        <li><strong>b.</strong> The authenticity of unverified recruiters.</li>
                        <li><strong>c.</strong> Casting selection or employment.</li>
                        <li><strong>d.</strong> Accuracy of remuneration claims.</li>
                        <li><strong>e.</strong> Payment of wages or professional fees.</li>
                        <li><strong>f.</strong> Working conditions or project completion.</li>
                        <li><strong>g.</strong> Performance of contractual obligations by employers or applicants.</li>
                    </ol>
                    <p><strong className="text-white">8.8.</strong> Unless expressly stated, the Company does not employ applicants, negotiate their contracts or receive compensation on their behalf.</p>
                    <p><strong className="text-white">8.9.</strong> Applicants should independently verify production credentials, locations, contact persons and contractual terms.</p>
                    <p><strong className="text-white">8.10.</strong> The Company may remove misleading listings, restrict recruiters or cooperate with competent authorities as legally required.</p>
                </section>

                {/* 9. FILM PROJECTS, CREW SHORTLISTING AND COLLABORATION */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">09.</span>
                        FILM PROJECTS, CREW SHORTLISTING AND COLLABORATION
                    </h2>
                    <p><strong className="text-white">9.1.</strong> The Platform may allow users to create projects, manage project profiles, invite professionals, shortlist crew members and communicate with prospective collaborators.</p>
                    <p><strong className="text-white">9.2.</strong> The creator or lawful rights holder retains ownership of original scripts, story concepts, screenplay materials, production documents, images and other project content.</p>
                    <p><strong className="text-white">9.3.</strong> Creating a project, submitting an application, receiving an invitation or being shortlisted does not automatically establish employment, partnership, agency, ownership or contractual rights.</p>
                    <p><strong className="text-white">9.4.</strong> A binding professional engagement arises only through the relevant parties' valid agreement or applicable law.</p>
                    <p><strong className="text-white">9.5.</strong> Users must respect confidentiality obligations, copyright ownership and permissions attached to project materials.</p>
                    <p><strong className="text-white">9.6.</strong> Access to another user's project information does not grant permission to copy, disclose, exploit, sell or commercially develop that person's protected materials.</p>
                    <p><strong className="text-white">9.7.</strong> Users should execute appropriate written agreements or confidentiality arrangements before sharing commercially sensitive or unpublished material.</p>
                    <p><strong className="text-white">9.8.</strong> The Company does not guarantee that other users will honour independent confidentiality or commercial agreements.</p>
                    <p><strong className="text-white">9.9.</strong> The Company is not responsible for independent contractual disputes concerning credit, remuneration, intellectual property, creative differences, profit sharing or project abandonment, except where liability legally attaches to the Company.</p>
                </section>

                {/* 10. USER-GENERATED CONTENT AND INTELLECTUAL PROPERTY */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">10.</span>
                        USER-GENERATED CONTENT AND INTELLECTUAL PROPERTY
                    </h2>
                    <p><strong className="text-white">10.1.</strong> User-generated content may include photographs, videos, reels, showreels, written posts, reviews, comments, project descriptions, scripts, illustrations and other materials.</p>
                    <p><strong className="text-white">10.2.</strong> Users retain their existing ownership rights in content they lawfully create and upload.</p>
                    <p><strong className="text-white">10.3.</strong> By submitting content, users grant the Company a worldwide, non-exclusive, royalty-free licence, with sublicensing solely to service providers acting for the Platform, to host, reproduce, technically adapt, transmit and display that content as reasonably necessary to operate, secure and deliver the Platform. Publicly shared content may be displayed in Platform discovery and promotion features. Separate permission will be requested for unrelated advertising or endorsements featuring a user's identity or private work.</p>
                    <p><strong className="text-white">10.4.</strong> The licence includes necessary technical processing such as transcoding video, generating previews, displaying thumbnails, creating search indexes and distributing content through contracted hosting or delivery providers.</p>
                    <p><strong className="text-white">10.5.</strong> Users represent that they own or possess sufficient permission to upload and authorise the Platform's use of their content.</p>
                    <p><strong className="text-white">10.6.</strong> Uploading film scenes, copyrighted music, background scores, production footage, movie posters, photographs or third-party creative works without sufficient rights is prohibited.</p>
                    <p><strong className="text-white">10.7.</strong> Users are independently responsible for infringement arising from their unauthorised uploads.</p>
                    <p><strong className="text-white">10.8.</strong> The Company may remove or restrict allegedly infringing material in accordance with applicable law.</p>
                    <p><strong className="text-white">10.9.</strong> The Company does not acquire ownership of original scripts, showreels or creative materials merely because they are uploaded.</p>
                    <p><strong className="text-white">10.10.</strong> The Platform will not treat the general content licence in this section as consent to train third-party generative AI models on users' private scripts, unpublished projects or personal portfolio materials. Such use would require a separate lawful basis or appropriate permission.</p>
                    <p><strong className="text-white">10.11.</strong> On deletion of content or closure of an account, the Platform licence ends for the deleted content except to the extent continued retention or processing is legally permitted or required, or necessary for security, dispute resolution, backup cycles or prior authorised distributions.</p>
                </section>

                {/* 11. FILM NEWS, CINEMAWIRE AND RSS AGGREGATION */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">11.</span>
                        FILM NEWS, CINEMAWIRE AND RSS AGGREGATION
                    </h2>
                    <p><strong className="text-white">11.1.</strong> The Platform may display film news, entertainment updates, production announcements, release information, box-office reporting and industry developments through its CinemaWire and related services.</p>
                    <p><strong className="text-white">11.2.</strong> News may originate from authorised RSS feeds, licensed publishers, official announcements, direct submissions, third-party APIs and other lawful sources.</p>
                    <p><strong className="text-white">11.3.</strong> Copyright and other intellectual property rights in third-party articles, photographs, headlines, logos and associated material remain with the respective rights holders.</p>
                    <p><strong className="text-white">11.4.</strong> The Company does not claim ownership of independently published news content merely because it is indexed or aggregated by the Platform.</p>
                    <p><strong className="text-white">11.5.</strong> Third-party material will be displayed subject to applicable law, available permissions and relevant publisher terms.</p>
                    <p><strong className="text-white">11.6.</strong> The availability of a public RSS feed does not independently grant unrestricted commercial republication rights.</p>
                    <p><strong className="text-white">11.7.</strong> Where third-party news is lawfully displayed, the Platform will identify the originating publisher and link to the original publication where available. Source attribution does not replace permission where copyright or contractual permission is required.</p>
                    <p><strong className="text-white">11.8.</strong> The Company does not guarantee the accuracy, completeness or timeliness of third-party reports, rumours, release announcements, casting news or financial information.</p>
                    <p><strong className="text-white">11.9.</strong> News reports and commentary supplied by external publishers represent their respective authors' or publishers' content, not necessarily the Company's views.</p>
                    <p><strong className="text-white">11.10.</strong> The Company may remove, suspend or discontinue individual feeds or news items in response to rights concerns, accuracy concerns, legal requirements or operational decisions.</p>
                    <p><strong className="text-white">11.11.</strong> Rights holders and authorised representatives may submit copyright or other legal complaints through the designated grievance mechanism.</p>
                    <p><strong className="text-white">11.12.</strong> Where the Company independently authors, edits or publishes original editorial content, responsibility for that content shall be determined under applicable law and shall not automatically be treated as responsibility of a third-party RSS publisher.</p>
                </section>

                {/* 12. FILM REVIEWS, RATINGS AND CRITICISM */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">12.</span>
                        FILM REVIEWS, RATINGS AND CRITICISM
                    </h2>
                    <p><strong className="text-white">12.1.</strong> Registered users and authorised contributors may be permitted to publish movie reviews, ratings, recommendations, comments and film criticism.</p>
                    <p><strong className="text-white">12.2.</strong> Reviews reflect the opinions of their authors unless expressly published as an official Company editorial assessment.</p>
                    <p><strong className="text-white">12.3.</strong> Users must not publish reviews containing knowingly false factual allegations, unlawful defamation, threats, harassment, impersonation or infringement.</p>
                    <p><strong className="text-white">12.4.</strong> Lawful negative criticism, artistic disagreement and honest expressions of opinion are permitted.</p>
                    <p><strong className="text-white">12.5.</strong> The following conduct is prohibited:</p>
                    <ol className="list-none pl-4 space-y-1 text-zinc-300">
                        <li><strong>a.</strong> Fabricated reviews.</li>
                        <li><strong>b.</strong> Automated ratings or fake review accounts.</li>
                        <li><strong>c.</strong> Coordinated manipulation intended to deceive audiences.</li>
                        <li><strong>d.</strong> Undisclosed paid or incentivised reviews where disclosure is legally required.</li>
                        <li><strong>e.</strong> Impersonation of critics, journalists or audience members.</li>
                        <li><strong>f.</strong> Review extortion or demands for payment to alter or suppress ratings.</li>
                    </ol>
                    <p><strong className="text-white">12.6.</strong> Reviewers are responsible for the accuracy of factual claims they make and for compliance with applicable law.</p>
                    <p><strong className="text-white">12.7.</strong> The Company may investigate and moderate reviews that violate these Terms.</p>
                    <p><strong className="text-white">12.8.</strong> Ratings may be calculated using algorithms and may change as new information or reviews are received.</p>
                    <p><strong className="text-white">12.9.</strong> Ratings and recommendations do not constitute guarantees of artistic quality, commercial success or professional suitability.</p>
                    <p><strong className="text-white">12.10.</strong> Film producers, distributors, artists and reviewers may report allegedly unlawful content through the established grievance mechanism.</p>
                </section>

                {/* 13. GUILDS, FORUMS AND COMMUNITY DISCUSSIONS */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">13.</span>
                        GUILDS, FORUMS AND COMMUNITY DISCUSSIONS
                    </h2>
                    <p><strong className="text-white">13.1.</strong> Guilds, forums and professional groups are intended for lawful industry discussions, networking and knowledge sharing.</p>
                    <p><strong className="text-white">13.2.</strong> Unless expressly designated otherwise, a Platform guild is a digital discussion community and is not an officially recognised trade union, professional association, government body or statutory organisation.</p>
                    <p><strong className="text-white">13.3.</strong> Guild membership does not confer official professional certification.</p>
                    <p><strong className="text-white">13.4.</strong> Users are independently responsible for opinions, claims, attachments and communications shared within guilds.</p>
                    <p><strong className="text-white">13.5.</strong> Harassment, impersonation, unlawful discrimination, confidential-information leaks and coordinated abuse are prohibited.</p>
                    <p><strong className="text-white">13.6.</strong> Group administrators or moderators may have additional responsibilities under applicable community rules.</p>
                    <p><strong className="text-white">13.7.</strong> The Company may remove content, suspend discussions or restrict group privileges when reasonably necessary for safety, lawful compliance or policy enforcement.</p>
                </section>

                {/* 14. PRIVATE MESSAGES AND COMMUNICATIONS */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">14.</span>
                        PRIVATE MESSAGES AND COMMUNICATIONS
                    </h2>
                    <p><strong className="text-white">14.1.</strong> The Platform may provide direct messaging, group messaging, professional requests and notifications.</p>
                    <p><strong className="text-white">14.2.</strong> Users are independently responsible for the content and consequences of messages they send.</p>
                    <p><strong className="text-white">14.3.</strong> Sending unsolicited sexually explicit communications, threats, fraudulent offers, phishing links or repeated harassing messages is prohibited.</p>
                    <p><strong className="text-white">14.4.</strong> Users must not distribute another person's private communications without lawful authority or a valid legal basis.</p>
                    <p><strong className="text-white">14.5.</strong> Users acknowledge that recipients may preserve, disclose or act upon communications outside the Company's control.</p>
                    <p><strong className="text-white">14.6.</strong> The Company does not guarantee that another user will maintain the confidentiality of information voluntarily disclosed to them.</p>
                    <p><strong className="text-white">14.7.</strong> Message data may be processed, accessed, preserved or disclosed only in accordance with applicable law, the Privacy Policy, valid legal requests and disclosed safety or security procedures.</p>
                    <p><strong className="text-white">14.8.</strong> The Company does not represent that messaging is end-to-end encrypted unless that functionality is expressly implemented and disclosed.</p>
                </section>

                {/* 15. FILM STUDIOS, FACILITIES, EQUIPMENT AND LOCATIONS */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">15.</span>
                        FILM STUDIOS, FACILITIES, EQUIPMENT AND LOCATIONS
                    </h2>
                    <p><strong className="text-white">15.1.</strong> The Platform may display studios, production floors, editing facilities, dubbing suites, equipment providers, shooting locations and related services.</p>
                    <p><strong className="text-white">15.2.</strong> Listings may contain information supplied by independent vendors.</p>
                    <p><strong className="text-white">15.3.</strong> Unless expressly stated otherwise, the Company does not own, inspect, operate, maintain or guarantee listed facilities or equipment.</p>
                    <p><strong className="text-white">15.4.</strong> Vendors are responsible for the accuracy of prices, specifications, availability, ownership, safety information and applicable licences.</p>
                    <p><strong className="text-white">15.5.</strong> Users must independently confirm booking terms, deposits, taxes, cancellation conditions, insurance, equipment condition and operational permissions.</p>
                    <p><strong className="text-white">15.6.</strong> The Company is not automatically a party to direct transactions between users and listed vendors.</p>
                    <p><strong className="text-white">15.7.</strong> Any direct booking, rental or service contract is between the relevant parties unless the Company expressly identifies itself as a contracting party.</p>
                    <p><strong className="text-white">15.8.</strong> To the extent permitted by law, the Company disclaims liability arising solely from independent vendor defaults, service failures, equipment damage, on-site incidents or contractual breaches.</p>
                    <p><strong className="text-white">15.9.</strong> If the Company introduces integrated payments, managed bookings or booking guarantees, supplementary transaction terms may apply.</p>
                    <p><strong className="text-white">15.10.</strong> Ratings, prices and availability information must not knowingly be fabricated or materially misleading. Demonstration data must be clearly marked as such and shall not be presented as an authentic offer, review or booking opportunity.</p>
                </section>

                {/* 16. USER SAFETY AND INDEPENDENT DUE DILIGENCE */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">16.</span>
                        USER SAFETY AND INDEPENDENT DUE DILIGENCE
                    </h2>
                    <p><strong className="text-white">16.1.</strong> Users should exercise reasonable care when responding to auditions, offers, collaborations and commercial listings.</p>
                    <p><strong className="text-white">16.2.</strong> Users are advised to:</p>
                    <ol className="list-none pl-4 space-y-1 text-zinc-300">
                        <li><strong>a.</strong> Verify the identity and authority of recruiters.</li>
                        <li><strong>b.</strong> Prefer legitimate professional locations for auditions and interviews.</li>
                        <li><strong>c.</strong> Obtain written agreements where appropriate.</li>
                        <li><strong>d.</strong> Avoid sending money to obtain casting selection.</li>
                        <li><strong>e.</strong> Verify payment instructions before transferring funds.</li>
                        <li><strong>f.</strong> Avoid unnecessarily sharing sensitive identification or financial documents.</li>
                        <li><strong>g.</strong> Report suspicious activity through the Platform.</li>
                    </ol>
                    <p><strong className="text-white">16.3.</strong> The Company may provide safety notices, warnings or reporting features.</p>
                    <p><strong className="text-white">16.4.</strong> Such measures do not constitute a guarantee of safety or professional legitimacy.</p>
                    <p><strong className="text-white">16.5.</strong> The Company may cooperate with competent law-enforcement authorities where legally required or permitted.</p>
                </section>

                {/* 17. CONTENT MODERATION, REPORTING AND ACCOUNT ENFORCEMENT */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">17.</span>
                        CONTENT MODERATION, REPORTING AND ACCOUNT ENFORCEMENT
                    </h2>
                    <p><strong className="text-white">17.1.</strong> The Company may moderate content using human review, automated tools, user reports and other reasonable processes.</p>
                    <p><strong className="text-white">17.2.</strong> The Company may investigate suspected breaches of these Terms.</p>
                    <p><strong className="text-white">17.3.</strong> Subject to applicable law, the Company may:</p>
                    <ol className="list-none pl-4 space-y-1 text-zinc-300">
                        <li><strong>a.</strong> Issue warnings.</li>
                        <li><strong>b.</strong> Restrict individual content.</li>
                        <li><strong>c.</strong> Disable suspicious listings.</li>
                        <li><strong>d.</strong> Remove unlawful or prohibited material.</li>
                        <li><strong>e.</strong> Suspend posting or messaging privileges.</li>
                        <li><strong>f.</strong> Temporarily restrict accounts.</li>
                        <li><strong>g.</strong> Permanently terminate accounts for serious or repeated violations.</li>
                    </ol>
                    <p><strong className="text-white">17.4.</strong> Moderation decisions may be reviewed through applicable internal or statutory grievance processes.</p>
                    <p><strong className="text-white">17.5.</strong> The Company is not required to publish every submission or maintain every account indefinitely.</p>
                    <p><strong className="text-white">17.6.</strong> Removing or restricting particular content does not necessarily mean the Company endorses other content remaining on the Platform.</p>
                    <p><strong className="text-white">17.7.</strong> The Platform may preserve relevant evidence and cooperate with authorities in accordance with law.</p>
                    <p><strong className="text-white">17.8.</strong> The Company will implement reporting, removal, appeal and other safeguards required by the applicable intermediary rules, including requirements concerning unlawful and synthetically generated information.</p>
                    <p><strong className="text-white">17.9.</strong> At least once every three months, as required by applicable intermediary rules, the Platform will inform users in an accessible manner of relevant rules and policies, its ability to remove non-compliant content or suspend access, potential legal consequences for unlawful conduct and mandatory reporting where required by law.</p>
                    <p><strong className="text-white">17.10.</strong> Users must truthfully disclose AI-generated or materially altered content where required by applicable law or Platform rules, and must not use such content to impersonate individuals, falsify auditions, manufacture professional endorsements or facilitate unlawful conduct.</p>
                </section>

                {/* 18. THIRD-PARTY WEBSITES, APPLICATIONS AND SERVICES */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">18.</span>
                        THIRD-PARTY WEBSITES, APPLICATIONS AND SERVICES
                    </h2>
                    <p><strong className="text-white">18.1.</strong> The Platform may contain links to third-party websites, streaming services, social media platforms, news publishers, payment providers and professional services.</p>
                    <p><strong className="text-white">18.2.</strong> Such services operate under their respective terms and privacy policies.</p>
                    <p><strong className="text-white">18.3.</strong> Inclusion of a link, integration or reference does not automatically imply endorsement, commercial association or verification.</p>
                    <p><strong className="text-white">18.4.</strong> The Company does not control independent third-party websites and is not responsible for their separate acts, representations, policies or services except where applicable law provides otherwise.</p>
                </section>

                {/* 19. ADVERTISING, SPONSORED CONTENT AND PROMOTIONS */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">19.</span>
                        ADVERTISING, SPONSORED CONTENT AND PROMOTIONS
                    </h2>
                    <p><strong className="text-white">19.1.</strong> The Platform may offer advertisements, promoted profiles, sponsored listings, brand campaigns and other commercial placements.</p>
                    <p><strong className="text-white">19.2.</strong> Sponsored or paid content will be identified where required by applicable law.</p>
                    <p><strong className="text-white">19.3.</strong> Advertisers are responsible for ensuring that their advertisements and claims comply with applicable law.</p>
                    <p><strong className="text-white">19.4.</strong> The Company may reject or remove advertisements that violate policies, third-party rights or applicable law.</p>
                    <p><strong className="text-white">19.5.</strong> Payment for promotion does not guarantee employment, film success, audience reach, professional credibility or user engagement.</p>
                    <p><strong className="text-white">19.6.</strong> Paid promotional placement does not itself constitute identity verification or endorsement.</p>
                </section>

                {/* 20. SUBSCRIPTIONS, PAYMENTS AND REFUNDS */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">20.</span>
                        SUBSCRIPTIONS, PAYMENTS AND REFUNDS
                    </h2>
                    <p><strong className="text-white">20.1.</strong> The Company may introduce free or paid membership tiers, subscriptions, promotional services and other optional paid features.</p>
                    <p><strong className="text-white">20.2.</strong> Applicable charges, billing intervals, taxes and service inclusions will be disclosed before a purchase.</p>
                    <p><strong className="text-white">20.3.</strong> Recurring billing will operate only on terms appropriately disclosed and authorised by the user.</p>
                    <p><strong className="text-white">20.4.</strong> Cancellation, refund and renewal conditions will be governed by the applicable purchase terms and mandatory law.</p>
                    <p><strong className="text-white">20.5.</strong> Unless expressly stated otherwise, payment for Platform services does not guarantee employment, casting selection, bookings or commercial outcomes.</p>
                    <p><strong className="text-white">20.6.</strong> The Company may suspend paid services for non-payment, fraud or misuse in accordance with applicable law and purchase terms.</p>
                </section>

                {/* 21. PRIVACY AND DATA PROTECTION */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">21.</span>
                        PRIVACY AND DATA PROTECTION
                    </h2>
                    <p><strong className="text-white">21.1.</strong> The Company processes personal information in accordance with its Privacy Policy and applicable data-protection laws.</p>
                    <p><strong className="text-white">21.2.</strong> Personal information may include account data, contact information, profile details, professional credentials, uploaded media, communications and technical usage information.</p>
                    <p><strong className="text-white">21.3.</strong> Specific purposes, lawful grounds, recipients, retention practices, security measures and user rights will be explained in the Privacy Policy and other required notices.</p>
                    <p><strong className="text-white">21.4.</strong> Users must not unlawfully collect, publish, sell or misuse other members' personal information.</p>
                    <p><strong className="text-white">21.5.</strong> Users must not scrape profiles, contact lists, messages or personal data through unauthorised automated methods.</p>
                    <p><strong className="text-white">21.6.</strong> No internet service can guarantee absolute security, but this provision does not diminish the Company's applicable duties to implement reasonable and legally required protections.</p>
                </section>

                {/* 22. SERVICE AVAILABILITY AND DISCLAIMER OF WARRANTIES */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">22.</span>
                        SERVICE AVAILABILITY AND DISCLAIMER OF WARRANTIES
                    </h2>
                    <p><strong className="text-white">22.1.</strong> The Platform is provided on an "AS IS" and "AS AVAILABLE" basis to the maximum extent permitted by applicable law.</p>
                    <p><strong className="text-white">22.2.</strong> The Company does not guarantee uninterrupted access, error-free operation, continuous availability of every feature or freedom from all security threats.</p>
                    <p><strong className="text-white">22.3.</strong> The Company does not warrant the accuracy of every independent user submission, professional claim, review, recruitment listing or third-party publication.</p>
                    <p><strong className="text-white">22.4.</strong> The Company may modify, discontinue or temporarily suspend features for maintenance, legal compliance, safety or operational reasons, subject to applicable contractual and statutory obligations.</p>
                    <p><strong className="text-white">22.5.</strong> Nothing in this section excludes warranties, remedies or obligations that cannot lawfully be excluded.</p>
                </section>

                {/* 23. LIMITATION OF COMPANY LIABILITY */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">23.</span>
                        LIMITATION OF COMPANY LIABILITY
                    </h2>
                    <p><strong className="text-white">23.1.</strong> To the maximum extent permitted by applicable law, the Company, its directors, officers, employees and authorised representatives shall not be liable for indirect, incidental, special, exemplary or consequential losses arising from use of the Platform.</p>
                    <p><strong className="text-white">23.2.</strong> Such losses may include lost business opportunities, unrealised employment prospects, anticipated production revenue, loss of goodwill or other consequential commercial losses, except where their exclusion is prohibited by law.</p>
                    <p><strong className="text-white">23.3.</strong> The Company shall not be held liable merely because independent users engage in:</p>
                    <ol className="list-none pl-4 space-y-1 text-zinc-300">
                        <li><strong>a.</strong> Fraudulent casting activity.</li>
                        <li><strong>b.</strong> Harassment or unlawful conduct.</li>
                        <li><strong>c.</strong> Misrepresentation of qualifications or identity.</li>
                        <li><strong>d.</strong> Failure to pay agreed remuneration.</li>
                        <li><strong>e.</strong> Breach of independent agreements.</li>
                        <li><strong>f.</strong> Damage to independently rented equipment.</li>
                        <li><strong>g.</strong> Unauthorized copying of creative materials.</li>
                        <li><strong>h.</strong> Inaccurate user-generated reviews.</li>
                        <li><strong>i.</strong> Disputes over film credits, collaboration or production ownership.</li>
                        <li><strong>j.</strong> Other conduct outside the Company's control.</li>
                    </ol>
                    <p><strong className="text-white">23.4.</strong> For claims based solely on breach of contract concerning paid services supplied directly by the Company, and only to the extent legally enforceable, aggregate contractual damages shall not exceed the amount the claimant paid the Company for the affected service in the twelve months preceding the claim. This provision does not restrict statutory rights or remedies.</p>
                    <p><strong className="text-white">23.5.</strong> The above contractual cap does not apply where its application would be unlawful or would exclude non-excludable statutory remedies, fraud, wilful misconduct or other liabilities that cannot legally be limited.</p>
                    <p><strong className="text-white">23.6.</strong> No provision of these Terms prevents a competent court or authority from determining the Company's actual responsibility under applicable law.</p>
                </section>

                {/* 24. INDEMNIFICATION */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">24.</span>
                        INDEMNIFICATION
                    </h2>
                    <p><strong className="text-white">24.1.</strong> To the extent permitted by law, users agree to indemnify and hold harmless the Company, its directors, officers, employees and authorised representatives from third-party claims, losses, damages and reasonable legal expenses arising directly from:</p>
                    <ol className="list-none pl-4 space-y-1 text-zinc-300">
                        <li><strong>a.</strong> The user's unlawful conduct.</li>
                        <li><strong>b.</strong> The user's material breach of these Terms.</li>
                        <li><strong>c.</strong> The user's fraudulent or misleading representations.</li>
                        <li><strong>d.</strong> Intellectual property infringements caused by the user's unauthorised content.</li>
                        <li><strong>e.</strong> Privacy violations committed by the user.</li>
                        <li><strong>f.</strong> Recruitment scams, contractual misrepresentations or other unlawful acts attributable to the user.</li>
                    </ol>
                    <p><strong className="text-white">24.2.</strong> This obligation applies only to the extent the claim or loss is attributable to the user's conduct and not to the Company's independent wrongdoing.</p>
                    <p><strong className="text-white">24.3.</strong> The Company shall provide reasonably prompt notice of an indemnified third-party claim where practicable and shall not enter into a settlement imposing obligations on the user without appropriate consent, except as permitted by law.</p>
                </section>

                {/* 25. GRIEVANCE REDRESSAL AND LEGAL COMPLAINTS */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">25.</span>
                        GRIEVANCE REDRESSAL AND LEGAL COMPLAINTS
                    </h2>
                    <p><strong className="text-white">25.1.</strong> The Company maintains a grievance redressal mechanism for complaints relating to content, account misuse, intellectual property, safety and other matters within the scope of applicable law.</p>
                    
                    {/* Designated Officer Box */}
                    <div className="p-5 rounded-2xl bg-[#121316] border border-amber-500/20 space-y-2">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                            <span className="material-symbols-outlined text-sm">support_agent</span>
                            <span>Designated Grievance Officer</span>
                        </div>
                        <p className="text-white font-bold text-sm">Name: Junaid Siddiqui</p>
                        <p className="text-xs text-zinc-300">Organisation: 5M Collective Services Private Limited (5MC)</p>
                        <p className="text-xs text-zinc-300">Designation: Grievance Officer</p>
                        <p className="text-xs text-zinc-300">
                            Email: <a href="mailto:ifilmdirectory@gmail.com" className="text-amber-400 hover:underline">ifilmdirectory@gmail.com</a>
                        </p>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                            Address for correspondence and notices: 105, First Floor, Sahiti Sri Vidya Petals, Street No. 1, Patrika Nagar, HITEC City, Hyderabad, Telangana 500081, India
                        </p>
                    </div>

                    <p><strong className="text-white">25.2.</strong> Complaints should identify the relevant material, account, URL or conduct and contain sufficient information for review.</p>
                    <p><strong className="text-white">25.3.</strong> For complaints governed by Part II of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, as amended, the Company shall follow applicable statutory requirements, including:</p>
                    <ol className="list-none pl-4 space-y-1 text-zinc-300">
                        <li><strong>a.</strong> Acknowledging complaints within 24 hours.</li>
                        <li><strong>b.</strong> Resolving ordinary grievances within seven days, where that period applies.</li>
                        <li><strong>c.</strong> Resolving applicable prohibited-content grievances within 36 hours, where that period applies.</li>
                        <li><strong>d.</strong> Taking reasonable and practicable removal or access-disabling measures within two hours for qualifying complaints involving intimate imagery, specified nudity or electronic impersonation, including morphed imagery.</li>
                        <li><strong>e.</strong> Complying with qualifying court orders and authorised government directions within applicable statutory deadlines, including the three-hour period where legally triggered.</li>
                    </ol>
                    <p><strong className="text-white">25.4.</strong> Different procedures may apply to specific types of grievances, regulated content or services under applicable law.</p>
                    <p><strong className="text-white">25.5.</strong> The Company may request additional information where reasonably necessary to assess a complaint.</p>
                    <p><strong className="text-white">25.6.</strong> Where a complaint is unsupported, fraudulent or abusive, the Company may decline the requested action following any review and procedural safeguards required by law.</p>
                    <p><strong className="text-white">25.7.</strong> Eligible complainants may exercise applicable statutory appeal rights, including through the Grievance Appellate Committee where relevant.</p>
                    <p><strong className="text-white">25.8.</strong> The Company may preserve records, restrict disputed material or cooperate with competent authorities where authorised or required by law.</p>
                </section>

                {/* 26. COPYRIGHT COMPLAINTS AND TAKEDOWN REQUESTS */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">26.</span>
                        COPYRIGHT COMPLAINTS AND TAKEDOWN REQUESTS
                    </h2>
                    <p><strong className="text-white">26.1.</strong> Rights holders or their authorised representatives may report allegedly infringing material.</p>
                    <p><strong className="text-white">26.2.</strong> A complaint should identify:</p>
                    <ol className="list-none pl-4 space-y-1 text-zinc-300">
                        <li><strong>a.</strong> The copyrighted work or protected material.</li>
                        <li><strong>b.</strong> The allegedly infringing material and its location on the Platform.</li>
                        <li><strong>c.</strong> The complainant's identity and contact information.</li>
                        <li><strong>d.</strong> The complainant's ownership or authority to act.</li>
                        <li><strong>e.</strong> Relevant supporting evidence.</li>
                    </ol>
                    <p><strong className="text-white">26.3.</strong> The Company may investigate complaints and restrict or remove material as required or permitted by applicable law.</p>
                    <p><strong className="text-white">26.4.</strong> Users must not knowingly submit false copyright complaints or misleading ownership claims.</p>
                    <p><strong className="text-white">26.5.</strong> Repeated infringement may result in account restriction or termination.</p>
                    <p><strong className="text-white">26.6.</strong> Users may challenge allegedly mistaken removals through the available grievance process.</p>
                </section>

                {/* 27. ACCOUNT SUSPENSION, TERMINATION AND DELETION */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">27.</span>
                        ACCOUNT SUSPENSION, TERMINATION AND DELETION
                    </h2>
                    <p><strong className="text-white">27.1.</strong> Users may request account deletion through the available account settings or designated support channel.</p>
                    <p><strong className="text-white">27.2.</strong> The Company may suspend or terminate access for serious or repeated violations, fraud, legal requirements, security risks or material misuse.</p>
                    <p><strong className="text-white">27.3.</strong> Advance notice may be omitted where immediate action is reasonably necessary or lawful.</p>
                    <p><strong className="text-white">27.4.</strong> Upon termination, access to account features may cease and publicly displayed content may be removed or restricted.</p>
                    <p><strong className="text-white">27.5.</strong> The Company may retain records only where legally authorised or required, including for security, dispute resolution, regulatory obligations or legitimate backup processes, as described in the Privacy Policy.</p>
                    <p><strong className="text-white">27.6.</strong> Account termination does not cancel debts, existing independent contracts or liabilities accrued before termination.</p>
                </section>

                {/* 28. PLATFORM INTELLECTUAL PROPERTY */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">28.</span>
                        PLATFORM INTELLECTUAL PROPERTY
                    </h2>
                    <p><strong className="text-white">28.1.</strong> The iFilmDirectory name, branding, original interfaces, software, designs, database structure and other Company-owned intellectual property are protected under applicable law.</p>
                    <p><strong className="text-white">28.2.</strong> Users receive a limited, non-exclusive, revocable right to access and use the Platform in accordance with these Terms.</p>
                    <p><strong className="text-white">28.3.</strong> Users must not unlawfully copy Platform code, impersonate its branding, circumvent security controls or conduct unauthorised scraping or automated extraction.</p>
                    <p><strong className="text-white">28.4.</strong> Ownership of user-generated and third-party content remains subject to the rights described elsewhere in these Terms.</p>
                </section>

                {/* 29. GOVERNING LAW AND JURISDICTION */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">29.</span>
                        GOVERNING LAW AND JURISDICTION
                    </h2>
                    <p><strong className="text-white">29.1.</strong> These Terms shall be governed by the laws of India.</p>
                    <p><strong className="text-white">29.2.</strong> Subject to mandatory statutory rights, jurisdictional requirements and non-excludable remedies, disputes arising from these Terms shall be submitted to competent courts in Hyderabad, Telangana, India.</p>
                    <p><strong className="text-white">29.3.</strong> Nothing in these Terms prevents users from exercising remedies before authorities, consumer forums or courts having mandatory jurisdiction under applicable law.</p>
                </section>

                {/* 30. GENERAL PROVISIONS */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">30.</span>
                        GENERAL PROVISIONS
                    </h2>
                    <p><strong className="text-white">30.1. Severability:</strong> If any provision is held invalid or unenforceable, the remaining provisions shall continue to apply to the extent legally possible.</p>
                    <p><strong className="text-white">30.2. No Waiver:</strong> Failure to enforce a provision immediately does not constitute a permanent waiver of that right.</p>
                    <p><strong className="text-white">30.3. Assignment:</strong> The Company may assign its rights and obligations in connection with a lawful merger, acquisition or business transfer, subject to applicable law. Users may not transfer their accounts without authorisation.</p>
                    <p><strong className="text-white">30.4. Entire Agreement:</strong> These Terms, together with incorporated policies and applicable service-specific terms, constitute the agreement governing use of the Platform.</p>
                    <p><strong className="text-white">30.5. Conflict of Terms:</strong> Applicable mandatory law prevails over inconsistent contractual provisions. Specific transaction terms may govern particular paid services where clearly disclosed.</p>
                    <p><strong className="text-white">30.6. Language:</strong> The English version shall serve as the reference version to the extent permitted by law. Additional language versions may be provided.</p>
                </section>

                {/* 31. CONTACT INFORMATION */}
                <section className="space-y-3.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight border-b border-white/10 pb-2 flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-base">31.</span>
                        CONTACT INFORMATION
                    </h2>
                    <div className="p-5 rounded-2xl bg-[#121316] border border-white/10 space-y-2">
                        <p className="text-base font-black text-white">iFilmDirectory</p>
                        <p className="text-xs text-zinc-300">A property of: <strong className="text-white">5M Collective Services Private Limited (5MC)</strong></p>
                        <p className="text-xs text-zinc-300">
                            Website: <a href="https://ifilmdirectory.com" className="text-amber-400 hover:underline">https://ifilmdirectory.com</a>
                        </p>
                        <p className="text-xs text-zinc-300">
                            Support and Grievances: <a href="mailto:ifilmdirectory@gmail.com" className="text-amber-400 hover:underline">ifilmdirectory@gmail.com</a>
                        </p>
                        <p className="text-xs text-zinc-300">Business Location: Hyderabad, Telangana, India</p>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                            Correspondence Address: 105, First Floor, Sahiti Sri Vidya Petals, Street No. 1, Patrika Nagar, HITEC City, Hyderabad, Telangana 500081, India
                        </p>
                    </div>
                </section>

                {/* USER ACKNOWLEDGEMENT & INTERACTIVE "I AGREE" ACTION */}
                <section id="user-acknowledgement" className="pt-6 border-t border-amber-500/30 space-y-5 scroll-mt-24">
                    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#181920] to-[#121316] border-2 border-amber-500/40 shadow-2xl space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                                <span className="material-symbols-outlined text-2xl">gavel</span>
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                                    USER ACKNOWLEDGEMENT & AGREEMENT
                                </h2>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    Affirmative legal acceptance under the Laws of India
                                </p>
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-zinc-300">
                            By registering for or accessing iFilmDirectory, the user acknowledges that:
                        </p>

                        <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                            <li><strong>iFilmDirectory facilitates film-industry networking, discovery and information exchange.</strong></li>
                            <li><strong>Independent users are responsible for their own behaviour, representations, content and professional conduct.</strong></li>
                            <li><strong>The Company does not guarantee the authenticity, honesty, competence or reliability of every member.</strong></li>
                            <li><strong>The Company is not automatically responsible for independent user-to-user contractual disputes, recruitment failures, misconduct or offline incidents.</strong></li>
                            <li><strong>Users are expected to conduct appropriate independent verification before entering into professional or commercial arrangements.</strong></li>
                            <li><strong>The Company's obligations and liability remain subject to applicable Indian law and cannot be excluded where the law prohibits exclusion.</strong></li>
                        </ol>

                        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs text-zinc-300 leading-relaxed">
                            <strong>By selecting "I Agree", the user accepts these Terms of Service.</strong> The Privacy Policy is separately available for review, and consent for personal-data processing will be sought where required by applicable law.
                        </div>

                        {/* Interactive Acceptance Section */}
                        <div className="pt-2 border-t border-white/10 space-y-4">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => setIsChecked(e.target.checked)}
                                    className="mt-1 size-5 rounded border-white/20 bg-black/60 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer accent-amber-500 shrink-0"
                                />
                                <span className="text-xs sm:text-sm text-zinc-200 group-hover:text-white leading-snug">
                                    I confirm that I have read, understood, and voluntarily accept all 31 sections of these Terms of Service (Dated October 15, 2026, Owned & Operated by 5M Collective Services Pvt. Ltd. / 5MC).
                                </span>
                            </label>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                                <button
                                    onClick={handleAgree}
                                    disabled={!isChecked}
                                    className={`py-3.5 px-8 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                                        isChecked
                                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black cursor-pointer shadow-amber-500/20'
                                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                    <span>{hasAgreed ? 'Agreement Confirmed (Re-affirm)' : 'I Agree & Accept Terms'}</span>
                                </button>

                                {hasAgreed && (
                                    <button
                                        onClick={() => navigate('/')}
                                        className="py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-white/10"
                                    >
                                        <span>Proceed to iFilmDirectory</span>
                                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                                    </button>
                                )}
                            </div>

                            {hasAgreed && (
                                <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1">
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                    <span>Electronic acceptance recorded on {formattedAgreedDate || 'October 15, 2026'}.</span>
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
