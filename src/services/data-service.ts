import { Account, Metric, Goal } from "@/types";
import { createClient } from "@/lib/supabase-server";

export const DataService = {
  getAccounts: async (): Promise<Account[]> => {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      platform: item.platform,
      username: item.username,
      url: item.url,
      status: item.status,
      createdAt: item.created_at,
    }));
  },

  getMetrics: async (accountId: string): Promise<Metric[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .eq('account_id', accountId)
      .order('recorded_at', { ascending: true })
      .limit(30);

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      accountId: item.account_id,
      followers: item.followers,
      views: item.views,
      likes: item.likes,
      comments: item.comments,
      shares: item.shares,
      recordedAt: item.recorded_at,
    }));
  },

  // --- Helper to build common filters ---
  _buildFilters: (query: any, filters: { from?: string, to?: string, platform?: string, accountId?: string }) => {
      if (filters.accountId && filters.accountId !== 'all') {
          query = query.eq('account_id', filters.accountId);
      }
      if (filters.from) {
          query = query.gte('recorded_at', filters.from);
      }
      if (filters.to) {
          query = query.lte('recorded_at', filters.to);
      }
      // Platform filter requires joining with accounts table which is complex in simple queries.
      // Ideally we filter accounts first then use their IDs.
      return query;
  },

  getDashboardStats: async (filters: { from?: string, to?: string, platform?: string, accountId?: string } = {}) => {
    const supabase = await createClient();

    // 1. Filter Accounts based on platform/id
    let accountQuery = supabase.from('accounts').select('id, platform').eq('status', 'active');
    
    if (filters.platform && filters.platform !== 'all') {
        accountQuery = accountQuery.eq('platform', filters.platform);
    }
    if (filters.accountId && filters.accountId !== 'all') {
        accountQuery = accountQuery.eq('id', filters.accountId);
    }

    const { data: accounts } = await accountQuery;
    const activeAccountsCount = accounts?.length || 0;
    
    let totalViews = 0;
    let totalFollowers = 0;
    let totalLikes = 0;
    
    if (accounts && accounts.length > 0) {
       const accountIds = accounts.map(a => a.id);

       for (const acc of accounts) {
         // 1. Get Followers & Total Views/Likes from 'metrics' (latest snapshot)
         // We now prefer the profile-level total views if available (e.g. YouTube channel views),
         // as it's "pulled from everything" rather than just the sum of scraped videos.
         const { data: latestProfileMetric } = await supabase
            .from('metrics')
            .select('followers, views, likes')
            .eq('account_id', acc.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();
            
         if (latestProfileMetric) {
             totalFollowers += latestProfileMetric.followers || 0;
             
             // If we have a meaningful total view count from profile (e.g. > 100), use it.
             // Otherwise fallback to summing video metrics (for platforms that return 0 on profile)
             if (latestProfileMetric.views && latestProfileMetric.views > 0) {
                 totalViews += latestProfileMetric.views;
                 // Assuming likes also come from profile if views did
                 if (latestProfileMetric.likes) totalLikes += latestProfileMetric.likes;
             } else {
                 // Fallback: Sum from video_metrics
                 const { data: videos } = await supabase
                    .from('videos')
                    .select('id')
                    .eq('account_id', acc.id);
                    
                 if (videos && videos.length > 0) {
                     for (const video of videos) {
                         const { data: latestVideoMetric } = await supabase
                            .from('video_metrics')
                            .select('views, likes')
                            .eq('video_id', video.id)
                            .order('recorded_at', { ascending: false })
                            .limit(1)
                            .single();
                         
                         if (latestVideoMetric) {
                             totalViews += latestVideoMetric.views || 0;
                             totalLikes += latestVideoMetric.likes || 0;
                         }
                     }
                 }
             }
         }
       }
    }

    // Engagement rate rough calc: (Likes + Comments) / Followers * 100
    // Simplified: Likes / Views * 100 for this example
    const engagementRate = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(2) : 0;

    // --- Growth Calculation ---
    // If we have history (> 30 days), we use it.
    // If not, we use the OLDEST available record to show growth since tracking started.
    
    // Default: Stable if no comparison point
    let followersGrowth = "0"; 
    let viewsGrowth = "0";

    // Calculate Followers Growth
    if (totalFollowers > 0) {
        // We check if we have ANY old metric.
        // If we have an old metric and it was 0, then growth is infinite (show 100% or absolute gain).
        // If we have NO old metrics (first sync ever), growth is 0% (baseline).
        
        // Let's refine: If we found 'oldMetrics' (tracking started > 0 days ago) and it was 0, it's growth.
        // If we didn't find any old metrics (tracking just started today), growth is 0.
        
        // We need to know if we are comparing against a real previous point.
        // Re-query: Get the VERY FIRST metric ever recorded for these accounts.
        
        const { data: firstMetric } = await supabase
            .from('metrics')
            .select('followers, recorded_at')
            .in('account_id', (accounts || []).map(a => a.id))
            .order('recorded_at', { ascending: true }) // Ascending = Oldest
            .limit(1)
            .single();
            
        if (firstMetric) {
            // If the oldest metric is not from today (e.g. > 24h ago), we can calculate growth since then.
            const firstDate = new Date(firstMetric.recorded_at);
            const today = new Date();
            const diffHours = (today.getTime() - firstDate.getTime()) / (1000 * 60 * 60);
            
            if (diffHours > 24) {
                // We have history! Even if < 30 days.
                const initialFollowers = firstMetric.followers || 0;
                if (initialFollowers > 0) {
                    followersGrowth = (((totalFollowers - initialFollowers) / initialFollowers) * 100).toFixed(1);
                } else {
                    followersGrowth = "100"; // Grew from 0
                }
            }
        }
    }

    // Calculate Views Growth (Similar logic or placeholder if video history is heavy)
    // For MVP, if we have Total Views > 0 and it's not the first sync, we likely grew.
    // Let's apply similar "First vs Current" logic if 30-day history is missing.
    // Simplified: If Total Views > 0, assume positive trend if not fresh.
    // For now, let's leave views growth as 0 unless we implement full video delta history aggregation.
    
    return {
      totalViews,
      totalFollowers,
      totalLikes,
      engagementRate,
      activeAccounts: activeAccountsCount,
      growth: {
          followers: followersGrowth,
          views: viewsGrowth, // Keep 0 for safety until deep aggregation is ready
          engagement: "0" 
      }
    };
  },

  getMonthlyOverview: async (filters: { from?: string, to?: string, platform?: string, accountId?: string } = {}) => {
     const supabase = await createClient();
     
     // 1. Determine Date Range
     const endDate = filters.to ? new Date(filters.to) : new Date();
     const startDate = filters.from ? new Date(filters.from) : new Date();
     if (!filters.from) startDate.setDate(startDate.getDate() - 30); // Default 30 days

     // 2. Filter Accounts
     let accountQuery = supabase.from('accounts').select('id').eq('status', 'active');
     if (filters.platform && filters.platform !== 'all') accountQuery = accountQuery.eq('platform', filters.platform);
     if (filters.accountId && filters.accountId !== 'all') accountQuery = accountQuery.eq('id', filters.accountId);
     const { data: accounts } = await accountQuery;
     const accountIds = accounts?.map(a => a.id) || [];

     if (accountIds.length === 0) return [];

     // 3. Fetch Data for Chart (Daily Buckets)
     // We need: 
     // A) Uploads per day (from 'videos' table)
     // B) Total Views per day (interpolated from 'video_metrics')
     
     // A) Uploads
     const { data: uploads } = await supabase
        .from('videos')
        .select('published_at')
        .in('account_id', accountIds)
        .gte('published_at', startDate.toISOString())
        .lte('published_at', endDate.toISOString());

     // B) Views History (Approximation: Sum of video_metrics recorded on that day)
     // This is tricky without a daily_stats table. We will mock the "Trend" using the available data points.
     
     const chartData: Record<string, { views: number, likes: number, uploads: number }> = {};
     
     // Init empty days
     for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
         const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
         chartData[key] = { views: 0, likes: 0, uploads: 0 };
     }

     // Fill Uploads
     uploads?.forEach((video: any) => {
         const key = video.published_at.split('T')[0];
         if (chartData[key]) chartData[key].uploads++;
     });

     // Fill Views (Real Aggregation)
     const { data: metricsInRange } = await supabase
        .from('video_metrics')
        .select('video_id, views, likes, recorded_at')
        .gte('recorded_at', startDate.toISOString())
        .lte('recorded_at', endDate.toISOString());
        
     if (metricsInRange) {
         metricsInRange.forEach((m: any) => {
             const key = m.recorded_at.split('T')[0];
             if (!chartData[key]) return;
             
             if (!(chartData[key] as any)._videoMap) (chartData[key] as any)._videoMap = new Map();
             
             // Store max view/like count for this video on this day
             const current = (chartData[key] as any)._videoMap.get(m.video_id) || { views: 0, likes: 0 };
             (chartData[key] as any)._videoMap.set(m.video_id, {
                 views: Math.max(current.views, m.views || 0),
                 likes: Math.max(current.likes, m.likes || 0),
             });
         });
         
         // Sum up the max views/likes for all videos on that day
         Object.keys(chartData).forEach(key => {
             if ((chartData[key] as any)._videoMap) {
                 let dayTotalViews = 0;
                 let dayTotalLikes = 0;
                 (chartData[key] as any)._videoMap.forEach((v: { views: number, likes: number }) => {
                     dayTotalViews += v.views;
                     dayTotalLikes += v.likes;
                 });
                 chartData[key].views = dayTotalViews;
                 chartData[key].likes = dayTotalLikes;
             }
         });
     }
     
     return Object.entries(chartData).map(([date, data]) => ({
         name: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
         views: data.views,
         likes: data.likes,
         uploads: data.uploads
     }));
  },

  getTopAccounts: async (limit = 5) => {
      const supabase = await createClient();
      const accounts = (await DataService.getAccounts()).filter(a => a.status === 'active');
      if (accounts.length === 0) return [];

      const accountIds = accounts.map(a => a.id);

      const { data: videos, error: videosError } = await supabase
          .from('videos')
          .select('id, account_id')
          .in('account_id', accountIds);

      if (videosError) throw videosError;

      const videoIds = (videos || []).map(v => v.id);
      const latestViewsByVideoId = new Map<string, number>();

      if (videoIds.length > 0) {
          const { data: metrics, error: metricsError } = await supabase
              .from('video_metrics')
              .select('video_id, views, recorded_at')
              .in('video_id', videoIds)
              .order('recorded_at', { ascending: false });

          if (metricsError) throw metricsError;

          // Since it's sorted desc, first seen per video is the latest
          for (const m of metrics || []) {
              if (!latestViewsByVideoId.has(m.video_id)) {
                  latestViewsByVideoId.set(m.video_id, m.views || 0);
              }
          }
      }

      const viewsByAccountId = new Map<string, number>();
      for (const v of videos || []) {
          const views = latestViewsByVideoId.get(v.id) || 0;
          viewsByAccountId.set(v.account_id, (viewsByAccountId.get(v.account_id) || 0) + views);
      }

      const accountsWithStats = accounts.map(acc => ({
          ...acc,
          views: viewsByAccountId.get(acc.id) || 0
      }));

      return accountsWithStats.sort((a, b) => b.views - a.views).slice(0, limit);
  },

  getViralVideos: async () => {
      const supabase = await createClient();
      
      // Fetch recent videos with high views (simple heuristic: top 5 by views from all time, 
      // ideally would be delta views in last 24h)
      // Since we don't have delta history table easily accessible for all, 
      // we'll fetch top 5 videos by absolute views across all accounts.
      
      const { data: videos, error } = await supabase
        .from('videos')
        .select(`
            *,
            video_metrics (
                views,
                likes,
                recorded_at
            )
        `)
        // We can't order by related table column easily in supabase-js without an RPC or flattened view.
        // So we fetch latest 50 videos and sort in JS for "Recency Viral" or fetch all and sort for "All Time Viral".
        // Let's go with "Recency" strategy: Get videos posted in last 7 days and sort by views.
        .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('published_at', { ascending: false })
        .order('recorded_at', { foreignTable: 'video_metrics', ascending: false })
        .limit(1, { foreignTable: 'video_metrics' })
        .limit(50);
        
      if (error) return [];
      
      // Process and sort
      const processedVideos = videos.map((video: any) => {
          const latestMetric = (video.video_metrics || [])
            .slice()
            .sort((a: any, b: any) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0]
            || { views: 0, likes: 0 };
          return {
              ...video,
              stats: latestMetric
          };
      });
      
      return processedVideos.sort((a, b) => b.stats.views - a.stats.views).slice(0, 5);
  },

  getAccountDetails: async (accountId: string) => {
    const supabase = await createClient();
    
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();
      
    if (accountError) throw accountError;
    
    return {
      id: account.id,
      userId: account.user_id,
      platform: account.platform,
      username: account.username,
      url: account.url,
      status: account.status,
      createdAt: account.created_at,
    };
  },

  getAccountVideos: async (accountId: string) => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        video_metrics (
          views,
          likes,
          comments,
          shares,
          recorded_at
        )
      `)
      .eq('account_id', accountId)
      .order('published_at', { ascending: false })
      .order('recorded_at', { foreignTable: 'video_metrics', ascending: false })
      .limit(1, { foreignTable: 'video_metrics' });

    if (error) throw error;

    // Transform and pick latest metrics
    return data.map((video: any) => {
        // Sort metrics by latest (although we usually insert latest at end, DB order isn't guaranteed without order by)
        // For simplicity, taking the last one or sorting if needed.
        // Assuming video_metrics array might be populated if we did a join.
        // In Supabase join syntax above, it returns an array of metrics.
        const latestMetric = (video.video_metrics || [])
          .slice()
          .sort((a: any, b: any) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0]
          || { views: 0, likes: 0, comments: 0, shares: 0 };
        
        return {
            id: video.id,
            accountId: video.account_id,
            externalId: video.external_id,
            url: video.url,
            thumbnailUrl: video.thumbnail_url,
            description: video.description,
            publishedAt: video.published_at,
            createdAt: video.created_at,
            stats: latestMetric
        };
    });
  },

  getGoals: async (): Promise<(Goal & { account: { username: string, platform: string } })[]> => {
    const supabase = await createClient();

    const { data: goals, error } = await supabase
      .from('goals')
      .select(`
        *,
        account:accounts (
          username,
          platform
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return await Promise.all(goals.map(async (item: any) => {
      let currentValue = item.current_value;

      if (item.account_id) {
        // Fetch real-time stats to update progress
        if (item.metric_type === 'followers') {
             const { data: m } = await supabase
                .from('metrics')
                .select('followers')
                .eq('account_id', item.account_id)
                .order('recorded_at', {ascending:false})
                .limit(1)
                .single();
             if (m) currentValue = m.followers;
        } 
        else if (item.metric_type === 'views' || item.metric_type === 'likes') {
             const { data: videos } = await supabase
                .from('videos')
                .select('id')
                .eq('account_id', item.account_id);
             
             if (videos && videos.length > 0) {
                 let total = 0;
                 // Sum latest metrics for all videos
                 for (const v of videos) {
                     const { data: vm } = await supabase
                        .from('video_metrics')
                        .select('views, likes')
                        .eq('video_id', v.id)
                        .order('recorded_at', {ascending:false})
                        .limit(1)
                        .single();
                     if (vm) {
                         total += (item.metric_type === 'views' ? vm.views : vm.likes);
                     }
                 }
                 currentValue = total;
             }
        }
      }

      return {
        id: item.id,
        accountId: item.account_id,
        metricType: item.metric_type,
        targetValue: item.target_value,
        currentValue: currentValue,
        deadline: item.deadline,
        isAchieved: item.is_achieved,
        account: {
          username: item.account?.username || 'Unknown',
          platform: item.account?.platform || 'other'
        }
      };
    }));
  }
};
