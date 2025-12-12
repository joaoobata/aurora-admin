import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ScraperService } from '@/services/scraper-service';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Security Check
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { accountId, platform, username } = await req.json();

    if (!accountId || !username) {
      return NextResponse.json({ error: 'Missing accountId or username' }, { status: 400 });
    }

    // 2. Call Scraper (Real or Mock)
    let scrapedVideos = [];
    if (platform === 'tiktok') {
        scrapedVideos = await ScraperService.scrapeTikTok(username);
    } else {
        // Fallback for other platforms or mock
        scrapedVideos = ScraperService.getMockData(username);
    }

    // 3. Update Database
    // We loop through videos to upsert them and add new metric records
    const results = [];
    
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
        }, { onConflict: 'account_id, external_id' }) // Requires unique constraint in DB ideally, but we query by external_id usually
        .select()
        .single();

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
           
         if (!metricError) results.push(videoRecord.id);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: results.length,
      message: `Updated ${results.length} videos for ${username}` 
    });

  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
