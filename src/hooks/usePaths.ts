import { useEffect, useState } from 'react';
import { splitPath } from '../helpers/pathSplitter';
import { bezierFromPath, type BezierPath } from '../helpers/bezierPath';

const normalizeSvg = (element: SVGElement) => {
  element.querySelectorAll('path').forEach((path) => {
    path.setAttribute('strike', path.getAttribute('fill') || '');
    path.setAttribute('fill', '');

    const ds = splitPath(path.getAttribute('d') || '');

    if (ds.length > 1) {
      path.setAttribute('d', ds[0]);
      ds.slice(1).forEach((d) => {
        const extraPath = path.cloneNode() as SVGPathElement;
        extraPath.setAttribute('d', d);
        path.after(extraPath);
      });
    }
  });
  return element;
};

const getAllPaths = (element: SVGElement) => {
  let allPaths: SVGPathElement[] = [];
  const gs = element.querySelectorAll('g');
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
  allPaths = allPaths.concat(...(element.querySelectorAll('& > path') as unknown as SVGPathElement[]));
  return allPaths;
};

type UsePathsProps = {
  svgElement: SVGElement;
};

export type PathConfig = {
  id: string;
  element: SVGPathElement;
  bezier: BezierPath | null;
  color: string;
  selected: boolean;
  excluded: SVGPathElement[];
};

export const usePaths = (props: UsePathsProps) => {
  const [paths, setPaths] = useState<SVGPathElement[]>([]);
  const [configs, setConfigs] = useState<PathConfig[]>([]);

  useEffect(() => {
    const paths = getAllPaths(normalizeSvg(props.svgElement));
    setPaths(paths);
    setConfigs(
      paths.map((path, index) => ({
        id: `${index}`,
        element: path,
        bezier: bezierFromPath(path),
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        selected: true,
        excluded: [],
      })),
    );
  }, [props.svgElement]);

  const updateConfig = (newPath: PathConfig) => {
    setConfigs((paths) => paths.map((path) => (path.element === newPath.element ? newPath : path)));
  };

  return {
    paths,
    configs,
    updateConfig,
  };
};
