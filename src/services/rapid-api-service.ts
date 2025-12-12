import { Account } from "@/types";

// Hardcoded fallback key provided by user (Note: Best practice is using ENV vars, but using this as fallback for reliability)
const FALLBACK_KEY = '6d1392d5d9msh4f7b0dd915d1acap1cece3jsnf8a5d8f7ac5b';

// API Hosts (Updated based on user request)
const IG_HOST = 'instagram-scraper-stable-api.p.rapidapi.com';
const TT_HOST = 'tiktok-scraper7.p.rapidapi.com';
const YT_HOST = 'youtube138.p.rapidapi.com';

const getApiKey = () => {
    const key = process.env.RAPID_API_KEY || FALLBACK_KEY;
    if (!key) throw new Error("RAPID_API_KEY not found in env or fallback");
    return key;
}

const headers = (host: string) => ({
  'X-RapidAPI-Key': getApiKey(),
  'X-RapidAPI-Host': host
});

export const RapidApiService = {
  getInstagramData: async (username: string) => {
    const apiKey = getApiKey();
    console.log(`🔑 Using API Key: ${apiKey.substring(0, 5)}...`);
    
    // 1. Get User Info (Using instagram-scraper-stable-api)
    // Common endpoint: /user/info/v2
    const cleanUsername = username.replace('@', '');
    const userUrl = `https://${IG_HOST}/user/info/v2`;
    const userRes = await fetch(`${userUrl}?username=${cleanUsername}`, { headers: headers(IG_HOST) });
    const userData = await userRes.json();
    
    // Inspect structure (logging for debug)
    console.log(`📸 IG User Data (${cleanUsername}):`, JSON.stringify(userData, null, 2));

    const user = userData.data?.user || userData.data || userData; // Adjust based on actual response
    const userId = user.id || user.pk || user.user_id;
    const followerCount = user.followers || user.follower_count || user.edge_followed_by?.count || 0;
    const followingCount = user.following || user.following_count || user.edge_follow?.count || 0;

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
            followers: followerCount,
            following: followingCount,
            totalViews: 0,
            totalLikes: 0 // Not standard
        }
    };
  },

  getTikTokData: async (username: string) => {
    const apiKey = getApiKey();
    console.log(`🔑 Using API Key: ${apiKey.substring(0, 5)}...`);

    // 0. Get User Profile (followers/likes)
    const profileUrl = `https://${TT_HOST}/user/info`;
    const profileRes = await fetch(`${profileUrl}?unique_id=${username}`, { headers: headers(TT_HOST) });
    const profileJson = await profileRes.json();
    console.log(`🎵 TikTok Profile Data (${username}):`, JSON.stringify(profileJson, null, 2));

    const profileUser = profileJson.data?.user || {};
    const profileStats = profileJson.data?.stats || profileUser.stats || {};

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
            followers: profileStats.followerCount || profileUser.follower_count || 0,
            following: profileStats.followingCount || profileUser.following_count || 0,
            totalLikes: profileStats.heartCount || profileStats.totalFavorited || profileUser.total_favorited || 0,
            totalViews: 0 // Not in standard profile obj
        }
    };
  },

  getYouTubeData: async (username: string) => {
    const apiKey = getApiKey();
    console.log(`🔑 Using API Key: ${apiKey.substring(0, 5)}...`);

    // youtube138 expects a channel ID (UC...), while the UI may send handles or vanity names.
    // Strategy: try direct channel/details with the handle, then fall back to search.
    const normalizedHandle = username.startsWith('@') ? username : `@${username}`;
    let channelId = username.startsWith('UC') ? username : '';
    let channelDetails: any = null;

    const fetchChannelDetails = async (id: string) => {
        const detailsUrl = `https://${YT_HOST}/channel/details/`;
        const detailsRes = await fetch(`${detailsUrl}?id=${encodeURIComponent(id)}`, { headers: headers(YT_HOST) });
        const detailsData = await detailsRes.json();
        console.log(`📺 YT Channel Details (${id}):`, JSON.stringify(detailsData, null, 2));
        return detailsData.channelId ? detailsData : null;
    };

    if (!channelId) {
        channelDetails = await fetchChannelDetails(normalizedHandle) || await fetchChannelDetails(username);
        channelId = channelDetails?.channelId || '';
    }

    if (!channelId) {
        const searchUrl = `https://${YT_HOST}/search`;
        const searchRes = await fetch(`${searchUrl}?q=${encodeURIComponent(username.replace('@', ''))}&filter=channel`, { headers: headers(YT_HOST) });
        const searchData = await searchRes.json();
        
        console.log(`📺 YT Search Data (${username}):`, JSON.stringify(searchData, null, 2));

        // Newer youtube138 responses return an array of contents with type === "channel"
        const contents = searchData.contents || [];
        const channelItem = contents.find((item: any) => item.type === 'channel' && item.channel?.channelId)
            || contents.find((item: any) => item.channelRenderer?.channelId);

        channelId = channelItem?.channel?.channelId 
            || channelItem?.channelRenderer?.channelId
            || searchData.data?.[0]?.channelId 
            || searchData.results?.[0]?.id;
    }

    if (!channelId) throw new Error("YouTube Channel ID not found");

    // 2. Get Channel Videos
    // Endpoint: /channel/videos/
    const videosUrl = `https://${YT_HOST}/channel/videos/`;
    const videosRes = await fetch(`${videosUrl}?id=${encodeURIComponent(channelId)}&filter=videos_latest`, { headers: headers(YT_HOST) });
    const videosData = await videosRes.json();
    
    console.log(`📺 YT Videos Data:`, JSON.stringify(videosData, null, 2));

    const contents = videosData.contents || videosData.data || [];
    
    // 3. Map Videos
    // youtube138 structure: contents -> { type: "video", video: {...} }
    const videos = contents.map((item: any) => {
        const v = item.video || item.videoRenderer || item;
        const videoId = v.videoId || v.id;
        if (!videoId) return null;

        // youtube138 returns views in several shapes: stats.views (number/string), stats.viewCount, viewCountText/simpleText, shortViewCountText, etc.
        const viewCount =
            (typeof v.stats?.views === 'number' && v.stats.views) ||
            parseCount(v.stats?.views) ||
            parseCount(v.stats?.viewCount) ||
            parseCount(v.stats?.viewCount?.text) ||
            parseCount(v.stats?.viewCountText?.simpleText) ||
            parseCount(v.stats?.shortViewCountText?.simpleText) ||
            parseCount(v.viewCountText?.simpleText) ||
            parseCount(v.shortViewCountText?.simpleText);
        return {
            externalId: videoId,
            description: typeof v.title === 'string' ? v.title : v.title?.runs?.[0]?.text || "",
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnailUrl: v.thumbnails?.[0]?.url || v.thumbnail?.thumbnails?.[0]?.url,
            publishedAt: v.publishedTimeText?.simpleText || v.publishedTimeText, // Relative text
            stats: {
                views: viewCount,
                likes: 0, // List view usually doesn't show likes
                comments: 0,
                shares: 0
            }
        };
    }).filter(Boolean);

    // Fallback: shorts responses often omit view stats; fetch details for any video with 0 views to populate stats.
    const videosNeedingDetails = videos.filter((v: any) => !v.stats?.views || v.stats.views === 0);
    if (videosNeedingDetails.length > 0) {
        await Promise.all(videosNeedingDetails.map(async (vid: any) => {
            try {
                const detailRes = await fetch(`https://${YT_HOST}/video/details/?id=${encodeURIComponent(vid.externalId)}`, { headers: headers(YT_HOST) });
                const detailJson = await detailRes.json();
                const detailViews = 
                    parseCount(detailJson.stats?.views) ||
                    parseCount(detailJson.stats?.viewCount) ||
                    parseCount(detailJson.stats?.shortViewCountText?.simpleText);
                const detailLikes = parseCount(detailJson.stats?.likes);
                if (detailViews) vid.stats.views = detailViews;
                if (detailLikes) vid.stats.likes = detailLikes;
                if (!vid.thumbnailUrl && detailJson.thumbnails?.length) {
                    vid.thumbnailUrl = detailJson.thumbnails[0].url;
                }
                if (!vid.publishedAt && detailJson.publishedDate) {
                    vid.publishedAt = detailJson.publishedDate;
                }
            } catch (err) {
                console.warn(`⚠️ Failed to fetch details for video ${vid.externalId}`, err);
            }
        }));
    }

    // 4. Get Channel Stats (Subscribers)
    // We try to fetch details if we have the channel ID
    // Endpoint: /channel/details/?id=...
    let subscribers = 0;
    let totalViews = 0;
    
    try {
        const detailsData = channelDetails || await fetchChannelDetails(channelId);
        
        if (detailsData) {
            // Newer response places subscribers/views under stats
            subscribers = parseCount(detailsData.stats?.subscribers || detailsData.header?.c4TabbedHeaderRenderer?.subscriberCountText?.simpleText);
            totalViews = parseCount(detailsData.stats?.views);
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
function parseCount(text: string | number): number {
    if (text === null || text === undefined) return 0;
    if (typeof text === 'number') return text;
    const clean = text.toUpperCase().replace(/[^0-9.KMB]/g, '');
    let mult = 1;
    if (clean.includes('K')) mult = 1000;
    if (clean.includes('M')) mult = 1000000;
    if (clean.includes('B')) mult = 1000000000;
    const base = parseFloat(clean);
    return isNaN(base) ? 0 : base * mult;
}
