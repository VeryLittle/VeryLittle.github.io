import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import earcut from 'earcut';
import type { BezierPath } from './bezierPath';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const pickFile = (cb: (file: File | undefined) => void, accept: string) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.addEventListener('change', () => {
    cb(input.files?.[0]);
  });
  input.addEventListener('cancel', () => {
    cb(undefined);
  });
  input.click();
};

export const generatePointsFromPath = (bezier: BezierPath | null, pointsPerPixels: number) => {
  if (!bezier) return [];

  const length = bezier.getTotalLength();
  const pointsCount = Math.floor((length * pointsPerPixels) / 1000);
  const points = [];

  if (pointsCount > 1) {
    for (let i = 0; i < pointsCount; i++) {
      const pt = bezier.getPointAtLength((i * length) / (pointsCount - 1));
      points.push(pt);
    }
  }

  return points;
};

export const isRow = (a: Point, b: Point, c: Point, eps: number) => {
  return Math.abs((a.y - b.y) * (a.x - c.x) - (a.y - c.y) * (a.x - b.x)) <= eps;
};

export const filterRow = (points: Point[], smoothing = 0.5) => {
  const result: Point[] = [];
  points.forEach((point, index) => {
    if (!points[index - 1] || !points[index + 1]) {
      return result.push(point);
    }
    if (!isRow(result[result.length - 1], point, points[index + 1], smoothing)) {
      return result.push(point);
    }
  });
  return result;
};

const trim = (number: number) => +number.toFixed(2);

export const generateTriangleMesh = (points: Point[], aHoles: Point[][]) => {
  const holes = aHoles.map((hole) => hole.flatMap((point) => [point.x, point.y]));
  const _points = points.flatMap((point) => [point.x, point.y]);

  const holeVerts = holes
    .reduce(
      (acc, hole) => {
        const prev = acc[acc.length - 1];

        acc.push(prev + hole.length / 2 - 1);
        acc.push(prev + hole.length / 2);
        return acc;
      },
      [_points.length / 2],
    )
    .slice(0, -1);

  const flatPoints = [..._points, ...holes.flat()];
  const vertices = earcut(flatPoints, holeVerts);
  const triangles = [];

  for (let i = 0; i < vertices.length - 2; i += 3) {
    const v1 = vertices[i];
    const v2 = vertices[i + 1];
    const v3 = vertices[i + 2];

    triangles.push({
      a: {
        x: trim(flatPoints[v1 * 2]),
        y: trim(flatPoints[v1 * 2 + 1]),
      },
      b: {
        x: trim(flatPoints[v2 * 2]),
        y: trim(flatPoints[v2 * 2 + 1]),
      },
      c: {
        x: trim(flatPoints[v3 * 2]),
        y: trim(flatPoints[v3 * 2 + 1]),
      },
    });
  }

  return triangles;
};

type Unpacked<T> = T extends (infer U)[] ? U : T;

export type Triangle = Unpacked<ReturnType<typeof generateTriangleMesh>>;

export type Point = { x: number; y: number };
