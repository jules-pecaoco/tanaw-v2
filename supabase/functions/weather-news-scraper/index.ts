import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Interfaces for type safety
interface SourceInfo {
  name: string;
  type: string;
  url: string;
  credibility: string;
  last_build_date?: string;
  acronym?: string;
  organization?: string;
  error?: string;
}

interface WeatherItem {
  id: string;
  title: string;
  description: string;
  summary: string;
  image_url?: string;
  link?: string;
  published_date?: string;
  severity: string;
  locations: string[];
  content_type: string;
  language: string;
}

interface ForecastCondition {
  id: string;
  location: string;
  weather_condition: string;
  cause?: string;
  potential_impacts?: string;
  severity: string;
  affected_areas: string[];
  recommendations: string[];
  timestamp: string;
}

interface AdvisoryStatus {
  has_active_advisory: boolean;
  status: string;
  last_checked: string;
}

interface UnifiedWeatherData {
  metadata: {
    api_version: string;
    generated_at: string;
    data_sources: string[];
    coverage: string;
    language: string;
  };
  location: {
    country: string;
    country_code: string;
    timezone: string;
    region: string;
  };
  weather_summary: {
    total_items: number;
    active_advisories: number;
    severity_distribution: Record<string, number>;
    last_updated: string;
  };
  sources: {
    gma_network: SourceInfo;
    pagasa: SourceInfo;
  };
  advisory_status: AdvisoryStatus;
  news_articles: WeatherItem[];
  official_forecasts: ForecastCondition[];
  data_quality: {
    gma_status: string;
    pagasa_status: string;
    overall_quality: string;
  };
}

class WeatherScraper {
  private readonly gmaRssUrl = "https://data.gmanetwork.com/gno/rss/scitech/weather/feed.xml";
  private readonly pagasaBaseUrl = "https://www.pagasa.dost.gov.ph";
  private readonly requestTimeout = 10000;
  private readonly cacheMinutes = 30;
  private supabase: any;

  constructor() {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Efficient XML parsing functions from the first file
  private extractXMLValue(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
    const match = xml.match(regex);
    return match ? match[1].trim() : "";
  }

  private extractAllItems(xml: string): string[] {
    const items: string[] = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      items.push(match[1]);
    }

    return items;
  }

  private cleanCDATA(text: string): string {
    return text.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim();
  }

  private extractImageUrl(description: string): string {
    if (!description) return "";
    const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
    const match = description.match(imgPattern);
    return match ? match[1] : "";
  }

  private cleanDescription(description: string): string {
    if (!description) return "";
    return description
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private parseDate(dateString: string): string {
    if (!dateString) return "";
    try {
      return new Date(dateString).toISOString();
    } catch {
      return dateString;
    }
  }

  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  private cleanText(text: string): string {
    if (!text) return "";
    return text.replace(/\s+/g, " ").trim();
  }

  private generateItemId(source: string, title: string, pubDate?: string): string {
    const baseString = `${source}_${title}_${pubDate || Date.now()}`;
    return Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private determineSeverity(content: string): string {
    if (!content) return "low";

    const contentLower = content.toLowerCase();

    const highKeywords = ["severe", "heavy rains", "typhoon", "storm", "landslide", "flash flood", "emergency", "warning"];
    if (highKeywords.some((keyword) => contentLower.includes(keyword))) {
      return "high";
    }

    const mediumKeywords = ["moderate", "thunderstorm", "gusty", "rough seas", "advisory", "cloudy", "showers"];
    if (mediumKeywords.some((keyword) => contentLower.includes(keyword))) {
      return "medium";
    }

    return "low";
  }

  private extractLocationKeywords(text: string): string[] {
    if (!text) return [];

    const locationPatterns = [
      /\b(?:Metro Manila|NCR|Luzon|Visayas|Mindanao)\b/gi,
      /\b(?:Manila|Quezon|Cebu|Davao|Iloilo|Bacolod|Cagayan|Baguio|Palawan|Zamboanga)\b/gi,
      /\b(?:Northern|Southern|Eastern|Western|Central)\s+\w+\b/gi,
    ];

    const locations: string[] = [];
    locationPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        locations.push(...matches.map((match) => match.trim()));
      }
    });

