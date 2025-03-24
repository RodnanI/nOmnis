// Type declarations for statistics components

declare module '@/components/statistics/StatCards' {
  export interface StatCardsProps {
    projects: number;
    hours: number;
    tasks: number;
    files: number;
  }
  
  const StatCards: React.FC<StatCardsProps>;
  export default StatCards;
}

declare module '@/components/statistics/ActivityChart' {
  export interface ActivityDataPoint {
    name: string;
    date: string;
    hours: number;
    tasks: number;
  }
  
  export interface ActivityChartProps {
    data: ActivityDataPoint[];
  }
  
  const ActivityChart: React.FC<ActivityChartProps>;
  export default ActivityChart;
}

declare module '@/components/statistics/ProjectUsage' {
  export interface ProjectUsageData {
    name: string;
    usage: number;
  }
  
  export interface ProjectUsageProps {
    data: ProjectUsageData[];
  }
  
  const ProjectUsage: React.FC<ProjectUsageProps>;
  export default ProjectUsage;
}

declare module '@/components/statistics/ActivityHeatmap' {
  export interface HeatmapDataPoint {
    day: string;
    hour: number;
    value: number;
  }
  
  export interface ActivityHeatmapProps {
    data: HeatmapDataPoint[];
  }
  
  const ActivityHeatmap: React.FC<ActivityHeatmapProps>;
  export default ActivityHeatmap;
}