import { Account } from "@/types";

const RAPID_API_KEY = process.env.RAPID_API_KEY;

// API Hosts (Updated based on user request)
const IG_HOST = 'instagram-scraper-stable-api.p.rapidapi.com';
const TT_HOST = 'tiktok-scraper7.p.rapidapi.com';
const YT_HOST = 'youtube138.p.rapidapi.com';

const headers = (host: string) => ({
  'X-RapidAPI-Key': RAPID_API_KEY || '',
  'X-RapidAPI-Host': host
});

export const RapidApiService = {
  getInstagramData: async (username: string) => {
    if (!RAPID_API_KEY) throw new Error("RAPID_API_KEY not found");
    
    // 1. Get User Info (Using instagram-scraper-stable-api)
    // Common endpoint: /user/info/v2
    const cleanUsername = username.replace('@', '');
    const userUrl = `https://${IG_HOST}/user/info/v2`;
    const userRes = await fetch(`${userUrl}?username=${cleanUsername}`, { headers: headers(IG_HOST) });
    const userData = await userRes.json();
    
    // Inspect structure (logging for debug)
    console.log(`📸 IG User Data (${cleanUsername}):`, JSON.stringify(userData, null, 2));

    const user = userData.data || userData; // Adjust based on actual response
    const userId = user.id || user.pk;

    // 2. Get Posts
    // Endpoint: /user/posts
    let videos = [];
    if (userId) {
        const postsUrl = `https://${IG_HOST}/user/posts`;
        const postsRes = await fetch(`${postsUrl}?user_id=${userId}&count=12`, { headers: headers(IG_HOST) });
        const postsData = await postsRes.json();
        
        console.log(`📸 IG Posts Data:`, JSON.stringify(postsData, null, 2));

        const items = postsData.data?.items || postsData.items || [];
        
        videos = items.map((item: any) => ({
            externalId: item.id,
            description: item.caption?.text || '',
            url: `https://www.instagram.com/p/${item.code}/`,
            thumbnailUrl: item.image_versions2?.candidates?.[0]?.url,
            publishedAt: new Date(item.taken_at * 1000).toISOString(),
            stats: {
                views: item.view_count || item.play_count || 0,
                likes: item.like_count || 0,
                comments: item.comment_count || 0,
                shares: 0 // Not always available
            }
        }));
    }

    return {
        videos,
        profileStats: {
            followers: user.follower_count || 0,
            following: user.following_count || 0,
            totalViews: 0,
            totalLikes: 0 // Not standard
        }
    };
  },

  getTikTokData: async (username: string) => {
    if (!RAPID_API_KEY) throw new Error("RAPID_API_KEY not found");

    // 1. Get User Feed (Using tiktok-scraper7)
    // Endpoint: /user/posts (verified from playground link provided)
    const url = `https://${TT_HOST}/user/posts`;
    const res = await fetch(`${url}?unique_id=${username}&count=10`, { headers: headers(TT_HOST) });
    const data = await res.json();
    
    console.log(`🎵 TikTok Data (${username}):`, JSON.stringify(data, null, 2));

    const userInfo = data.data?.user || {};
    const posts = data.data?.videos || [];

    const videos = posts.map((item: any) => ({
        externalId: item.video_id,
        description: item.title,
        url: `https://www.tiktok.com/@${username}/video/${item.video_id}`,
        thumbnailUrl: item.cover,
        publishedAt: new Date(item.create_time * 1000).toISOString(),
        stats: {
            views: item.play_count,
            likes: item.digg_count,
            comments: item.comment_count,
            shares: item.share_count
        }
    }));

    return {
        videos,
        profileStats: {
            followers: userInfo.follower_count || 0,
            following: userInfo.following_count || 0,
            totalLikes: userInfo.total_favorited || 0,
            totalViews: 0 // Not in standard profile obj
        }
    };
  },

  getYouTubeData: async (username: string) => {
    if (!RAPID_API_KEY) throw new Error("RAPID_API_KEY not found");

    // Using youtube138
    // 1. Channel Details (to get ID and stats)
    // Endpoint: /channel/details/?id=... (Need to resolve handle first if possible)
    
    // NOTE: youtube138 expects 'id' (UC...) usually. If we only have handle (@user), we need to search.
    // Let's try /channel/search or /search
    
    let channelId = username;
    
    // Simple logic: if starts with @, assume handle.
    if (username.startsWith('@') || !username.startsWith('UC')) {
        const searchUrl = `https://${YT_HOST}/search`;
        // Assuming search returns channel ID
        const searchRes = await fetch(`${searchUrl}?q=${username}&filter=channel`, { headers: headers(YT_HOST) });
        const searchData = await searchRes.json();
        
        console.log(`📺 YT Search Data (${username}):`, JSON.stringify(searchData, null, 2));
        // Map based on typical response 'contents' -> 'channelRenderer'
        const channelItem = searchData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.channelRenderer;
        
        if (channelItem?.channelId) {
            channelId = channelItem.channelId;
        } else {
             // Fallback: try mapping from other fields if structure differs
             // Some APIs return 'data' array
             channelId = searchData.data?.[0]?.channelId || searchData.results?.[0]?.id;
        }
    }

    if (!channelId) throw new Error("YouTube Channel ID not found");

    // 2. Get Channel Videos
    // Endpoint: /channel/videos/
    const videosUrl = `https://${YT_HOST}/channel/videos/`;
    const videosRes = await fetch(`${videosUrl}?id=${channelId}&filter=videos_latest`, { headers: headers(YT_HOST) });
    const videosData = await videosRes.json();
    
    console.log(`📺 YT Videos Data:`, JSON.stringify(videosData, null, 2));

    const contents = videosData.contents || videosData.data || [];
    
    // 3. Map Videos
    // youtube138 structure: contents -> videoRenderer
    const videos = contents.map((item: any) => {
        const v = item.videoRenderer;
        if (!v) return null;
        
        // Parse views "1.2M views" -> 1200000
        const viewText = v.viewCountText?.simpleText || "";
        const views = parseCount(viewText);
        
        return {
            externalId: v.videoId,
            description: v.title?.runs?.[0]?.text || "",
            url: `https://www.youtube.com/watch?v=${v.videoId}`,
            thumbnailUrl: v.thumbnail?.thumbnails?.[0]?.url,
            publishedAt: v.publishedTimeText?.simpleText, // "2 days ago" (Relative) - Hard to convert to Date accurately without more data
            stats: {
                views: views,
                likes: 0, // List view usually doesn't show likes
                comments: 0,
                shares: 0
            }
        };
    }).filter(Boolean);

    // 4. Get Channel Stats (Subscribers)
    // We try to fetch details if we have the channel ID
    // Endpoint: /channel/details/?id=...
    let subscribers = 0;
    let totalViews = 0;
    
    try {
        const detailsUrl = `https://${YT_HOST}/channel/details/`;
        const detailsRes = await fetch(`${detailsUrl}?id=${channelId}`, { headers: headers(YT_HOST) });
        const detailsData = await detailsRes.json();
        
        console.log(`📺 YT Channel Details:`, JSON.stringify(detailsData, null, 2));
        
        // Map based on response (usually 'subscriberCountText')
        const header = detailsData.header?.c4TabbedHeaderRenderer;
        if (header) {
            subscribers = parseCount(header.subscriberCountText?.simpleText);
        }
        
        // Total views often in 'about' tab or metadata, might not be in header.
        // For MVP, if we can't find it easily, we default to 0.
    } catch (e) {
        console.warn("⚠️ Failed to fetch YT channel details", e);
    }
    
    return {
        videos,
        profileStats: {
            followers: subscribers, 
            following: 0,
            totalViews: totalViews,
            totalLikes: 0
        }
    };
  }
};

// Helper
function parseCount(text: string): number {
    if (!text) return 0;
    const clean = text.toUpperCase().replace(/[^0-9.KMB]/g, '');
    let mult = 1;
    if (clean.includes('K')) mult = 1000;
    if (clean.includes('M')) mult = 1000000;
    if (clean.includes('B')) mult = 1000000000;
    return parseFloat(clean) * mult;
}

