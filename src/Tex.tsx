import katex from 'katex';
import 'katex/dist/katex.min.css';

export function Tex({ src, block = false }: { src: string; block?: boolean }) {
  const html = katex.renderToString(src, { displayMode: block, throwOnError: false });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
