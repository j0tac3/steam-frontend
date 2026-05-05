import { GameDetailsPro } from '../models/game-details-pro'; // Ajusta tu ruta

export const mapIgdbToPro = (igdbGame: any): GameDetailsPro => {
  return {
    id: igdbGame.id,
    name: igdbGame.name,
    coverUrl: igdbGame.cover?.image_id 
      ? `https://images.igdb.com/igdb/image/upload/t_720p/${igdbGame.cover.image_id}.jpg` 
      : 'https://placehold.co/600x800/1a1a1a/6441a5?text=Sin+Portada',
    criticScore: igdbGame.aggregated_rating,
    criticScoreCount: igdbGame.aggregated_rating_count,
    userScore: igdbGame.rating,
    userScoreCount: igdbGame.rating_count,
    genres: igdbGame.genres?.map((g: any) => g.name) || [],
    gameModes: igdbGame.game_modes?.map((m: any) => m.name) || [],
    platforms: igdbGame.platforms?.map((p: any) => p.name) || [],
    releaseDate: igdbGame.first_release_date,
    summary: igdbGame.summary,
    screenshots: igdbGame.screenshots?.map((s: any) => `https://images.igdb.com/igdb/image/upload/t_screenshot_med/${s.image_id}.jpg`) || []
  };
};

export const mapSteamToPro = (steamGame: any): GameDetailsPro => {
  // Nota: Ajusta estas propiedades según lo que te devuelva tu endpoint exacto de Steam
  return {
    id: steamGame.steam_appid,
    name: steamGame.name,
    coverUrl: steamGame.header_image || 'https://placehold.co/600x800/1a1a1a/6441a5?text=Sin+Portada',
    criticScore: steamGame.metacritic?.score,
    criticScoreCount: undefined, // Steam no suele dar este dato fácilmente
    userScore: steamGame.recommendations?.total,
    userScoreCount: undefined,
    genres: steamGame.genres?.map((g: any) => g.description) || [],
    gameModes: steamGame.categories?.map((c: any) => c.description) || [], 
    platforms: Object.keys(steamGame.platforms || {}).filter(k => steamGame.platforms[k]), // Transforma {windows: true, mac: false} a ['windows']
    releaseDate: steamGame.release_date?.date ? new Date(steamGame.release_date.date).getTime() / 1000 : undefined,
    summary: steamGame.short_description || steamGame.about_the_game,
    screenshots: steamGame.screenshots?.map((s: any) => s.path_full) || []
  };
};