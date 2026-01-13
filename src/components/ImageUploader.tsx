import { Upload, message, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { RcFile, UploadChangeParam } from "antd/es/upload";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useState } from "react";

interface ImageUploaderProps {
  value?: string; // current URL
  onChange?: (url: string) => void;
}

export default function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(value);
  const storage = getStorage();

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload images!");
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Image must be smaller than 5MB!");
    }
    return isImage && isLt5M;
  };

  const handleChange = async (info: UploadChangeParam<any>) => {
    const file = info.file.originFileObj as RcFile;
    if (!file) return;

    setLoading(true);
    try {
      const storageRef = ref(storage, `players/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
      onChange?.(url);
      message.success("Upload successful!");
    } catch (err) {
      console.error(err);
      message.error("Upload failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Upload
      showUploadList={false}
      beforeUpload={beforeUpload}
      customRequest={({ file, onSuccess }) => {
        // required by AntD but we handle upload manually
        setTimeout(() => onSuccess && onSuccess("ok"), 0);
      }}
      onChange={handleChange}
    >
      <Button loading={loading} icon={<UploadOutlined />}>
        {imageUrl ? "Change Image" : "Upload Image"}
      </Button>
    </Upload>
  );
}
