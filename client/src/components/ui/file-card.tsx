import { Button } from "@/components/ui/button";
import { Download, FileText, Image, Video } from "lucide-react";
import { type GeneratedFile } from "@shared/schema";

interface FileCardProps {
  file: GeneratedFile;
  onDownload: (file: GeneratedFile) => void;
}

export default function FileCard({ file, onDownload }: FileCardProps) {
  const getFileIcon = (fileType: string) => {
    if (fileType === 'image') return <Image className="h-4 w-4" />;
    if (fileType === 'video') return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'image': return 'text-cyber-cyan border-cyber-cyan/30';
      case 'video': return 'text-cyber-purple border-cyber-purple/30';
      case 'javascript':
      case 'typescript': return 'text-cyber-green border-cyber-green/30';
      default: return 'text-gray-400 border-gray-600';
    }
  };

  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeLabel = (fileType: string): string => {
    const labels: { [key: string]: string } = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      jsx: 'React JSX',
      tsx: 'React TSX',
      css: 'CSS',
      html: 'HTML',
      image: 'Generated Image',
      video: 'Generated Video',
      json: 'JSON',
      python: 'Python',
    };
    return labels[fileType] || fileType.toUpperCase();
  };

  return (
    <div className={`border rounded-lg p-4 hover:border-opacity-100 transition-all ${getFileTypeColor(file.fileType)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded flex items-center justify-center ${
            file.fileType === 'image' ? 'bg-cyber-cyan/20' :
            file.fileType === 'video' ? 'bg-cyber-purple/20' :
            'bg-cyber-green/20'
          }`}>
            {getFileIcon(file.fileType)}
          </div>
          <div>
            <h3 className="font-fira text-sm text-white" data-testid={`text-filename-${file.id}`}>{file.fileName}</h3>
            <p className="text-xs text-gray-400">{getFileTypeLabel(file.fileType)}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDownload(file)}
          className={`transition-colors h-8 w-8 p-0 ${getFileTypeColor(file.fileType).split(' ')[0]} hover:text-cyber-green`}
          data-testid={`button-download-${file.id}`}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="text-xs text-gray-400 mb-2" data-testid={`text-filesize-${file.id}`}>
        {formatFileSize(file.size)} • {getFileTypeLabel(file.fileType)}
      </div>
      
      {file.fileType === 'image' && file.binaryData && (
        <img 
          src={`data:image/png;base64,${file.binaryData}`}
          alt="Generated image" 
          className="w-full h-20 object-cover rounded"
          data-testid={`img-preview-${file.id}`}
        />
      )}
      
      {file.content && file.fileType !== 'image' && (
        <div className="bg-dark-card rounded p-2 text-xs font-fira text-gray-300 overflow-hidden">
          <div className="line-clamp-2" data-testid={`text-preview-${file.id}`}>
            {file.content.substring(0, 100)}...
          </div>
        </div>
      )}
    </div>
  );
}
