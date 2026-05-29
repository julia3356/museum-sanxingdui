import { content, Segment } from '../data/content';

export const basePath = '/tools/museum';

export function withBase(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalized}`.replace(/\/$/, '/') || `${basePath}/`;
}

export function getAppPath(): string {
  const pathname = window.location.pathname;
  if (pathname === basePath) {
    return '/';
  }
  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length) || '/';
  }
  return pathname || '/';
}

export function navigate(path: string): void {
  window.history.pushState({}, '', withBase(path));
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function resolveTheme(segmentId: number): string {
  const theme = content.guide.prologueThemes.find((entry) =>
    entry.entrySegments.includes(segmentId),
  );
  return theme?.title || '展线';
}

export function getSegment(id: number): Segment | undefined {
  return content.browseIndex.find((segment) => segment.id === id);
}

export function getThumbnailUrl(thumbnail: string): string {
  const match = thumbnail.match(/\/thumbs\/(\d+)\.png$/);
  if (!match) {
    return '';
  }
  return `${import.meta.env.BASE_URL}thumbs/${match[1]}.png`;
}

export function getPlayableVideoUrl(segment: Segment): string {
  if (!segment.remoteUrl) {
    return '';
  }
  if (/^https?:\/\//.test(segment.remoteUrl) || segment.remoteUrl.startsWith('/')) {
    return segment.remoteUrl;
  }
  return '';
}

export function sourceText(sourceIds: string[]): string {
  return sourceIds
    .map((sourceId) => content.sources.find((source) => source.id === sourceId)?.label || sourceId)
    .join('、');
}
