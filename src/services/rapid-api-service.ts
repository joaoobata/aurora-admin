import { Account } from "@/types";

const RAPID_API_KEY = process.env.RAPID_API_KEY;

// API Hosts
const IG_HOST = 'instagram-scraper-2022.p.rapidapi.com';
const TT_HOST = 'tiktok-scraper7.p.rapidapi.com';
const YT_HOST = 'youtube-v31.p.rapidapi.com';

const headers = (host: string) => ({
  'X-RapidAPI-Key': RAPID_API_KEY || '',
  'X-RapidAPI-Host': host
});

export const RapidApiService = {
  getInstagramData: async (username: string) => {
    if (!RAPID_API_KEY) throw new Error("RAPID_API_KEY not found");
    
    // 1. Get User Info
    const userUrl = `https://${IG_HOST}/ig/info_username/`;
    const userRes = await fetch(`${userUrl}?user=${username}`, { headers: headers(IG_HOST) });
    const userData = await userRes.json();
    
    const user = userData.user || {};
    
    // 2. Get Posts (Videos/Reels)
    // Note: This API might require id instead of username for posts, but let's check standard flow
    // Usually we need user.pk (id) from the first call
    const userId = user.pk;
    let videos = [];
    
    if (userId) {
        const postsUrl = `https://${IG_HOST}/ig/posts/`;
        const postsRes = await fetch(`${postsUrl}?id_user=${userId}`, { headers: headers(IG_HOST) });
        const postsData = await postsRes.json();
        const items = postsData.items || [];
        
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
            totalViews: 0, // Not provided directly on profile
            totalLikes: 0
        }
    };
  },

  getTikTokData: async (username: string) => {
    if (!RAPID_API_KEY) throw new Error("RAPID_API_KEY not found");

    // 1. Get User Feed (includes stats)
    // Using tiktok-scraper7
    const url = `https://${TT_HOST}/user/posts`;
    const res = await fetch(`${url}?unique_id=${username}&count=10`, { headers: headers(TT_HOST) });
    const data = await res.json();
    
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
            totalViews: 0 // Not standard in profile object
        }
    };
  },

  getYouTubeData: async (username: string) => {
    if (!RAPID_API_KEY) throw new Error("RAPID_API_KEY not found");

    // 1. Search for Channel to get ID (if username is handle)
    // Or assume username is channelId? Usually it's a handle like @mrbeast
    // youtube-v31 supports 'search'
    
    let channelId = username;
    // If it starts with @, we need to search for it
    if (username.startsWith('@') || !username.startsWith('UC')) {
        const searchUrl = `https://${YT_HOST}/search`;
        const searchRes = await fetch(`${searchUrl}?q=${username}&part=snippet&type=channel`, { headers: headers(YT_HOST) });
        const searchData = await searchRes.json();
        channelId = searchData.items?.[0]?.id?.channelId;
    }

    if (!channelId) throw new Error("Channel not found");

    // 2. Get Channel Stats
    const channelUrl = `https://${YT_HOST}/channels`;
    const channelRes = await fetch(`${channelUrl}?part=statistics,snippet&id=${channelId}`, { headers: headers(YT_HOST) });
    const channelData = await channelRes.json();
    const channelStats = channelData.items?.[0]?.statistics || {};
    const snippet = channelData.items?.[0]?.snippet || {};

    // 3. Get Recent Videos
    const videosUrl = `https://${YT_HOST}/search`;
    const videosRes = await fetch(`${videosUrl}?channelId=${channelId}&part=snippet,id&order=date&maxResults=10`, { headers: headers(YT_HOST) });
    const videosData = await videosRes.json();
    
    // 4. Get Video Stats (Search doesn't return view counts usually, need video details)
    const videoIds = videosData.items?.map((v: any) => v.id.videoId).filter(Boolean).join(',');
    let videosWithStats = [];
    
    if (videoIds) {
        const detailsUrl = `https://${YT_HOST}/videos`;
        const detailsRes = await fetch(`${detailsUrl}?part=statistics,snippet&id=${videoIds}`, { headers: headers(YT_HOST) });
        const detailsData = await detailsRes.json();
        
        videosWithStats = detailsData.items?.map((item: any) => ({
            externalId: item.id,
            description: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${item.id}`,
            thumbnailUrl: item.snippet.thumbnails?.high?.url,
            publishedAt: item.snippet.publishedAt,
            stats: {
                views: parseInt(item.statistics.viewCount || '0'),
                likes: parseInt(item.statistics.likeCount || '0'),
                comments: parseInt(item.statistics.commentCount || '0'),
                shares: 0
            }
        }));
    }

    return {
        videos: videosWithStats,
        profileStats: {
            followers: parseInt(channelStats.subscriberCount || '0'),
            following: 0,
            totalViews: parseInt(channelStats.viewCount || '0'),
            totalLikes: 0
        }
    };
  }
};
