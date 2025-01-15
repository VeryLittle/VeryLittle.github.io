import { Stub } from './components/stub';
import { type PathConfig, useStore } from '../store/store';
import _ from '@/lib/canvas';
import { useEffect, useRef } from 'react';
import { FilePicker } from './components/filePicker';
import { zoomTransform, select, zoom } from 'd3';
import type { Triangle } from '@/lib/utils';

const render = (
  canvas: HTMLCanvasElement,
  paths: string[],
  triangles: Record<string, Triangle[]>,
  configs: Record<string, PathConfig>,
) => {
  const context = canvas.getContext('2d');
  if (!context) return;

  const api = _(canvas);
  context.save();
  api.fitSize();
  api.clear();
  const transform = zoomTransform(canvas as Element);
  context.translate(transform.x, transform.y);
  context.scale(transform.k, transform.k);

  api.drawPaths(paths);

  paths.forEach((path) => {
    if (!configs[path].selected) return;
    api.setColor(configs[path].color);
    triangles[path].forEach((t) => {
      api.drawTriangle(t);
    });
  });

  context.restore();
};

export const Viewport = () => {
  const { file, paths, triangles, configs } = useStore();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    render(canvas, paths, triangles, configs);

    select(canvas as Element).call(
      zoom()
        .scaleExtent([0.1, 8])
        .on('zoom', () => render(canvas, paths, triangles, configs)),
    );
  }, [paths, triangles, configs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = () => {
      render(canvas, paths, triangles, configs);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [paths, triangles, configs]);

  return (
    <div className="flex-1 relative">
      <FilePicker />
      <div
        ref={viewportRef}
        className="border border-input rounded-md w-full h-full flex items-center justify-center relative overflow-hidden"
      >
        <Stub />

        {file && <canvas ref={canvasRef} className="w-full h-full absolute" />}
      </div>
    </div>
  );
};
