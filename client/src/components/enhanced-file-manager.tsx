import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFileUpload, type UploadedFile } from '@/hooks/use-file-upload';
import { useFileExport, type ExportOptions } from '@/hooks/use-file-export';
import { 
  Download, 
  FileText, 
  Image, 
  Archive, 
  FileSpreadsheet,
  Settings,
  Check,
  X,
  Upload,
  Trash2,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface EnhancedFileManagerProps {
  onFilesChange?: (files: UploadedFile[]) => void;
  analysisData?: any;
  enableExport?: boolean;
}

export function EnhancedFileManager({ 
  onFilesChange, 
  analysisData,
  enableExport = true 
}: EnhancedFileManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState<ExportOptions['format']>('pdf');
  
  const {
    files,
    isDragging,
    setIsDragging,
    handleFileUpload,
    removeFile,
    clearAllFiles,
    getFileStats,
    limits
  } = useFileUpload();

  const { exportFiles, downloadProgress } = useFileExport();

  const stats = getFileStats();

  React.useEffect(() => {
    onFilesChange?.(files);
  }, [files, onFilesChange]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleExport = async (format: ExportOptions['format']) => {
    const exportData = {
      files,
      analysisData,
      stats,
      timestamp: new Date().toISOString()
    };

    const options: ExportOptions = {
      format,
      includeMetadata: true,
      includeAnalysis: true,
      includeImages: true,
      template: 'enterprise',
      paperSize: 'A4',
      orientation: 'portrait'
    };

    try {
      await exportFiles(exportData, options);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'code': return 'fas fa-code';
      case 'image': return 'fas fa-image';
      case 'document': return 'fas fa-file-alt';
      case 'data': return 'fas fa-database';
      default: return 'fas fa-file';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'code': return 'text-cyber-green';
      case 'image': return 'text-cyber-cyan';
      case 'document': return 'text-cyber-purple';
      case 'data': return 'text-cyber-yellow';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-4 h-4 text-cyber-green" />;
      case 'uploading': return <Upload className="w-4 h-4 text-cyber-cyan animate-pulse" />;
      case 'processing': return <Settings className="w-4 h-4 text-cyber-yellow animate-spin" />;
      case 'error': return <X className="w-4 h-4 text-cyber-red" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const exportFormats = [
    { format: 'pdf', icon: FileText, label: 'PDF Report', description: 'Professional document' },
    { format: 'html', icon: FileText, label: 'HTML Page', description: 'Web-based report' },
    { format: 'md', icon: FileText, label: 'Markdown', description: 'Documentation format' },
    { format: 'json', icon: FileSpreadsheet, label: 'JSON Data', description: 'Raw data export' },
    { format: 'csv', icon: FileSpreadsheet, label: 'CSV File', description: 'Spreadsheet data' },
    { format: 'zip', icon: Archive, label: 'ZIP Archive', description: 'Complete package' }
  ];

  return (
    <div className="glass-morph rounded-xl p-4 sm:p-6 smooth-transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyber-cyan/20 rounded-lg">
            <i className="fas fa-folder-open text-cyber-cyan text-xl"></i>
          </div>
          <div>
            <h3 className="text-lg font-orbitron font-bold text-cyber-cyan">
              Enhanced File Manager
            </h3>
            <p className="text-xs text-gray-400">
              {stats.total}/{limits.maxFiles} files • {stats.byCategory.image || 0}/{limits.maxImages} images
            </p>
          </div>
        </div>
        
        {enableExport && files.length > 0 && (
          <Button
            onClick={() => setShowExportOptions(!showExportOptions)}
            className="glass-button"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        )}
      </div>

      {/* Export Options */}
      {showExportOptions && (
        <div className="mb-6 p-4 bg-dark-card rounded-lg border border-cyber-cyan/30">
          <h4 className="text-sm font-orbitron text-cyber-cyan mb-3">Export Options</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {exportFormats.map(({ format, icon: Icon, label, description }) => (
              <button
                key={format}
                onClick={() => handleExport(format as ExportOptions['format'])}
                disabled={downloadProgress.isExporting}
                className="p-3 bg-dark-panel rounded-lg border border-gray-600 hover:border-cyber-green/50 transition-all text-left group disabled:opacity-50"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Icon className="w-4 h-4 text-cyber-green" />
                  <span className="text-sm font-medium text-white">{label}</span>
                </div>
                <p className="text-xs text-gray-400">{description}</p>
              </button>
            ))}
          </div>
          
          {downloadProgress.isExporting && (
            <div className="mt-4 p-3 bg-cyber-green/10 rounded-lg border border-cyber-green/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-cyber-green font-medium">
                  {downloadProgress.currentStep}
                </span>
                <span className="text-sm text-cyber-green">
                  {downloadProgress.progress}%
                </span>
              </div>
              <Progress 
                value={downloadProgress.progress} 
                className="h-2"
              />
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center smooth-transition cursor-pointer ${
          isDragging 
            ? 'border-cyber-green bg-cyber-green/10 scale-105' 
            : 'border-gray-600 hover:border-cyber-green/50 hover:bg-cyber-green/5'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-4">
          <div className={`p-4 rounded-full mx-auto w-16 h-16 flex items-center justify-center ${
            isDragging ? 'bg-cyber-green/20' : 'bg-gray-600/20'
          }`}>
            <i className={`fas fa-cloud-upload-alt text-2xl ${
              isDragging ? 'text-cyber-green animate-bounce' : 'text-gray-400'
            }`}></i>
          </div>
          
          <div>
            <p className="text-white font-orbitron text-lg mb-2">
              {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Supports: Code, Images, Documents, Data files
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-500">
            <div className="flex items-center justify-center space-x-1">
              <i className="fas fa-hashtag text-cyber-green"></i>
              <span>Max {limits.maxFiles} files</span>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <Image className="w-3 h-3 text-cyber-cyan" />
              <span>Max {limits.maxImages} images</span>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <i className="fas fa-weight text-cyber-yellow"></i>
              <span>Max {limits.maxFileSize / 1024 / 1024}MB each</span>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <i className="fas fa-shield-alt text-cyber-purple"></i>
              <span>OCR enabled</span>
            </div>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.css,.scss,.sass,.html,.xml,.json,.yaml,.yml,.toml,.ini,.conf,.sql,.sh,.bat,.ps1,.sol,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.tiff,.ico,.txt,.md,.pdf,.doc,.docx,.rtf,.odt,.csv,.xlsx,.xls,.tsv,.log"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        />
      </div>

      {/* Statistics Dashboard */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-6">
          <div className="bg-dark-card rounded-lg p-4 text-center border border-cyber-green/30">
            <div className="text-2xl font-bold text-cyber-green mb-1">{stats.completed}</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="bg-dark-card rounded-lg p-4 text-center border border-cyber-yellow/30">
            <div className="text-2xl font-bold text-cyber-yellow mb-1">{stats.processing}</div>
            <div className="text-xs text-gray-400">Processing</div>
          </div>
          <div className="bg-dark-card rounded-lg p-4 text-center border border-cyber-red/30">
            <div className="text-2xl font-bold text-cyber-red mb-1">{stats.errors}</div>
            <div className="text-xs text-gray-400">Errors</div>
          </div>
          <div className="bg-dark-card rounded-lg p-4 text-center border border-cyber-cyan/30">
            <div className="text-2xl font-bold text-white mb-1">{stats.total}</div>
            <div className="text-xs text-gray-400">Total Files</div>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-orbitron text-cyber-green flex items-center space-x-2">
              <i className="fas fa-list"></i>
              <span>Uploaded Files ({files.length})</span>
            </h4>
            <Button
              onClick={clearAllFiles}
              variant="ghost"
              size="sm"
              className="text-cyber-red hover:text-cyber-red hover:bg-cyber-red/10"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {files.map((file) => (
              <div key={file.id} className="bg-dark-card rounded-lg p-4 smooth-transition hover:bg-dark-panel border border-gray-600 hover:border-cyber-green/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-gray-700/50">
                      <i className={`${getCategoryIcon(file.category)} ${getCategoryColor(file.category)}`}></i>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate mb-1">{file.name}</div>
                      <div className="flex items-center space-x-3 text-xs text-gray-400">
                        <span>{formatFileSize(file.size)}</span>
                        <Badge variant="outline" className="capitalize text-xs">
                          {file.category}
                        </Badge>
                        {file.analysis?.language && (
                          <Badge variant="secondary" className="text-xs">
                            {file.analysis.language}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(file.status)}
                    <Button
                      onClick={() => removeFile(file.id)}
                      variant="ghost"
                      size="sm"
                      className="text-cyber-red hover:text-cyber-red p-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                {(file.status === 'uploading' || file.status === 'processing') && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">
                        {file.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                      </span>
                      <span className="text-xs text-cyber-green">{file.uploadProgress}%</span>
                    </div>
                    <Progress 
                      value={file.uploadProgress} 
                      className="h-1"
                    />
                  </div>
                )}

                {/* Analysis Results */}
                {file.status === 'completed' && file.analysis && (
                  <div className="mt-3 p-3 bg-dark-panel rounded border border-cyber-green/20">
                    {file.category === 'code' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="text-center">
                          <div className="text-cyber-green font-bold">{file.analysis.lines}</div>
                          <div className="text-gray-400">Lines</div>
                        </div>
                        <div className="text-center">
                          <div className="text-cyber-cyan font-bold">{file.analysis.functions}</div>
                          <div className="text-gray-400">Functions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-cyber-yellow font-bold">{file.analysis.complexity}/10</div>
                          <div className="text-gray-400">Complexity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-cyber-purple font-bold">{file.analysis.readability}/10</div>
                          <div className="text-gray-400">Readability</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* OCR Results */}
                {file.ocrText && (
                  <div className="mt-3 p-3 bg-dark-panel rounded border border-cyber-cyan/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <Eye className="w-3 h-3 text-cyber-cyan" />
                      <span className="text-xs font-orbitron text-cyber-cyan">OCR Extracted Text:</span>
                    </div>
                    <div className="text-xs text-gray-300 italic bg-black/20 p-2 rounded">
                      "{file.ocrText}"
                    </div>
                  </div>
                )}

                {/* Image Preview */}
                {file.preview && file.category === 'image' && (
                  <div className="mt-3">
                    <img 
                      src={file.preview} 
                      alt={file.name}
                      className="max-w-full h-24 object-cover rounded border border-cyber-cyan/30"
                    />
                  </div>
                )}

                {/* Error Display */}
                {file.status === 'error' && (
                  <div className="mt-3 p-3 bg-cyber-red/20 rounded border border-cyber-red/30">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-cyber-red" />
                      <span className="text-xs text-cyber-red font-medium">Error:</span>
                    </div>
                    <div className="text-xs text-cyber-red mt-1">{file.error}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <i className="fas fa-cloud-upload-alt text-4xl mb-4 opacity-50"></i>
          <p className="text-sm">No files uploaded yet. Drag & drop or click to upload files.</p>
        </div>
      )}
    </div>
  );
}

export default EnhancedFileManager;
