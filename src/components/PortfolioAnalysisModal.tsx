import { useState } from 'react';
import { aiService, type PortfolioAnalysis } from '../services/aiService';
import AILoadingState from './AILoadingState';

interface PortfolioAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    showreelData: {
        title: string;
        description: string;
        duration?: string;
        category?: string;
        userRole?: string;
        // Professional Links for Enhanced Analysis
        imdbUrl?: string;
        wikipediaUrl?: string;
        cvFileName?: string;
    };
    onApplySuggestions?: (suggestions: string[]) => void;
}

export default function PortfolioAnalysisModal({
    isOpen,
    onClose,
    showreelData,
    onApplySuggestions
}: PortfolioAnalysisModalProps) {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'recommendations'>('overview');

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const result = await aiService.analyzePortfolio(showreelData);
            if (result.success && result.data) {
                setAnalysis(result.data);
            } else {
                alert(result.error || 'Failed to analyze portfolio');
            }
        } catch (error) {
            console.error('Error analyzing portfolio:', error);
            alert('Failed to analyze portfolio');
        } finally {
            setLoading(false);
        }
    };

    const handleApplySuggestions = () => {
        if (!analysis || !onApplySuggestions) return;

        const suggestions = analysis.recommendations
            .filter(r => r.type === 'improvement')
            .map(r => r.description);

        onApplySuggestions(suggestions);
        onClose();
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-orange-500';
    };

    const getScoreGradient = (score: number) => {
        if (score >= 80) return 'from-green-500 to-emerald-500';
        if (score >= 60) return 'from-yellow-500 to-orange-500';
        return 'from-orange-500 to-red-500';
    };

    if (!isOpen) return null;

    return (
        <>
            {loading && (
                <AILoadingState
                    message="Analyzing Your Complete Profile..."
                    subMessage={
                        showreelData.imdbUrl || showreelData.wikipediaUrl || showreelData.cvFileName
                            ? "Analyzing showreel, professional links, and career data"
                            : "Evaluating quality, content, and industry standards"
                    }
                />
            )}

            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#231810] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#684831]">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-primary to-purple-600 rounded-full p-2">
                                <span className="material-symbols-outlined text-white text-2xl">
                                    analytics
                                </span>
                            </div>
                            <div>
                                <h2 className="text-black dark:text-white text-xl font-bold">
                                    Portfolio Analysis
                                </h2>
                                <p className="text-gray-600 dark:text-[#cba990] text-sm">
                                    AI-powered feedback on your showreel
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-3xl">close</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
                        {!analysis ? (
                            <div className="p-8 text-center">
                                <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 dark:from-primary/20 dark:to-purple-600/20 rounded-2xl p-8 mb-6">
                                    <span className="material-symbols-outlined text-6xl text-primary mb-4 block">
                                        auto_awesome
                                    </span>
                                    <h3 className="text-black dark:text-white text-xl font-bold mb-2">
                                        Get AI-Powered Insights
                                    </h3>
                                    <p className="text-gray-600 dark:text-[#cba990] mb-6">
                                        Our AI will analyze your portfolio and provide detailed feedback on:
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 text-left mb-6">
                                        {[
                                            'Technical quality',
                                            'Content variety',
                                            'Professional presentation',
                                            'Industry comparison',
                                            'Improvement suggestions',
                                            'Strengths & weaknesses'
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-sm">
                                                    check_circle
                                                </span>
                                                <span className="text-gray-700 dark:text-[#cba990] text-sm">
                                                    {item}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={handleAnalyze}
                                    className="bg-gradient-to-r from-primary to-purple-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto"
                                >
                                    <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                                    <span>Analyze My Portfolio</span>
                                </button>
                            </div>
                        ) : (
                            <div className="p-6">
                                {/* Overall Score */}
                                <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 dark:from-primary/20 dark:to-purple-600/20 rounded-2xl p-6 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-black dark:text-white text-lg font-bold mb-2">
                                                Overall Score
                                            </h3>
                                            <p className="text-gray-600 dark:text-[#cba990] text-sm mb-4">
                                                Your portfolio is better than {analysis.comparisons.industryAverage}% of industry average
                                            </p>
                                            <div className="flex gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-[#cba990] mb-1">Industry Avg</p>
                                                    <p className="text-lg font-bold text-gray-700 dark:text-white">
                                                        {analysis.comparisons.industryAverage}%
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-[#cba990] mb-1">Top Performers</p>
                                                    <p className="text-lg font-bold text-gray-700 dark:text-white">
                                                        {analysis.comparisons.topPerformers}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative w-32 h-32">
                                            {/* Circular Progress */}
                                            <svg className="w-32 h-32 transform -rotate-90">
                                                <circle
                                                    cx="64"
                                                    cy="64"
                                                    r="56"
                                                    stroke="currentColor"
                                                    strokeWidth="8"
                                                    fill="none"
                                                    className="text-gray-200 dark:text-[#342418]"
                                                />
                                                <circle
                                                    cx="64"
                                                    cy="64"
                                                    r="56"
                                                    stroke="url(#scoreGradient)"
                                                    strokeWidth="8"
                                                    fill="none"
                                                    strokeDasharray={`${(analysis.overallScore / 100) * 352} 352`}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000"
                                                />
                                                <defs>
                                                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                        <stop offset="0%" className="text-primary" stopColor="currentColor" />
                                                        <stop offset="100%" className="text-purple-600" stopColor="currentColor" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <p className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                                                        {analysis.overallScore}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-[#cba990]">/ 100</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[#684831]">
                                    {[
                                        { id: 'overview', label: 'Overview', icon: 'dashboard' },
                                        { id: 'technical', label: 'Technical', icon: 'tune' },
                                        { id: 'recommendations', label: 'Tips', icon: 'lightbulb' }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex items-center gap-2 px-4 py-3 font-bold transition-all ${activeTab === tab.id
                                                ? 'text-primary border-b-2 border-primary'
                                                : 'text-gray-500 dark:text-[#cba990] hover:text-primary'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                                            <span>{tab.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        {/* Strengths */}
                                        <div>
                                            <h4 className="text-black dark:text-white text-lg font-bold mb-3 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-green-500">check_circle</span>
                                                Strengths
                                            </h4>
                                            <div className="space-y-2">
                                                {analysis.strengths.map((strength, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-3"
                                                    >
                                                        <span className="material-symbols-outlined text-green-500 text-xl mt-0.5">
                                                            star
                                                        </span>
                                                        <p className="text-gray-700 dark:text-white flex-1">{strength}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Improvements */}
                                        <div>
                                            <h4 className="text-black dark:text-white text-lg font-bold mb-3 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-orange-500">trending_up</span>
                                                Areas for Improvement
                                            </h4>
                                            <div className="space-y-2">
                                                {analysis.improvements.map((improvement, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 flex items-start gap-3"
                                                    >
                                                        <span className="material-symbols-outlined text-orange-500 text-xl mt-0.5">
                                                            arrow_upward
                                                        </span>
                                                        <p className="text-gray-700 dark:text-white flex-1">{improvement}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'technical' && (
                                    <div className="space-y-4">
                                        {Object.entries(analysis.technicalQuality).map(([key, value]) => (
                                            <div key={key}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-black dark:text-white font-bold capitalize">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </span>
                                                    <span className={`font-bold ${getScoreColor(value)}`}>
                                                        {value}/100
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-gray-200 dark:bg-[#342418] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full bg-gradient-to-r ${getScoreGradient(value)} transition-all duration-1000`}
                                                        style={{ width: `${value}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#684831]">
                                            <h4 className="text-black dark:text-white font-bold mb-4">Content Analysis</h4>
                                            {Object.entries(analysis.contentAnalysis).map(([key, value]) => (
                                                <div key={key} className="mb-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-black dark:text-white font-bold capitalize">
                                                            {key}
                                                        </span>
                                                        <span className={`font-bold ${getScoreColor(value)}`}>
                                                            {value}/100
                                                        </span>
                                                    </div>
                                                    <div className="h-3 bg-gray-200 dark:bg-[#342418] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full bg-gradient-to-r ${getScoreGradient(value)} transition-all duration-1000`}
                                                            style={{ width: `${value}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'recommendations' && (
                                    <div className="space-y-3">
                                        {analysis.recommendations.map((rec, idx) => {
                                            const icons = {
                                                improvement: 'arrow_upward',
                                                strength: 'star',
                                                suggestion: 'lightbulb'
                                            };
                                            const colors = {
                                                improvement: 'orange',
                                                strength: 'green',
                                                suggestion: 'blue'
                                            };
                                            const color = colors[rec.type];

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-200 dark:border-${color}-800 rounded-lg p-4`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className={`material-symbols-outlined text-${color}-500 text-2xl`}>
                                                            {icons[rec.type]}
                                                        </span>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h5 className="text-black dark:text-white font-bold">
                                                                    {rec.title}
                                                                </h5>
                                                                <span className={`text-xs px-2 py-1 rounded-full bg-${color}-100 dark:bg-${color}-900/40 text-${color}-700 dark:text-${color}-300 font-bold uppercase`}>
                                                                    {rec.priority}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-700 dark:text-[#cba990] text-sm">
                                                                {rec.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {analysis && onApplySuggestions && (
                        <div className="p-6 border-t border-gray-200 dark:border-[#684831] bg-gray-50 dark:bg-[#1a1108]">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setAnalysis(null)}
                                    className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-[#684831] text-gray-700 dark:text-[#cba990] font-bold hover:bg-gray-100 dark:hover:bg-[#342418] transition-colors"
                                >
                                    Analyze Again
                                </button>
                                <button
                                    onClick={handleApplySuggestions}
                                    className="flex-1 bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">auto_fix_high</span>
                                    <span>Apply Suggestions</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
