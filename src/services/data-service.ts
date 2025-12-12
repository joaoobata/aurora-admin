import { Account, Metric } from "@/types";
import { supabase } from "@/lib/supabase";

export const DataService = {
  getAccounts: async (): Promise<Account[]> => {
    if (!supabase) throw new Error("Supabase client not initialized");
    
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
    if (!supabase) throw new Error("Supabase client not initialized");

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

  getDashboardStats: async () => {
    if (!supabase) throw new Error("Supabase client not initialized");

    // Get active accounts count
    const { count: activeAccounts } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // For total views/followers, we'd ideally sum the *latest* metric for each account
    // This is a simplified approach summing everything found in metrics (which might be cumulative or not depending on recording strategy)
    // Assuming metrics are snapshots, we should get the latest one per account.
    // For MVP, let's just sum all 'views' if they are incremental, or latest if cumulative.
    // Let's assume 'views' in metrics is a snapshot of total views at that time.
    
    // Fetch latest metrics for all accounts
    const { data: accounts } = await supabase.from('accounts').select('id');
    
    let totalViews = 0;
    let totalFollowers = 0;
    let totalLikes = 0;
    
    if (accounts && accounts.length > 0) {
       for (const acc of accounts) {
         const { data: latestMetric } = await supabase
            .from('metrics')
            .select('views, followers, likes')
            .eq('account_id', acc.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();
            
         if (latestMetric) {
            totalViews += latestMetric.views || 0;
            totalFollowers += latestMetric.followers || 0;
            totalLikes += latestMetric.likes || 0;
         }
       }
    }

    // Engagement rate rough calc: (Likes + Comments) / Followers * 100
    // Simplified: Likes / Views * 100 for this example
    const engagementRate = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(2) : 0;

    return {
      totalViews,
      totalFollowers,
      engagementRate,
      activeAccounts: activeAccounts || 0
    };
  },

  getMonthlyOverview: async () => {
     // Returns an empty array or real data if available
     // For a real app, you'd use a postgres function to aggregate by month.
     // Returning empty for now to start fresh.
     return []; 
  }
};
