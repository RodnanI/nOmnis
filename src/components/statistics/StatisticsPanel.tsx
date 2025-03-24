'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { UserStatistics } from '@/hooks/useStatistics';

// Dynamically import chart components to reduce initial load time
const StatCards = dynamic<any>(
  () => import('@/components/statistics/StatCards'),
  { ssr: false, loading: () => <StatCardsLoading /> }
);

const ActivityChart = dynamic<any>(
  () => import('@/components/statistics/ActivityChart'),
  { ssr: false, loading: () => <ChartLoading /> }
);

const ProjectUsage = dynamic<any>(
  () => import('@/components/statistics/ProjectUsage'),
  { ssr: false, loading: () => <ChartLoading /> }
);

const ActivityHeatmap = dynamic<any>(
  () => import('@/components/statistics/ActivityHeatmap'),
  { ssr: false, loading: () => <ChartLoading /> }
);

// Loading placeholders
const StatCardsLoading = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(4)].map((_, index) => (
      <div key={index} className="bg-card rounded-xl h-32 animate-pulse"></div>
    ))}
  </div>
);

const ChartLoading = () => (
  <div className="h-60 bg-card rounded-lg animate-pulse"></div>
);

interface StatisticsPanelProps {
  statistics: UserStatistics | null;
  onRefresh?: () => void;
}

export default function StatisticsPanel({ statistics, onRefresh }: StatisticsPanelProps) {
    // Check if we have any data at all - real user data only, no fallbacks
    const hasData = statistics !== null && (
        statistics.totalHours > 0 || 
        statistics.completedTasks > 0 || 
        statistics.uploadedFiles > 0 ||
        statistics.projectUsage.some(p => p.usage > 0)
    );
    
    if (!hasData) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-8 bg-card rounded-xl border border-border text-center"
            >
                <h3 className="text-xl font-medium mb-4">No Statistics Available Yet</h3>
                <p className="text-muted-foreground mb-6">
                    Start using Omnis apps to generate usage statistics. Visit projects, complete tasks,
                    and upload files to see your activity reflected here.
                </p>
                <div className="p-6 bg-muted/50 rounded-lg inline-block">
                    <ul className="text-left list-disc list-inside text-muted-foreground">
                        <li className="mb-2">Visit different projects to see project usage stats</li>
                        <li className="mb-2">Spend time in projects to track hours</li>
                        <li className="mb-2">Complete tasks to see task completion stats</li>
                        <li className="mb-2">Upload files to track file uploads</li>
                    </ul>
                </div>
            </motion.div>
        );
    }
    
    // We have real data - process and display it
    return (
        <div className="space-y-8">
            <StatCards
                projects={statistics?.totalProjects || 0}
                hours={Math.round((statistics?.totalHours || 0) * 10) / 10}
                tasks={statistics?.completedTasks || 0}
                files={statistics?.uploadedFiles || 0}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-card rounded-xl p-6 border border-border shadow-sm"
                >
                    <h2 className="text-2xl font-semibold mb-6">Activity Overview</h2>
                    {statistics?.activityData?.length ? (
                        <ActivityChart data={statistics.activityData} />
                    ) : (
                        <div className="flex items-center justify-center h-60 text-muted-foreground">
                            No activity data available yet
                        </div>
                    )}
                </motion.div>
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-card rounded-xl p-6 border border-border shadow-sm"
                >
                    <h2 className="text-2xl font-semibold mb-6">Project Usage</h2>
                    {statistics?.projectUsage?.some(p => p.usage > 0) ? (
                        <ProjectUsage data={statistics.projectUsage} />
                    ) : (
                        <div className="flex items-center justify-center h-60 text-muted-foreground">
                            No project usage data available yet
                        </div>
                    )}
                </motion.div>
            </div>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-card rounded-xl p-6 border border-border shadow-sm"
            >
                <h2 className="text-2xl font-semibold mb-6">Activity Distribution</h2>
                {statistics?.dailyActivity?.some(d => d.value > 0) ? (
                    <ActivityHeatmap data={statistics.dailyActivity} />
                ) : (
                    <div className="flex items-center justify-center h-60 text-muted-foreground">
                        No activity distribution data available yet
                    </div>
                )}
            </motion.div>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-card rounded-xl p-6 border border-border shadow-sm text-center text-sm text-muted-foreground"
            >
                <p>Last updated: {statistics?.lastUpdated ? new Date(statistics.lastUpdated).toLocaleString() : 'N/A'}</p>
            </motion.div>
        </div>
    );
}