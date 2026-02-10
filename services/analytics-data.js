


const fetchAnalyticsData = async () => {
  try {
    const response = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&daily=rain_sum,precipitation_sum,apparent_temperature_max&timezone=Asia%2FSingapore&start_date=2025-06-23&end_date=2025-07-20"
    );
    const data = await response.json();
    return data;
  } catch (error) {
  } 
};


export default fetchAnalyticsData;