export const MAP_EXPLORE_QUERY = "explore";
export const MAP_EXPLORE_VALUE = "map";
export const MAP_EXPLORE_HREF = `/?${MAP_EXPLORE_QUERY}=${MAP_EXPLORE_VALUE}`;

export function isMapExploreActive(
  pathname: string,
  explore: string | null | undefined
): boolean {
  return pathname === "/" && explore === MAP_EXPLORE_VALUE;
}
