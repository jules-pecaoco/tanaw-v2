import { useQuery } from "@tanstack/react-query";
import { fetchUserReports } from "../services/reports-data";

/**
 * Custom hook to fetch and manage user-submitted hazard reports.
 *
 * It uses React Query to handle caching, background refetching, and state management.
 * The data is considered "stale" after 5 minutes, prompting a background refetch
 * on the next component mount to keep the map relatively up-to-date.
 */
const useUserReportsData = () => {
  const {
    data: userReports,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["userReports"],
    queryFn: fetchUserReports,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });

  return {
    userReports: userReports || [], // Return an empty array if data is undefined
    isLoading,
    isError,
    error,
    refetch,
  };
};

export default useUserReportsData;
