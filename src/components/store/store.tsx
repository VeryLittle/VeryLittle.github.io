import { type BezierPath, bezierFromPath } from '@/lib/bezierPath';
import { getAllPaths, normalizeSvg } from '@/lib/path';
import { filterRow, generatePointsFromPath, generateTriangleMesh, type Triangle } from '@/lib/utils';
import { interpolateRainbow } from 'd3';
import React, { useContext, useEffect, useState } from 'react';

const validateFileType = ({ type }: File, allowedTypes?: string) => {
  if (!allowedTypes) return true;
  return allowedTypes.includes(type || '');
};

type StoreContextType = {
  paths: string[];
  file?: { name: string };
  setFile: (file: File | undefined) => void;
  maxPoints: number;
  setMaxPoints: React.Dispatch<React.SetStateAction<number>>;
  smoothing: number;
  setSmoothing: React.Dispatch<React.SetStateAction<number>>;
  triangles: Record<string, Triangle[]>;
  configs: Record<string, PathConfig>;
  updateConfig: (path: string, config: PathConfig) => void;
};

export type PathConfig = {
  bezier: BezierPath | null;
  color: string;
  selected: boolean;
  excluded: string[];
};

export const StoreContext = React.createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [file, setFile] = useState<File | undefined>();
  const [paths, setPaths] = useState<string[]>([]);
  const [configs, setConfigs] = useState<Record<string, PathConfig>>({});
  const [maxPoints, setMaxPoints] = useState(100);
  const [smoothing, setSmoothing] = useState(0.5);
  const [triangles, setTriangles] = useState<Record<string, Triangle[]>>({});

  const updateTriangles = (newPaths: string[], newConfig: Record<string, PathConfig>) => {
    const newPoints = new Map(
      newPaths.map((path) => [
        path,
        filterRow(generatePointsFromPath(newConfig[path].bezier, maxPoints), smoothing),
      ]),
    );
    setTriangles(
      Object.fromEntries(
        newPaths.map((path) => {
          const filter = <T extends object>(array: Array<T | undefined>): T[] => array.filter(Boolean) as T[];
          return [
            path,
            generateTriangleMesh(
              newPoints.get(path) || [],
              filter(newConfig[path].excluded.map((ex) => newPoints.get(ex))),
            ),
          ];
        }),
      ),
    );
  };

  const updateFile = (file: File | undefined) => {
    if (!(file && validateFileType(file, 'image/svg+xml'))) {
      setFile(undefined);
      setPaths([]);
      if (file) throw new Error(`${file.name} is not SVG file`);
      return;
    }

    setFile(file);

    file.text().then((text) => {
      const root = new DOMParser().parseFromString(text, 'image/svg+xml');
      const svg = root.querySelector('svg');

      let paths: string[] = [];
      if (svg) {
        paths = getAllPaths(normalizeSvg(svg))
          .map((path) => path.getAttribute('d') || '')
          .filter(Boolean);
        paths = [...new Set(paths)];
      }

      setPaths(paths);

      const configs = Object.fromEntries(
        paths.map((path, index) => [
          path,
          {
            bezier: bezierFromPath(path),
            color: interpolateRainbow(index / paths.length),
            selected: true,
            excluded: [],
          },
        ]),
      );
      setConfigs(configs);

      updateTriangles(paths, configs);
    });
  };

  const updateConfig = (path: string, config: PathConfig) => {
    setConfigs({ ...configs, [path]: config });
  };

  useEffect(() => {
    updateTriangles(paths, configs);
  }, [maxPoints, smoothing, configs]);

  return (
    <StoreContext.Provider
      value={{
        file: file && { name: file.name },
        paths,
        setFile: updateFile,
        maxPoints,
        setMaxPoints,
        smoothing,
        setSmoothing,
        triangles,
        configs,
        updateConfig,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('Store context aren`t defined');
  }
  return context;
};
