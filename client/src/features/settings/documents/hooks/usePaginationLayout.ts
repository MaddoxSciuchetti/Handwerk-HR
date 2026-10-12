import { useLayoutEffect, useState } from 'react';
import { DEFAULT_EDITOR_ZOOM } from '../consts/editor.consts';

type PaginationPage = {
  height: number;
  marginTop: number;
  marginBottom: number;
};

type UsePaginationLayoutArgs = {
  pageView: boolean;
  section: 'content' | 'header' | 'footer';
  page: PaginationPage;
};

export function usePaginationLayout({
  pageView,
  section,
  page,
}: UsePaginationLayoutArgs) {
  const [zoom, setZoom] = useState(DEFAULT_EDITOR_ZOOM);
  const [pageCount, setPageCount] = useState(1);
  const [paginationLayout] = useState(() => ({
    enabled: pageView && section === 'content',
    height: page.height,
    top: page.marginTop,
    bottom: page.marginBottom,
    zoom: zoom / DEFAULT_EDITOR_ZOOM,
  }));
  useLayoutEffect(() => {
    Object.assign(paginationLayout, {
      enabled: pageView && section === 'content',
      height: page.height,
      top: page.marginTop,
      bottom: page.marginBottom,
      zoom: zoom / DEFAULT_EDITOR_ZOOM,
    });
  }, [
    paginationLayout,
    pageView,
    section,
    page.height,
    page.marginTop,
    page.marginBottom,
    zoom,
  ]);

  return { zoom, setZoom, pageCount, setPageCount, paginationLayout };
}
