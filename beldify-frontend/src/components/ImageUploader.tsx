import React, { useState } from 'react';
import ColorList from './ColorList';
import logger from '@/utils/consoleLogger';
  
interface ImageUploaderProps {
  onUploadComplete?: (images: any[], colors: string[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(event.target.files);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles) return;

    setUploading(true);
    const formData = new FormData();
    Array.from(selectedFiles).forEach((file) => {
      formData.append('images[]', file);
    });

    try {
      const response = await fetch('/api/admin/product-images/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setExtractedColors(data.colors || []);
        if (onUploadComplete) {
          onUploadComplete(data.images, data.colors);
        }
      } else {
        logger.error('Upload failed:', data.message);
      }
    } catch (error) {
      logger.error('Error uploading images:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-amber-50 file:text-amber-700
            hover:file:bg-amber-100
            disabled:opacity-50"
          disabled={uploading}
        />
        <button
          onClick={handleUpload}
          disabled={!selectedFiles || uploading}
          className="px-4 py-2 bg-amber-600 text-white rounded-md
            hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {extractedColors.length > 0 && <ColorList colors={extractedColors} />}
    </div>
  );
};

export default ImageUploader;
