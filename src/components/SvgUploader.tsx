import { UploadOutlined } from '@ant-design/icons';
import { type UploadFile, Upload, Button, message } from 'antd';
import { useState, type FC } from 'react';

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
