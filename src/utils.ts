import earcut from 'earcut';

export const getPaths = (elemrnt: SVGElement) => {
  let allPaths: SVGPathElement[] = [];

  const gs = elemrnt.querySelectorAll('g');
  gs.forEach((g) => {
    const groupPaths = g.querySelectorAll('path');
    groupPaths.forEach((gp) => {
      // biome-ignore lint/style/useConst: <explanation>
      for (let t of g.transform.baseVal) {
        gp.transform.baseVal.appendItem(t);
      }
      g.transform.baseVal.clear();
      allPaths.push(gp);
    });
  });
  allPaths = allPaths.concat(...(elemrnt.querySelectorAll('& > path') as unknown as SVGPathElement[]));
  return allPaths;
};

export const isRow = (a: Point, b: Point, c: Point, eps: number) => {
  const y = ((c.x - a.x) * (b.y - a.y)) / (b.x - a.x) + a.y;
  return Math.abs(y - c.y) <= eps;
};

export const generatePointsFromPath = (path: SVGPathElement, pointsPerPixels: number) => {
  const length = path.getTotalLength();
  const pointsCount = Math.floor((length * pointsPerPixels) / 1000);
  const points = [];

  for (let i = 0; i < pointsCount; i++) {
    let pt = path.getPointAtLength((i * length) / (pointsCount - 1));
    if (path.transform.baseVal.length > 0) {
      const matrix = path.transform.baseVal.consolidate()?.matrix;
      pt = pt.matrixTransform(matrix);
    }
    points.push(pt);
  }

  return points;
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

export const generateTriangleMesh = (points: Point[]) => {
  const flatPoints = points.flatMap((point) => [point.x, point.y]);
  const vertices = earcut(flatPoints);
  const triangles = [];

  for (let i = 0; i < vertices.length - 2; i += 3) {
    const v1 = vertices[i];
    const v2 = vertices[i + 1];
    const v3 = vertices[i + 2];

    const x1 = flatPoints[v1 * 2];
    const y1 = flatPoints[v1 * 2 + 1];
    const x2 = flatPoints[v2 * 2];
    const y2 = flatPoints[v2 * 2 + 1];
    const x3 = flatPoints[v3 * 2];
    const y3 = flatPoints[v3 * 2 + 1];

    const trim = (number: number) => +number.toFixed(2);

    const t = {
      x1: trim(x1),
      y1: trim(y1),
      x2: trim(x2),
      y2: trim(y2),
      x3: trim(x3),
      y3: trim(y3),
    };
    triangles.push(t);
  }

  return triangles;
};

type Unpacked<T> = T extends (infer U)[] ? U : T;

export type Triangle = Unpacked<ReturnType<typeof generateTriangleMesh>>;

export type Point = { x: number; y: number };
