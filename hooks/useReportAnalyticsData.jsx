import { useMemo } from "react";

/**
 * A custom hook that processes an array of user reports and returns aggregated analytics.
 * It is designed to be performant by memoizing the calculations.
 *
 * @param {Array<object>} reports - The raw array of user report data.
 * @returns {object|null} An object containing analytics, or null if no data is provided.
 */
const useReportAnalyticsData = (reports) => {
  const analytics = useMemo(() => {
    // If there are no reports, return null to avoid errors.
    if (!reports || reports.length === 0) {
      return null;
    }

    // --- 1. Calculate Total Reports and Type Distribution ---
    const typeCounts = reports.reduce((acc, report) => {
      const type = report.type || "Other";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Convert the counts object to a sorted array for easy display
    const typeDistribution = Object.entries(typeCounts)
      .map(([type, count]) => ({
        type,
        count,
      }))
      .sort((a, b) => b.count - a.count); // Sort descending by count

    // --- 2. Calculate Reports Per Day for the Chart ---
    const reportsByDay = {};
    const today = new Date();
    // Pre-populate the last 7 days with 0 reports to ensure a complete chart
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      reportsByDay[formattedDate] = 0;
    }

    // Count the reports for each day
    reports.forEach((report) => {
      const reportDate = new Date(report.created_at);
      const formattedDate = reportDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (reportsByDay.hasOwnProperty(formattedDate)) {
        reportsByDay[formattedDate]++;
      }
    });

    // Convert the daily counts into the format required by the chart library
    const chartData = Object.entries(reportsByDay).map(([date, count]) => ({
      value: count,
      label: date,
      dataPointText: count.toString(),
    }));

    return {
      totalReports: reports.length,
      mostFrequentHazard: typeDistribution[0]?.type || "N/A",
      typeDistribution,
      chartData,
    };
  }, [reports]); // This calculation only re-runs if the `reports` array changes.

  return { analytics };
};

export default useReportAnalyticsData;
