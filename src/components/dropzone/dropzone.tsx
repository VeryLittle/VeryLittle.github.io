import { useState, useEffect } from 'react';
import { useStore } from '../store/store';
import { toast } from 'sonner';

export const Dropzone = () => {
  const { setFile } = useStore();
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (event: DragEvent) => {
      if (event.relatedTarget === null) {
        setIsDragging(false);
      }
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      setIsDragging(false);

      const files = event.dataTransfer?.files;
      if (files?.[0]) {
        try {
          setFile(files[0]);
        } catch {
          toast.error(`The file "${files[0].name}" is not an SVG.`);
        }
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <>
      {isDragging && (
        <div className="fixed z-50 inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 text-white text-xl">
            Drag and drop files here
          </div>
        </div>
      )}
    </>
  );
};
