import { ApifyClient } from 'apify-client';
import { supabase } from '@/lib/supabase'; // Assuming you have a server-side capable client or use createClient() inside

// Initializing the client securely
const apifyToken = process.env.APIFY_API_TOKEN;
const client = apifyToken ? new ApifyClient({ token: apifyToken }) : null;

export const ScraperService = {
  /**
   * Fetches latest videos for a TikTok account using Apify
   * Note: This requires a valid API Token from Apify.
   * If no token is present, it returns mock data for demonstration.
   */
  scrapeTikTok: async (username: string) => {
    if (!client) {
      console.warn("⚠️ APIFY_API_TOKEN not found. Returning mock data.");
      return ScraperService.getMockData(username);
    }

    try {
      // Using a popular TikTok Scraper Actor (e.g., 'clockworks/tiktok-scraper')
      // This is an example call structure. Actual actor inputs vary.
      const run = await client.actor("clockworks/tiktok-scraper").call({
        profiles: [username],
        resultsPerPage: 20,
        shouldDownloadCovers: false,
        shouldDownloadSlideshowImages: false,
        shouldDownloadSubtitles: false,
        shouldDownloadVideos: false,
      });

      console.log(`🤖 Scraper Run Started: ${run.id}`);
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      
      return items.map((item: any) => ({
        externalId: item.id,
        description: item.text,
        url: item.webVideoUrl,
        thumbnailUrl: item.videoMeta?.coverUrl,
        publishedAt: new Date(item.createTime * 1000).toISOString(),
        stats: {
          views: item.playCount,
          likes: item.diggCount,
          comments: item.commentCount,
          shares: item.shareCount,
        }
      }));

    } catch (error) {
      console.error("❌ Scraper Error:", error);
      throw new Error("Failed to scrape data from Apify.");
    }
  },

  getMockData: (username: string) => {
    // Return realistic mock data so the user can see the UI working immediately
    return Array.from({ length: 5 }).map((_, i) => ({
      externalId: `mock-video-${i}`,
      description: `Vídeo Viral #${i + 1} de ${username}`,
      url: `https://tiktok.com/@${username}/video/${i}`,
      thumbnailUrl: "https://placehold.co/600x400/101010/FFF?text=Video+Thumbnail",
      publishedAt: new Date(Date.now() - i * 86400000).toISOString(), // 1 day ago, 2 days ago...
      stats: {
        views: 1500 + i * 500,
        likes: 200 + i * 50,
        comments: 10 + i * 5,
        shares: 5 + i,
      }
    }));
  }
};
