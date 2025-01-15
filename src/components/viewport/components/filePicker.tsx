import { useStore } from '@/components/store/store';
import { Badge } from '@/components/ui/badge';
import { pickFile } from '@/lib/utils';
import { FileImage, RefreshCcw } from 'lucide-react';

export const FilePicker = () => {
  const { file, setFile } = useStore();

  if (!file) return null;

  return (
    <div className="absolute top-4 left-3 z-10">
      <button type="button" onClick={() => pickFile(setFile, 'image/svg+xml')}>
        <Badge variant="outline" className="cursor-pointer py-[5px]">
          <FileImage size="16" className="mr-1" />
          <span className="text-sm font-medium truncate max-w-32">{file.name}</span>
          <RefreshCcw size="14" className="ml-6 text-muted-foreground" />
        </Badge>
      </button>
    </div>
  );
};
