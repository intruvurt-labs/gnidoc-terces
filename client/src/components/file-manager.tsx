import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useFileUpload, type UploadedFile } from '@/hooks/use-file-upload';

interface FileManagerProps {
  onFilesChange?: (files: UploadedFile[]) => void;
}

export function FileManager({ onFilesChange }: FileManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryIcon = (category: string): string => {
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

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed': return 'fas fa-check-circle text-cyber-green';
      case 'uploading': return 'fas fa-upload text-cyber-cyan';
      case 'processing': return 'fas fa-cog fa-spin text-cyber-yellow';
      case 'error': return 'fas fa-exclamation-circle text-cyber-red';
      default: return 'fas fa-clock text-gray-400';
    }
  };

  return (
    <div className="glass-morph rounded-xl p-4 sm:p-6 smooth-transition">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-orbitron font-bold text-cyber-cyan">
          <i className="fas fa-folder-open mr-2"></i>
          File Manager
        </h3>
        <div className="text-xs text-gray-400">
          {stats.total}/{limits.maxFiles} files • {stats.byCategory.image || 0}/{limits.maxImages} images
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center smooth-transition ${
          isDragging 
            ? 'border-cyber-green bg-cyber-green/10' 
            : 'border-gray-600 hover:border-cyber-green/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <i className={`fas fa-cloud-upload-alt text-3xl mb-3 ${
          isDragging ? 'text-cyber-green' : 'text-gray-400'
        }`}></i>
        <p className="text-white font-orbitron mb-2">
          {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mb-3">
          Supports: Code, Images, Documents, Data files
        </p>
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Max {limits.maxFiles} files total</div>
          <div>• Max {limits.maxImages} images (with OCR)</div>
          <div>• Max {limits.maxFileSize / 1024 / 1024}MB per file</div>
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

      {/* Statistics */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-4">
          <div className="bg-dark-card rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-cyber-green">{stats.completed}</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="bg-dark-card rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-cyber-yellow">{stats.processing}</div>
            <div className="text-xs text-gray-400">Processing</div>
          </div>
          <div className="bg-dark-card rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-cyber-red">{stats.errors}</div>
            <div className="text-xs text-gray-400">Errors</div>
          </div>
          <div className="bg-dark-card rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-white">{stats.total}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-orbitron text-cyber-green">Uploaded Files</h4>
            <Button
              onClick={clearAllFiles}
              variant="ghost"
              size="sm"
              className="text-cyber-red hover:text-cyber-red"
            >
              <i className="fas fa-trash mr-1"></i>
              Clear All
            </Button>
          </div>
          
          {files.map((file) => (
            <div key={file.id} className="bg-dark-card rounded-lg p-3 smooth-transition hover:bg-dark-panel">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <i className={`${getCategoryIcon(file.category)} ${getCategoryColor(file.category)}`}></i>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{file.name}</div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span className="capitalize">{file.category}</span>
                      {file.analysis?.language && (
                        <>
                          <span>•</span>
                          <span>{file.analysis.language}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <i className={getStatusIcon(file.status)}></i>
                  <Button
                    onClick={() => removeFile(file.id)}
                    variant="ghost"
                    size="sm"
                    className="text-cyber-red hover:text-cyber-red p-1"
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              {(file.status === 'uploading' || file.status === 'processing') && (
                <div className="mt-2">
                  <div className="w-full bg-dark-panel rounded-full h-1">
                    <div 
                      className="bg-cyber-green h-1 rounded-full transition-all duration-300"
                      style={{ width: `${file.uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {file.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                  </div>
                </div>
              )}

              {/* Analysis Results */}
              {file.status === 'completed' && file.analysis && (
                <div className="mt-2 p-2 bg-dark-panel rounded text-xs">
                  {file.category === 'code' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>Lines: <span className="text-cyber-green">{file.analysis.lines}</span></div>
                      <div>Functions: <span className="text-cyber-cyan">{file.analysis.functions}</span></div>
                      <div>Complexity: <span className="text-cyber-yellow">{file.analysis.complexity}/10</span></div>
                      <div>Readability: <span className="text-cyber-purple">{file.analysis.readability}/10</span></div>
                    </div>
                  )}
                </div>
              )}

              {/* OCR Results */}
              {file.ocrText && (
                <div className="mt-2 p-2 bg-dark-panel rounded">
                  <div className="text-xs font-orbitron text-cyber-cyan mb-1">OCR Extracted Text:</div>
                  <div className="text-xs text-gray-300 italic">"{file.ocrText}"</div>
                </div>
              )}

              {/* Image Preview */}
              {file.preview && file.category === 'image' && (
                <div className="mt-2">
                  <img 
                    src={file.preview} 
                    alt={file.name}
                    className="max-w-full h-20 object-cover rounded border border-cyber-cyan/30"
                  />
                </div>
              )}

              {/* Error Display */}
              {file.status === 'error' && (
                <div className="mt-2 p-2 bg-cyber-red/20 rounded text-xs text-cyber-red">
                  Error: {file.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileManager;
