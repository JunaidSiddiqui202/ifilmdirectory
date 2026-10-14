// Advanced Analytics Dashboard
// Comprehensive analytics for users and businesses

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnalyticsData {
    profileViews: {
        total: number;
        trend: number; // percentage change
        data: { date: string; value: number }[];
    };
    jobApplications: {
        total: number;
        accepted: number;
        pending: number;
        rejected: number;
    };
    engagement: {
        likes: number;
        comments: number;
        shares: number;
        followers: number;
    };
    topContent: {
        id: string;
        title: string;
        views: number;
        engagement: number;
    }[];
    demographics: {
        locations: { name: string; count: number }[];
        categories: { name: string; count: number }[];
    };
    performance: {
        avgLoadTime: number;
        errorRate: number;
        uptime: number;
    };
}

// Stat Card Component
const StatCard = ({
    title,
    value,
    trend,
    icon,
    color = 'blue',
}: {
    title: string;
    value: string | number;
    trend?: number;
    icon: string;
    color?: 'blue' | 'green' | 'purple' | 'orange';
}) => {
    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        purple: 'bg-purple-500',
        orange: 'bg-orange-500',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-white">{icon}</span>
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <span className="material-symbols-outlined text-sm">
                            {trend >= 0 ? 'trending_up' : 'trending_down'}
                        </span>
                        <span className="text-sm font-semibold">{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
            <h3 className="text-2xl font-bold mb-1">{value}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        </motion.div>
    );
};

// Chart Component (Simple bar chart)
const BarChart = ({ data }: { data: { label: string; value: number }[] }) => {
    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="space-y-3">
            {data.map((item, index) => (
                <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / maxValue) * 100}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-primary h-2 rounded-full"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

// Line Chart Component (Simple)
const LineChart = ({ data }: { data: { date: string; value: number }[] }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const points = data.map((d, i) => ({
        x: (i / (data.length - 1)) * 100,
        y: 100 - (d.value / maxValue) * 100,
    }));

    const pathD = points.map((p, i) =>
        i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
    ).join(' ');

    return (
        <div className="relative h-48">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                    d={pathD}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-primary"
                />
            </svg>
            <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                {data.map((d, i) => (
                    i % Math.floor(data.length / 5) === 0 && (
                        <span key={i}>{d.date}</span>
                    )
                ))}
            </div>
        </div>
    );
};

// Main Analytics Dashboard
export const AnalyticsDashboard = () => {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]); // Removed userId

    const fetchAnalytics = async () => {
        setLoading(true);

        // Simulate API call
        // In production, fetch from your analytics service
        setTimeout(() => {
            setAnalyticsData({
                profileViews: {
                    total: 1234,
                    trend: 12.5,
                    data: Array.from({ length: 30 }, (_, i) => ({
                        date: `Day ${i + 1}`,
                        value: Math.floor(Math.random() * 100) + 20, // Changed 'views' to 'value'
                    })),
                },
                jobApplications: {
                    total: 45,
                    accepted: 12,
                    pending: 28,
                    rejected: 5,
                },
                engagement: {
                    likes: 567,
                    comments: 234,
                    shares: 89,
                    followers: 1234,
                },
                topContent: [
                    { id: '1', title: 'Showreel 2024', views: 456, engagement: 89 },
                    { id: '2', title: 'Behind the Scenes', views: 234, engagement: 67 },
                    { id: '3', title: 'Director Portfolio', views: 189, engagement: 45 },
                ],
                demographics: {
                    locations: [
                        { name: 'Mumbai', count: 345 },
                        { name: 'Delhi', count: 234 },
                        { name: 'Bangalore', count: 189 },
                        { name: 'Hyderabad', count: 156 },
                    ],
                    categories: [
                        { name: 'Directors', count: 234 },
                        { name: 'Actors', count: 189 },
                        { name: 'Cinematographers', count: 145 },
                    ],
                },
                performance: {
                    avgLoadTime: 1.2,
                    errorRate: 0.5,
                    uptime: 99.9,
                },
            });
            setLoading(false);
        }, 1000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!analyticsData) {
        return <div>No data available</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Track your performance and engagement
                    </p>
                </div>

                {/* Time range selector */}
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    {(['7d', '30d', '90d', '1y'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg transition-colors ${timeRange === range
                                ? 'bg-white dark:bg-gray-700 shadow-sm'
                                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {range === '7d' && '7 Days'}
                            {range === '30d' && '30 Days'}
                            {range === '90d' && '90 Days'}
                            {range === '1y' && '1 Year'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Profile Views"
                    value={analyticsData.profileViews.total.toLocaleString()}
                    trend={analyticsData.profileViews.trend}
                    icon="visibility"
                    color="blue"
                />
                <StatCard
                    title="Job Applications"
                    value={analyticsData.jobApplications.total}
                    icon="work"
                    color="green"
                />
                <StatCard
                    title="Engagement"
                    value={analyticsData.engagement.likes + analyticsData.engagement.comments}
                    icon="favorite"
                    color="purple"
                />
                <StatCard
                    title="Followers"
                    value={analyticsData.engagement.followers.toLocaleString()}
                    icon="group"
                    color="orange"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Views Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Profile Views Over Time</h2>
                    <LineChart data={analyticsData.profileViews.data} />
                </div>

                {/* Job Applications Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Job Applications</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <span className="font-medium">Accepted</span>
                            <span className="text-2xl font-bold text-green-500">
                                {analyticsData.jobApplications.accepted}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <span className="font-medium">Pending</span>
                            <span className="text-2xl font-bold text-yellow-500">
                                {analyticsData.jobApplications.pending}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <span className="font-medium">Rejected</span>
                            <span className="text-2xl font-bold text-red-500">
                                {analyticsData.jobApplications.rejected}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Demographics and Top Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Locations */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Top Locations</h2>
                    <BarChart
                        data={analyticsData.demographics.locations.map(l => ({
                            label: l.name,
                            value: l.count,
                        }))}
                    />
                </div>

                {/* Top Content */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Top Performing Content</h2>
                    <div className="space-y-3">
                        {analyticsData.topContent.map((content, index) => (
                            <div key={content.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{content.title}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {content.views} views • {content.engagement} engagements
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-500 mb-2">
                            {analyticsData.performance.avgLoadTime}s
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Avg Load Time</p>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-500 mb-2">
                            {analyticsData.performance.uptime}%
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-orange-500 mb-2">
                            {analyticsData.performance.errorRate}%
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Error Rate</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
