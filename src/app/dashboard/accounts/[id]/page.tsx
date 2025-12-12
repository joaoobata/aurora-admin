import { DataService } from "@/services/data-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, ExternalLink, Calendar, Heart, MessageCircle, Share2, Play } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { SyncButton } from "@/components/dashboard/sync-button"

export const dynamic = 'force-dynamic'

export default async function AccountDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const account = await DataService.getAccountDetails(id)
  const videos = await DataService.getAccountVideos(id)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{account.username}</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <span className="capitalize">{account.platform}</span> 
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-medium">
              {account.status}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
           <SyncButton accountId={account.id} username={account.username} platform={account.platform} />
           {account.url && (
             <Link href={account.url} target="_blank">
               <Button variant="ghost" size="icon">
                 <ExternalLink className="h-4 w-4" />
               </Button>
             </Link>
           )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Vídeos Monitorados</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{videos.length}</div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Total de Visualizações</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">
               {videos.reduce((acc, v) => acc + (v.stats?.views || 0), 0).toLocaleString()}
             </div>
           </CardContent>
         </Card>
      </div>

      {/* Video Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Últimos Vídeos</h2>
        {videos.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/10">
            <p className="text-muted-foreground">Nenhum vídeo encontrado. Clique em Sincronizar para buscar dados.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="relative aspect-[9/16] bg-black">
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl} 
                      alt="Thumbnail" 
                      className="object-cover w-full h-full opacity-90"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      <Play className="h-12 w-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white">
                    <div className="flex items-center gap-1 font-bold text-lg">
                      <Play className="h-4 w-4 fill-white" />
                      {video.stats.views.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-4 flex-1 flex flex-col gap-3">
                   <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5em]">
                     {video.description || "Sem descrição"}
                   </p>
                   
                   <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-auto pt-3 border-t">
                     <div className="flex flex-col items-center gap-1">
                       <Heart className="h-4 w-4 text-red-500" />
                       <span>{video.stats.likes.toLocaleString()}</span>
                     </div>
                     <div className="flex flex-col items-center gap-1">
                       <MessageCircle className="h-4 w-4 text-blue-500" />
                       <span>{video.stats.comments.toLocaleString()}</span>
                     </div>
                     <div className="flex flex-col items-center gap-1">
                       <Share2 className="h-4 w-4 text-green-500" />
                       <span>{video.stats.shares.toLocaleString()}</span>
                     </div>
                   </div>
                </CardContent>
                <CardHeader className="p-3 pt-0 pb-3">
                   <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : 'Desconhecido'}
                   </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
