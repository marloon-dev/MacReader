// CSS aplicado dentro das páginas do livro, conforme as preferências de leitura.

import literataUrl from '@fontsource-variable/literata/files/literata-latin-wght-normal.woff2?url'
import literataItalicUrl from '@fontsource-variable/literata/files/literata-latin-wght-italic.woff2?url'
import literataExtUrl from '@fontsource-variable/literata/files/literata-latin-ext-wght-normal.woff2?url'
import atkinsonUrl from '@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-400-normal.woff2?url'
import atkinsonBoldUrl from '@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-700-normal.woff2?url'
import type { Palette, ReadingMargin, ReadingSettings } from './settings'

// As páginas do livro são documentos à parte (iframes), então as fontes
// precisam de endereço absoluto.
const absolute = (url: string) => new URL(url, document.baseURI).href

const fontFaces = () => `
  @font-face { font-family: 'MR Literata'; font-style: normal; font-weight: 200 900; src: url('${absolute(literataUrl)}') format('woff2'); }
  @font-face { font-family: 'MR Literata'; font-style: normal; font-weight: 200 900; src: url('${absolute(literataExtUrl)}') format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF; }
  @font-face { font-family: 'MR Literata'; font-style: italic; font-weight: 200 900; src: url('${absolute(literataItalicUrl)}') format('woff2'); }
  @font-face { font-family: 'MR Atkinson'; font-weight: 400; src: url('${absolute(atkinsonUrl)}') format('woff2'); }
  @font-face { font-family: 'MR Atkinson'; font-weight: 700; src: url('${absolute(atkinsonBoldUrl)}') format('woff2'); }
`

const families: Record<ReadingSettings['font'], string | null> = {
  livro: null,
  literata: "'MR Literata', Georgia, serif",
  atkinson: "'MR Atkinson', system-ui, sans-serif",
}

export function bookCss(settings: ReadingSettings, palette: Palette): string {
  const family = families[settings.font]
  return `
    @namespace epub "http://www.idpf.org/2007/ops";
    ${fontFaces()}
    html {
      color-scheme: ${palette.name === 'noite' ? 'dark' : 'light'};
      font-size: ${settings.fontSize}% !important;
      color: ${palette.text};
      background: ${palette.background} !important;
    }
    body {
      color: inherit !important;
      background: transparent !important;
      ${family ? `font-family: ${family} !important;` : ''}
    }
    ${family ? `p, li, blockquote, dd, div, span, h1, h2, h3, h4, h5, h6 { font-family: inherit !important; }` : ''}
    p, li, blockquote, dd {
      line-height: ${settings.lineHeight} !important;
      text-align: ${settings.justify ? 'justify' : 'start'};
      hyphens: auto;
      -webkit-hyphens: auto;
      widows: 2;
      orphans: 2;
    }
    [align="left"] { text-align: left; }
    [align="right"] { text-align: right; }
    [align="center"] { text-align: center; }
    a:link, a:visited { color: ${palette.link}; }
    pre { white-space: pre-wrap !important; }
    ${palette.name === 'noite' ? 'img, svg, video { filter: brightness(.85); }' : ''}
    ::selection { background: rgba(242, 165, 65, .45); }
    aside[epub|type~="footnote"], aside[epub|type~="endnote"], aside[epub|type~="note"], aside[epub|type~="rearnote"] {
      display: none;
    }
  `
}

const gaps: Record<ReadingMargin, string> = { estreita: '4%', media: '7%', larga: '12%' }

export function layoutAttributes(settings: ReadingSettings): Record<string, string> {
  return {
    flow: settings.flow === 'rolagem' ? 'scrolled' : 'paginated',
    gap: gaps[settings.margin],
    margin: '40px',
    'max-inline-size': '680px',
    'max-column-count': '2',
  }
}
