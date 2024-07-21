import { UploadOutlined } from '@ant-design/icons';
import { type UploadFile, Upload, Button, message } from 'antd';
import { useState, type FC } from 'react';
import { PathSplitter } from '../../path';

const validateFileType = ({ type }: UploadFile, allowedTypes?: string) => {
  if (!allowedTypes) return true;
  return allowedTypes.includes(type || '');
};

type SvgUploaderProps = {
  onChange: (element: SVGElement | null) => void;
};

export const SvgUploader: FC<SvgUploaderProps> = (props) => {
  const [file, setFile] = useState<UploadFile | null>(null);

  const onChange = (file: UploadFile | null) => {
    if (file) {
      (file as unknown as File).text().then((text) => {
        const root = new DOMParser().parseFromString(text, 'image/svg+xml');
        root.querySelectorAll('path').forEach((path) => {
          path.setAttribute('strike', path.getAttribute('fill') || '');
          path.setAttribute('fill', '');

          const ds = PathSplitter(path.getAttribute('d') || '');

          if (ds.length > 1) {
            path.setAttribute('d', ds[0]);

            ds.slice(1).forEach((d) => {
              const extraPath = path.cloneNode() as SVGPathElement;
              extraPath.setAttribute('d', d);
              path.after(extraPath);
            });
          }
        });
        props.onChange(root.querySelector('svg'));
      });
    } else {
      props.onChange(null);
    }
    setFile(file);
  };

  return (
    <Upload
      fileList={file ? [file] : []}
      beforeUpload={(uploadFile: UploadFile) => {
        const isAllowedType = validateFileType(uploadFile, 'image/svg+xml');
        if (!isAllowedType) {
          onChange(null);
          message.error(`${uploadFile.name} is not SVG file`);
          return false;
        }
        onChange(uploadFile);

        return false;
      }}
      onRemove={(uploadFile: UploadFile) => {
        if (file && uploadFile.uid === file.uid) {
          onChange(null);
          return true;
        }
        return false;
      }}
    >
      <Button icon={<UploadOutlined />}>Upload svg</Button>
    </Upload>
  );
};
