"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Play, Heart } from "lucide-react"
import { Video } from "@/types"
import Image from "next/image"

interface ViralVideosCardProps {
  videos: (Video & { stats: { views: number; likes: number } })[]
}

export function ViralVideosCard({ videos }: ViralVideosCardProps) {
  return (
    <Card className="h-full bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 border-rose-100 dark:border-rose-900/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-rose-600 dark:text-rose-400">
          <Flame className="h-5 w-5 fill-current" />
          Em Alta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
          {videos.length === 0 ? (
             <p className="text-sm text-muted-foreground w-full text-center py-4">Nenhum vídeo viral detectado.</p>
          ) : (
            videos.map((video) => (
              <div key={video.id} className="min-w-[140px] w-[140px] snap-center group relative aspect-[9/16] rounded-lg overflow-hidden bg-black shadow-sm shrink-0">
                {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl} 
                      alt="Thumbnail" 
                      className="object-cover w-full h-full opacity-90 transition-opacity group-hover:opacity-100"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                        <Play className="h-8 w-8" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 text-white">
                    <p className="font-bold text-sm flex items-center gap-1">
                        <Play className="h-3 w-3 fill-white" />
                        {video.stats.views.toLocaleString()}
                    </p>
                    <p className="text-[10px] opacity-90 flex items-center gap-1">
                        <Heart className="h-2.5 w-2.5" />
                        {video.stats.likes.toLocaleString()}
                    </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
