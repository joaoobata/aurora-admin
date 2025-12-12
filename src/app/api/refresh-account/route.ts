import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ScraperService } from '@/services/scraper-service';
import { RapidApiService } from '@/services/rapid-api-service';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Security Check
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({})); // Handle empty body safely
    const { accountId, platform, username } = body;

    // MODE 1: Single Account Refresh
    if (accountId && username) {
        return await refreshSingleAccount(supabase, accountId, platform, username);
    } 
    
    // MODE 2: Batch Refresh (All Active Accounts)
    // If no specific account provided, refresh all active accounts for the user
    const { data: accounts, error: accError } = await supabase
        .from('accounts')
        .select('*')
        .eq('status', 'active')
        .eq('user_id', user.id); // Only refresh user's own accounts

    if (accError) throw accError;

    if (!accounts || accounts.length === 0) {
        return NextResponse.json({ message: "No active accounts to refresh", processed: 0 });
    }

    // Process in parallel but limit concurrency to avoid timeout/rate limits
    // Ideally use a queue, but for MVP Promise.all is okay for small number of accounts
    const results = await Promise.allSettled(
        accounts.map(acc => refreshSingleAccount(supabase, acc.id, acc.platform, acc.username))
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).status === 200).length;
    const errorCount = results.length - successCount;

    return NextResponse.json({ 
        success: true, 
        message: `Batch refresh complete. Success: ${successCount}, Errors: ${errorCount}`,
        processed: successCount
    });

  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to process a single account
async function refreshSingleAccount(supabase: any, accountId: string, platform: string, username: string) {
    // 2. Call Scraper (Preferred: RapidAPI, Fallback: Apify, Last: Mock)
    let scrapResult;
    const useRapidApi = !!process.env.RAPID_API_KEY;

    try {
        if (useRapidApi) {
            console.log(`🚀 Using RapidAPI for ${platform} (${username})`);
            if (platform === 'tiktok') {
                scrapResult = await RapidApiService.getTikTokData(username);
            } else if (platform === 'instagram') {
                scrapResult = await RapidApiService.getInstagramData(username);
            } else if (platform === 'youtube') {
                scrapResult = await RapidApiService.getYouTubeData(username);
            } else {
                // Fallback for others
                scrapResult = ScraperService.getMockData(username);
            }
        } else {
            console.log(`⚠️ RapidAPI Key missing, falling back to Apify/Mock for ${platform}`);
            if (platform === 'tiktok') {
                scrapResult = await ScraperService.scrapeTikTok(username);
            } else if (platform === 'instagram') {
                scrapResult = await ScraperService.scrapeInstagram(username);
            } else if (platform === 'youtube') {
                scrapResult = await ScraperService.scrapeYoutube(username);
            } else {
                scrapResult = ScraperService.getMockData(username);
            }
        }
    } catch (e: any) {
        console.error(`❌ Scraper failed for ${platform} user ${username}:`, e.message);
        // Optional: Fail gracefully or throw?
        // Let's throw so the batch processor records it as error
        throw e;
    }

    // Handle legacy return format (array of videos) vs new format ({ videos, profileStats })
    const scrapedVideos = Array.isArray(scrapResult) ? scrapResult : scrapResult.videos;
    const profileStats = !Array.isArray(scrapResult) ? scrapResult.profileStats : null;

    // 2.5 Update Account Profile Stats (Followers, etc)
    if (profileStats) {
         await supabase.from('metrics').insert({
             account_id: accountId,
             followers: profileStats.followers || 0,
             views: profileStats.totalViews || 0, 
             likes: profileStats.totalLikes || 0, 
             recorded_at: new Date().toISOString()
         });
    }

    // 3. Update Database
    let newVideosCount = 0;
    
    for (const video of scrapedVideos) {
      // A. Upsert Video Info
      const { data: videoRecord, error: videoError } = await supabase
        .from('videos')
        .upsert({
          account_id: accountId,
          external_id: video.externalId,
          url: video.url,
          thumbnail_url: video.thumbnailUrl,
          description: video.description,
          published_at: video.publishedAt,
          updated_at: new Date().toISOString()
        }, { onConflict: 'account_id, external_id' }) 
        .select()
        .single();

      if (videoError) {
          console.error(`❌ Failed to upsert video ${video.externalId}:`, videoError.message);
      }

      if (videoRecord) {
         // B. Insert New Metric Record
         const { error: metricError } = await supabase
           .from('video_metrics')
           .insert({
             video_id: videoRecord.id,
             views: video.stats.views,
             likes: video.stats.likes,
             comments: video.stats.comments,
             shares: video.stats.shares,
             recorded_at: new Date().toISOString()
           });
           
         if (metricError) {
             console.error(`❌ Failed to insert metrics for video ${videoRecord.id}:`, metricError.message);
         } else {
             newVideosCount++;
         }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: newVideosCount,
      message: `Updated ${newVideosCount} videos for ${username}` 
    });
}
