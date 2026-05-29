import { useEffect, useMemo, useState } from 'react';
import { MuseumHome } from './pages/MuseumHome';
import { AskGuidePage } from './pages/AskGuidePage';
import { ReadingDetail } from './pages/ReadingDetail';
import { SanxingduiHome } from './pages/SanxingduiHome';
import { SegmentDetail } from './pages/SegmentDetail';
import { SegmentList } from './pages/SegmentList';
import { SourcesPage } from './pages/SourcesPage';
import { getAppPath } from './lib/paths';

function usePath() {
  const [path, setPath] = useState(getAppPath());

  useEffect(() => {
    const update = () => setPath(getAppPath());
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);

  return path;
}

export default function App() {
  const path = usePath();

  const page = useMemo(() => {
    if (path === '/' || path === '') {
      return <MuseumHome />;
    }
    if (path === '/sanxingdui' || path === '/sanxingdui/') {
      return <SanxingduiHome />;
    }
    if (path === '/sanxingdui/segments') {
      return <SegmentList />;
    }
    if (path === '/sanxingdui/ask') {
      const params = new URLSearchParams(window.location.search);
      const segmentId = Number(params.get('segmentId') || 0);
      return <AskGuidePage segmentId={segmentId || undefined} />;
    }
    const askMatch = path.match(/^\/sanxingdui\/ask\/(\d+)$/);
    if (askMatch) {
      return <AskGuidePage segmentId={Number(askMatch[1])} />;
    }
    const segmentMatch = path.match(/^\/sanxingdui\/segments\/(\d+)$/);
    if (segmentMatch) {
      return <SegmentDetail id={Number(segmentMatch[1])} />;
    }
    const readingMatch = path.match(/^\/sanxingdui\/readings\/(\d+)$/);
    if (readingMatch) {
      return <ReadingDetail id={Number(readingMatch[1])} />;
    }
    if (path === '/sanxingdui/sources') {
      return <SourcesPage />;
    }
    return <MuseumHome />;
  }, [path]);

  return <div className="app-shell">{page}</div>;
}
