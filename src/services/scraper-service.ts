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
      console.warn("⚠️ APIFY_API_TOKEN not found.");
      throw new Error("Apify Token not found");
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
            totalLikes: (items[0].authorMeta as any).heart || 0,
            totalViews: 0 // TikTok doesn't easily show total views on profile
        } : null
      };

    } catch (error) {
      console.error("❌ Scraper Error:", error);
      throw new Error("Failed to scrape data from Apify.");
    }
  },

  scrapeInstagram: async (username: string) => {
    if (!client) {
      console.warn("⚠️ APIFY_API_TOKEN not found.");
      throw new Error("Apify Token not found");
    }

    try {
      // Clean username (remove @ if present)
      const cleanUsername = username.replace('@', '');
      const profileUrl = `https://www.instagram.com/${cleanUsername}/`;
      
      console.log(`🚀 Starting Hybrid Instagram Scrape for ${cleanUsername}...`);

      // Parallel execution: Get Posts AND Profile Details
      const [postsRun, detailsRun] = await Promise.all([
          // 1. Get Posts
          client.actor("apify/instagram-scraper").call({
            directUrls: [profileUrl],
            resultsType: "posts",
            resultsLimit: 15,
          }),
          // 2. Get Profile Details (specifically for followers count)
          client.actor("apify/instagram-scraper").call({
            directUrls: [profileUrl],
            resultsType: "details",
            resultsLimit: 1, 
          })
      ]);

      console.log(`🤖 Scraper Runs Started. Posts: ${postsRun.id}, Details: ${detailsRun.id}`);

      // Fetch results
      const [postsDataset, detailsDataset] = await Promise.all([
          client.dataset(postsRun.defaultDatasetId).listItems(),
          client.dataset(detailsRun.defaultDatasetId).listItems()
      ]);
      
      const postsItems = postsDataset.items;
      const detailsItems = detailsDataset.items;
      
      console.log(`📊 Scraper returned ${postsItems.length} posts and ${detailsItems.length} profile details.`);
      
      if (postsItems.length === 0 && detailsItems.length === 0) {
          console.warn("⚠️ Scraper returned 0 items for both calls.");
          return { videos: [], profileStats: null }; // Return empty but REAL
      }

      // Map Posts
      const videos = postsItems.map((item: any) => ({
          externalId: item.id,
          description: item.caption,
          url: item.url,
          thumbnailUrl: item.displayUrl,
          publishedAt: item.timestamp,
          stats: {
            views: item.videoPlayCount || item.videoViewCount || item.viewCount || 0,
            likes: item.likesCount,
            comments: item.commentsCount,
            shares: 0,
          }
      }));

      // Extract Profile Stats from Details run (preferred) or fallback to Posts run owner object
      let profileStats = null;
      
      if (detailsItems.length > 0) {
          const profile = detailsItems[0] as any;
          console.log("🔍 Found Profile Details:", JSON.stringify(profile, null, 2)); // Debug log
          profileStats = {
              followers: profile.followersCount || 0,
              following: profile.followsCount || 0,
              totalViews: 0,
              totalLikes: 0 // Instagram doesn't show total likes
          };
      } else if (postsItems.length > 0 && (postsItems[0] as any).owner) {
          // Fallback to owner object in posts if details failed
          const owner = (postsItems[0] as any).owner;
          profileStats = {
              followers: owner.followersCount || 0,
              following: owner.followsCount || 0,
              totalViews: 0,
              totalLikes: 0
          };
      }

      return {
        videos,
        profileStats
      };

    } catch (error) {
      console.error("❌ Scraper Error:", error);
      throw new Error("Failed to scrape data from Apify.");
    }
  },

  scrapeYoutube: async (username: string) => {
    if (!client) {
      console.warn("⚠️ APIFY_API_TOKEN not found.");
      throw new Error("Apify Token not found");
    }

    try {
      // Using 'apify/youtube-scraper' (Official)
      // Supports startUrls for channels
      const channelUrl = username.startsWith('http') ? username : `https://www.youtube.com/@${username.replace('@', '')}`;
      
      console.log(`🚀 Starting YouTube Scrape (Official Actor) for ${channelUrl}...`);

      const run = await client.actor("apify/youtube-scraper").call({
        startUrls: [{ url: channelUrl }],
        maxResults: 20,
        downloadSubtitles: false,
        downloadClosedCaptions: false,
      });

      console.log(`🤖 YouTube Scraper Run Started: ${run.id}`);
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      
      console.log(`📊 Scraper returned ${items.length} items for ${username}`);

      if (items.length === 0) {
          console.warn("⚠️ Scraper returned 0 items.");
          return { videos: [], profileStats: null }; 
      }

      // Log structure for debugging
      console.log("🔍 [DEBUG] First Item Structure (apify/youtube-scraper):", JSON.stringify(items[0], null, 2));

      // Map YouTube Data (apify/youtube-scraper format)
      // It typically returns video items. Channel stats might be inside each item.
      const videos = items.map((item: any) => ({
          externalId: item.id,
          description: item.title,
          url: item.url,
          thumbnailUrl: item.thumbnailUrl,
          publishedAt: item.date, 
          stats: {
            views: item.viewCount || 0,
            likes: item.likes || 0,
            comments: item.numberOfComments || 0,
            shares: 0,
          }
      }));

      // Extract Profile Stats
      // The official scraper usually puts channel info in `channelName`, `numberOfSubscribers`, etc.
      // Sometimes it's flat, sometimes nested.
      // Based on common output:
      // item.channelName, item.channelUrl, item.numberOfSubscribers
      
      const firstItem = items[0];
      const subscribers = firstItem.numberOfSubscribers || 0;
      
      return {
        videos,
        profileStats: {
            followers: subscribers || 0,
            following: 0,
            totalViews: 0, // Official scraper often doesn't give total channel views in video list
            totalLikes: 0 
        }
      };

    } catch (error) {
      console.error("❌ YouTube Scraper Error:", error);
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
            following: 150,
            totalViews: 0,
            totalLikes: 0
        }
    }
  }
};
