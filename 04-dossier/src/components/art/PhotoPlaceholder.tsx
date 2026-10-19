import { photoAt } from "@/content/site";
import { MangaPhoto, type MangaMode } from "./MangaPhoto";
import { ProceduralCrop } from "./ProceduralCrop";

/**
 * A photo slot (strip panels, mask windows). With photos in the manifest (`site.photos`), slot
 * `variant` shows that photo through the manga shader; with none, the procedural eye crop.
 * (Name kept from round 2 so existing chapters need no changes.)
 */
export function PhotoPlaceholder({
  variant = 0,
  mode,
  className = "",
}: {
  variant?: number;
  mode?: MangaMode;
  className?: string;
}) {
  const src = photoAt(variant);
  if (src) return <MangaPhoto src={src} variant={variant} mode={mode} className={className} />;
  return <ProceduralCrop variant={variant} className={className} />;
}
