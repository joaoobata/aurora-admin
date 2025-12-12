import { RapidApiService } from './rapid-api-service';

export const ScraperService = {
  scrapeTikTok: async (username: string) => {
      // Proxy to RapidApiService (New Implementation)
      console.log(`🔄 Proxying TikTok scrape for ${username} to RapidApiService`);
      return await RapidApiService.getTikTokData(username);
  },

  scrapeInstagram: async (username: string) => {
      // Proxy to RapidApiService (New Implementation)
      console.log(`🔄 Proxying Instagram scrape for ${username} to RapidApiService`);
      return await RapidApiService.getInstagramData(username);
  },

  scrapeYoutube: async (username: string) => {
      // Proxy to RapidApiService (New Implementation)
      console.log(`🔄 Proxying YouTube scrape for ${username} to RapidApiService`);
      return await RapidApiService.getYouTubeData(username);
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
