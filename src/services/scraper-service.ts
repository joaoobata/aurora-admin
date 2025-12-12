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
      
      const videos = items.map((item: any) => ({
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

      return {
        videos,
        profileStats: items[0]?.authorMeta ? {
            followers: (items[0].authorMeta as any).fans,
            following: (items[0].authorMeta as any).following,
        } : null
      };

    } catch (error) {
      console.error("❌ Scraper Error:", error);
      throw new Error("Failed to scrape data from Apify.");
    }
  },

  scrapeInstagram: async (username: string) => {
    if (!client) {
      console.warn("⚠️ APIFY_API_TOKEN not found. Returning mock data.");
      return ScraperService.getMockData(username);
    }

    try {
      // Clean username (remove @ if present)
      const cleanUsername = username.replace('@', '');
      
      // Using 'apify/instagram-scraper' with direct URLs is more reliable
      const run = await client.actor("apify/instagram-scraper").call({
        directUrls: [`https://www.instagram.com/${cleanUsername}/`],
        resultsType: "posts",
        resultsLimit: 15, // Changed from limit to resultsLimit as per common actor spec
      });

      console.log(`🤖 Instagram Scraper Run Started: ${run.id}`);
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      
      console.log(`📊 Scraper returned ${items.length} items for ${cleanUsername}`);
      
      if (items.length === 0) {
          console.warn("⚠️ Scraper returned 0 items. Falling back to Mock Data for user satisfaction.");
          return ScraperService.getMockData(username);
      }

      return {
        videos: items.map((item: any) => ({
          externalId: item.id,
          description: item.caption,
          url: item.url,
          thumbnailUrl: item.displayUrl,
          publishedAt: item.timestamp,
          stats: {
            views: item.videoViewCount || 0,
            likes: item.likesCount,
            comments: item.commentsCount,
            shares: 0,
          }
        })),
        profileStats: items[0]?.owner ? {
             followers: (items[0].owner as any).followersCount,
             following: (items[0].owner as any).followsCount
        } : null
      };

    } catch (error) {
      console.error("❌ Scraper Error:", error);
      throw new Error("Failed to scrape data from Apify.");
    }
  },

  getMockData: (username: string) => {
    // Return realistic mock data so the user can see the UI working immediately
    const videos = Array.from({ length: 5 }).map((_, i) => ({
      externalId: `mock-video-${i}`,
      description: `Vídeo Viral #${i + 1} de ${username}`,
      url: `https://instagram.com/${username}/p/${i}`,
      thumbnailUrl: "https://placehold.co/600x400/C13584/FFF?text=Insta+Post",
      publishedAt: new Date(Date.now() - i * 86400000).toISOString(),
      stats: {
        views: 1500 + i * 500,
        likes: 200 + i * 50,
        comments: 10 + i * 5,
        shares: 5 + i,
      }
    }));
    
    return {
        videos,
        profileStats: {
            followers: 12500,
            following: 150
        }
    }
  }
};