    return [...new Set(locations.filter((loc) => loc.length > 2))];
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Weather-Bot/1.0)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private generateSummary(description: string, maxLength = 150): string {
    if (!description || description.length <= maxLength) return description;
    const truncated = description.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + "..." : truncated + "...";
  }

  private parseAffectedAreas(placeText: string): string[] {
    if (!placeText) return [];
    const separators = [",", " and ", " & ", ";"];
    let areas = [placeText];

    separators.forEach((sep) => {
      const newAreas: string[] = [];
      areas.forEach((area) => {
        newAreas.push(...area.split(sep).map((a) => a.trim()));
      });
      areas = newAreas;
    });

    return areas.filter((area) => area && area.length > 2);
  }

  private generateRecommendations(impacts: string): string[] {
    if (!impacts) return ["Monitor weather updates"];

    const recommendations = ["Monitor weather updates"];
    const impactsLower = impacts.toLowerCase();

    if (impactsLower.includes("flood")) {
      recommendations.push("Avoid low-lying areas");
    }
    if (impactsLower.includes("landslide")) {
      recommendations.push("Stay away from slopes");
    }
    if (impactsLower.includes("heavy") || impactsLower.includes("severe")) {
      recommendations.push("Prepare emergency supplies");
    }
    if (impactsLower.includes("sea") || impactsLower.includes("marine")) {
      recommendations.push("Avoid sea travel");
    }

    return [...new Set(recommendations)];
  }

  // Optimized GMA scraping using efficient XML parsing from first file
  async scrapeGmaWeather(): Promise<{ source_info: SourceInfo; items: WeatherItem[] }> {
    try {
      const response = await this.fetchWithTimeout(this.gmaRssUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rssContent = await response.text();

      // Extract channel info using efficient regex parsing
      const channelInfo = {
        title: this.cleanCDATA(this.extractXMLValue(rssContent, "title")),
        description: this.cleanCDATA(this.extractXMLValue(rssContent, "description")),
        link: this.extractXMLValue(rssContent, "link"),
        last_build_date: this.parseDate(this.extractXMLValue(rssContent, "lastBuildDate")),
        pub_date: this.parseDate(this.extractXMLValue(rssContent, "pubDate")),
      };

      const sourceInfo: SourceInfo = {
        name: channelInfo.title || "GMA Network Weather",
        type: "rss_feed",
        url: this.gmaRssUrl,
        credibility: "media_outlet",
        last_build_date: channelInfo.last_build_date,
      };

      // Extract all items using efficient regex parsing
      const itemsXML = this.extractAllItems(rssContent);

      const items: WeatherItem[] = [];

      // Process items (limit to 20 for better performance)
      const limitedItems = itemsXML.slice(0, 20);

      for (let i = 0; i < limitedItems.length; i++) {
        const itemXML = limitedItems[i];

        try {
          // Extract data using efficient XML parsing
          const title = this.cleanCDATA(this.extractXMLValue(itemXML, "title"));
          const rawDescription = this.cleanCDATA(this.extractXMLValue(itemXML, "description"));
          const link = this.extractXMLValue(itemXML, "link");
          const pubDate = this.extractXMLValue(itemXML, "pubDate");
          const guid = this.extractXMLValue(itemXML, "guid");
          const category = this.cleanCDATA(this.extractXMLValue(itemXML, "category"));
          const author = this.cleanCDATA(this.extractXMLValue(itemXML, "author"));

          if (!title.trim()) {
            continue;
          }

          // Process description and extract metadata
          const cleanedDescription = this.cleanDescription(rawDescription);
          const imageUrl = this.extractImageUrl(rawDescription);
          const summary = this.generateSummary(cleanedDescription || title);
          const locations = this.extractLocationKeywords(title + " " + cleanedDescription);
          const severity = this.determineSeverity(title + " " + cleanedDescription);
          const parsedPubDate = this.parseDate(pubDate);

          const weatherItem: WeatherItem = {
            id: this.generateItemId("gma", title, parsedPubDate || guid),
            title: title.trim(),
            description: cleanedDescription || "No description available",
            summary: summary || title,
            image_url: imageUrl,
            link: link.trim(),
            published_date: parsedPubDate,
            severity,
            locations,
            content_type: "news_article",
            language: "en",
          };

          items.push(weatherItem);
        } catch (itemError) {
          continue;
        }
      }


      return { source_info: sourceInfo, items };
    } catch (error) {
      console.error("GMA RSS scraping error:", error);

      return {
        source_info: {
          name: "GMA Network",
          type: "rss_feed",
          url: this.gmaRssUrl,
          credibility: "media_outlet",
          error: error instanceof Error ? error.message : String(error),
        },
        items: [],
      };
    }
  }

  async scrapePagasaWeather(): Promise<{
    source_info: SourceInfo;
    advisory_status: AdvisoryStatus;
    forecast_conditions: ForecastCondition[];
  }> {
    try {
      const url = `${this.pagasaBaseUrl}/weather`;
      const response = await this.fetchWithTimeout(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");

      if (!doc) throw new Error("Failed to parse HTML");

      const currentTime = this.getCurrentTimestamp();

      const sourceInfo: SourceInfo = {
        name: "Philippine Atmospheric, Geophysical and Astronomical Services Administration",
        acronym: "PAGASA",
        type: "government_agency",
        url: this.pagasaBaseUrl,
        credibility: "official",
        organization: "Department of Science and Technology",
      };

      // Check for weather advisory
      const advisoryStatus = await this.checkWeatherAdvisory();
      const forecastConditions: ForecastCondition[] = [];

      // Extract forecast data from tables - optimized for performance
      const tables = doc.querySelectorAll("table");
      let processedCount = 0;
      const maxConditions = 10; // Limit for performance

      for (const table of Array.from(tables)) {
        if (processedCount >= maxConditions) break;

        const headerRow = table.querySelector("tr");
        if (!headerRow) continue;

        const headers = Array.from(headerRow.querySelectorAll("th, td")).map((th) => this.cleanText(th.textContent || ""));
        const headersText = headers.join(" ").toLowerCase();

        // Look for weather condition tables
        if (headersText.includes("weather condition") || headersText.includes("caused by") || headersText.includes("place")) {
          const rows = Array.from(table.querySelectorAll("tr")).slice(1, 8); // Limit rows

          for (const row of rows) {
            if (processedCount >= maxConditions) break;

            const cells = Array.from(row.querySelectorAll("td, th")).map((td) => this.cleanText(td.textContent || ""));

            if (cells.length >= 2) {
              const place = cells[0] || "";
              const condition = cells[1] || "";
              const causedBy = cells[2] || "";
              const impacts = cells[3] || "";

              if (place && condition && place.length > 2) {
                const forecastItem: ForecastCondition = {
                  id: this.generateItemId("pagasa", `${place}_${condition}`, currentTime),
                  location: place,
                  weather_condition: condition,
                  cause: causedBy,
                  potential_impacts: impacts,
                  severity: this.determineSeverity(`${condition} ${impacts}`),
                  affected_areas: this.parseAffectedAreas(place),
                  recommendations: this.generateRecommendations(impacts),
                  timestamp: currentTime,
                };

                forecastConditions.push(forecastItem);
                processedCount++;
              }
            }
          }
        }
      }


      return {
        source_info: sourceInfo,
        advisory_status: advisoryStatus,
        forecast_conditions: forecastConditions,
      };
    } catch (error) {
      console.error("PAGASA scraping error:", error);
      return {
        source_info: {
          name: "PAGASA",
          type: "government_agency",
          url: this.pagasaBaseUrl,
          credibility: "official",
          error: error instanceof Error ? error.message : String(error),
        },
        advisory_status: {
          has_active_advisory: false,
          status: `Error: ${error instanceof Error ? error.message : String(error)}`,
          last_checked: this.getCurrentTimestamp(),
        },
        forecast_conditions: [],
      };
    }
  }

  private async checkWeatherAdvisory(): Promise<AdvisoryStatus> {
    try {
      const url = `${this.pagasaBaseUrl}/weather/weather-advisory`;
      const response = await this.fetchWithTimeout(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const htmlText = await response.text();
      const pageText = this.cleanText(htmlText);

      const noAdvisoryPatterns = [/no.*weather.*advisory.*issued/i, /no.*advisory.*issued/i, /no.*active.*advisory/i, /no.*current.*advisory/i];

      const activeAdvisoryPatterns = [/weather.*advisory.*issued/i, /active.*advisory/i, /current.*advisory/i];

      const hasNoAdvisory = noAdvisoryPatterns.some((pattern) => pattern.test(pageText));
      const hasActiveAdvisory = activeAdvisoryPatterns.some((pattern) => pattern.test(pageText));

      return {
        has_active_advisory: hasActiveAdvisory && !hasNoAdvisory,
        status: hasNoAdvisory ? "No active advisory" : hasActiveAdvisory ? "Active advisory detected" : "Status unclear",
        last_checked: this.getCurrentTimestamp(),
      };
    } catch (error) {
      return {
        has_active_advisory: false,
        status: `Error checking advisory: ${error instanceof Error ? error.message : String(error)}`,
        last_checked: this.getCurrentTimestamp(),
      };
    }
  }

  private calculateSeverityDistribution(gmaItems: WeatherItem[], pagasaItems: ForecastCondition[]): Record<string, number> {
    const severityCount = { high: 0, medium: 0, low: 0 };

    [...gmaItems, ...pagasaItems].forEach((item) => {
      const severity = item.severity || "low";
      if (severity in severityCount) {
        severityCount[severity as keyof typeof severityCount]++;
      }
    });

    return severityCount;
  }

  private assessDataQuality(gmaItems: WeatherItem[], pagasaItems: ForecastCondition[]): string {
    const gmaCount = gmaItems.length;
    const pagasaCount = pagasaItems.length;

    if (gmaCount >= 5 && pagasaCount >= 3) return "excellent";
    if (gmaCount >= 3 && pagasaCount >= 1) return "good";
    if (gmaCount > 0 || pagasaCount > 0) return "fair";
    return "limited";
  }

  async combineWeatherData(): Promise<UnifiedWeatherData> {
    const currentTime = this.getCurrentTimestamp();

    // Fetch data from both sources concurrently for better performance
    const [gmaData, pagasaData] = await Promise.all([this.scrapeGmaWeather(), this.scrapePagasaWeather()]);

    const totalItems = gmaData.items.length + pagasaData.forecast_conditions.length;
    const severityDistribution = this.calculateSeverityDistribution(gmaData.items, pagasaData.forecast_conditions);
    const overallQuality = this.assessDataQuality(gmaData.items, pagasaData.forecast_conditions);

    const weatherData: UnifiedWeatherData = {
      metadata: {
        api_version: "3.1",
        generated_at: currentTime,
        data_sources: ["GMA Network", "PAGASA"],
        coverage: "Philippines",
        language: "en",
      },
      location: {
        country: "Philippines",
        country_code: "PH",
        timezone: "Asia/Manila",
        region: "Southeast Asia",
      },
      weather_summary: {
        total_items: totalItems,
        active_advisories: pagasaData.advisory_status.has_active_advisory ? 1 : 0,
        severity_distribution: severityDistribution,
        last_updated: currentTime,
      },
      sources: {
        gma_network: gmaData.source_info,
        pagasa: pagasaData.source_info,
      },
      advisory_status: pagasaData.advisory_status,
      news_articles: gmaData.items,
      official_forecasts: pagasaData.forecast_conditions,
      data_quality: {
        gma_status: gmaData.items.length > 0 ? "success" : "limited",
        pagasa_status: pagasaData.forecast_conditions.length > 0 ? "success" : "limited",
        overall_quality: overallQuality,
      },
    };

    return weatherData;
  }
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const CACHE_TTL_MINUTES = 30; // How long the cache is valid
    const CACHE_KEY = "latest_ph_weather"; // The static primary key for our cache row

    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const { data: cachedData, error: cacheError } = await supabaseClient
      .from("weather_news_cache")
      .select("data, cached_at")
      .eq("id", CACHE_KEY)
      .single();

    if (cachedData && !cacheError) {
      const cacheAgeMinutes = (new Date().getTime() - new Date(cachedData.cached_at).getTime()) / 1000 / 60;

      if (cacheAgeMinutes < CACHE_TTL_MINUTES) {
        return new Response(JSON.stringify(cachedData.data), { headers: corsHeaders });
      }
    }

    const scraper = new WeatherScraper();
    const freshWeatherData = await scraper.combineWeatherData();

    const { error: upsertError } = await supabaseClient.from("weather_news_cache").upsert({
      id: CACHE_KEY,
      data: freshWeatherData,
      cached_at: new Date().toISOString(),
    });

    if (upsertError) {
      console.error("Failed to update cache:", upsertError.message);
    }

    return new Response(JSON.stringify(freshWeatherData), { headers: corsHeaders });
  } catch (error) {
    console.error("Main function error:", error.message);
    return new Response(JSON.stringify({ error: "Failed to fetch weather data", message: error.message }), { status: 500, headers: corsHeaders });
  }
});
