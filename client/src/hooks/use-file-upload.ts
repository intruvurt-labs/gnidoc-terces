import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  category: 'code' | 'image' | 'document' | 'data';
  content?: string;
  ocrText?: string;
  preview?: string;
  analysis?: {
    language?: string;
    complexity?: number;
    lines?: number;
    functions?: number;
    readability?: number;
  };
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

const FILE_CATEGORIES = {
  code: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.css', '.scss', '.sass', '.html', '.xml', '.json', '.yaml', '.yml', '.toml', '.ini', '.conf', '.sql', '.sh', '.bat', '.ps1', '.sol'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.ico'],
  document: ['.txt', '.md', '.pdf', '.doc', '.docx', '.rtf', '.odt'],
  data: ['.csv', '.json', '.xml', '.xlsx', '.xls', '.tsv', '.log']
};

const MAX_FILES = 20;
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const categorizeFile = (fileName: string): 'code' | 'image' | 'document' | 'data' => {
    const extension = '.' + fileName.split('.').pop()?.toLowerCase();
    
    for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
      if (extensions.includes(extension)) {
        return category as 'code' | 'image' | 'document' | 'data';
      }
    }
    return 'document';
  };

  const validateFiles = (newFiles: FileList): { valid: File[]; rejected: Array<{ file: File; reason: string }> } => {
    const valid: File[] = [];
    const rejected: Array<{ file: File; reason: string }> = [];
    
    const currentImageCount = files.filter(f => f.category === 'image').length;
    let newImageCount = 0;

    Array.from(newFiles).forEach(file => {
      // Check total file count
      if (files.length + valid.length >= MAX_FILES) {
        rejected.push({ file, reason: `Maximum ${MAX_FILES} files allowed` });
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        rejected.push({ file, reason: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` });
        return;
      }

      // Check image count
      const category = categorizeFile(file.name);
      if (category === 'image') {
        if (currentImageCount + newImageCount >= MAX_IMAGES) {
          rejected.push({ file, reason: `Maximum ${MAX_IMAGES} images allowed` });
          return;
        }
        newImageCount++;
      }

      // Check for duplicates
      if (files.some(f => f.name === file.name && f.size === file.size)) {
        rejected.push({ file, reason: 'File already uploaded' });
        return;
      }

      valid.push(file);
    });

    return { valid, rejected };
  };

  const performOCR = async (imageFile: File): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockOCRResults = [
          "This is sample text extracted from the image using OCR technology.",
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          "function exampleCode() { return 'Extracted code from image'; }",
          "Configuration settings: API_KEY=abc123, PORT=3000",
          "User interface mockup with buttons and forms detected."
        ];
        const name = imageFile.name || "image";
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i) | 0;
        const idx = Math.abs(hash) % mockOCRResults.length;
        resolve(mockOCRResults[idx]);
      }, 2000);
    });
  };

  const analyzeFile = async (file: UploadedFile): Promise<UploadedFile['analysis']> => {
    if (file.category === 'code' && file.content) {
      const lines = file.content.split('\n').length;
      const functions = (file.content.match(/function|def |class |const |let |var /g) || []).length;
      const complexity = Math.min(10, Math.max(1, functions * 2 + lines / 100));
      const readability = Math.max(1, 10 - (file.content.length / 1000));

      return {
        language: detectLanguage(file.name),
        complexity: Math.round(complexity),
        lines,
        functions,
        readability: Math.round(readability)
      };
    }
    return undefined;
  };

  const detectLanguage = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'jsx': 'React JSX',
      'tsx': 'React TSX',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'php': 'PHP',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'css': 'CSS',
      'html': 'HTML',
      'sql': 'SQL',
      'json': 'JSON',
      'sol': 'Solidity'
    };
    return languageMap[extension || ''] || 'Unknown';
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File): Promise<UploadedFile> => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? `file_${crypto.randomUUID()}` : `file_${Date.now()}_${(performance.now()|0).toString(36)}`;
    const category = categorizeFile(file.name);
    
    let uploadedFile: UploadedFile = {
      id,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      category,
      uploadProgress: 0,
      status: 'uploading'
    };

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 20) {
      uploadedFile.uploadProgress = progress;
      setFiles(prev => prev.map(f => f.id === id ? { ...f, uploadProgress: progress } : f));
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    uploadedFile.status = 'processing';
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'processing' } : f));

    try {
      // Read file content for text-based files
      if (category === 'code' || category === 'document') {
        uploadedFile.content = await readFileContent(file);
      }

      // Create preview for images
      if (category === 'image') {
        uploadedFile.preview = await createImagePreview(file);
        uploadedFile.ocrText = await performOCR(file);
      }

      // Analyze file
      uploadedFile.analysis = await analyzeFile(uploadedFile);
      uploadedFile.status = 'completed';

    } catch (error) {
      uploadedFile.status = 'error';
      uploadedFile.error = error instanceof Error ? error.message : 'Processing failed';
    }

    return uploadedFile;
  };

  const handleFileUpload = useCallback(async (fileList: FileList) => {
    const { valid, rejected } = validateFiles(fileList);

    // Show rejection messages
    rejected.forEach(({ file, reason }) => {
      toast({
        title: "File Rejected",
        description: `${file.name}: ${reason}`,
        variant: "destructive"
      });
    });

    if (valid.length === 0) return;

    // Add files to state immediately
    const newFiles: UploadedFile[] = valid.map(file => ({
      id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? `file_${crypto.randomUUID()}` : `file_${Date.now()}_${(performance.now()|0).toString(36)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      category: categorizeFile(file.name),
      uploadProgress: 0,
      status: 'pending' as const
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Process files one by one
    for (const newFile of newFiles) {
      try {
        const processedFile = await processFile(newFile.file);
        setFiles(prev => prev.map(f => f.id === newFile.id ? processedFile : f));
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === newFile.id 
            ? { ...f, status: 'error', error: 'Processing failed' }
            : f
        ));
      }
    }

    toast({
      title: "Files Uploaded",
      description: `Successfully processed ${valid.length} file(s)`,
    });
  }, [files, toast]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const getFileStats = () => {
    const byCategory = files.reduce((acc, file) => {
      acc[file.category] = (acc[file.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: files.length,
      completed: files.filter(f => f.status === 'completed').length,
      processing: files.filter(f => f.status === 'processing' || f.status === 'uploading').length,
      errors: files.filter(f => f.status === 'error').length,
      byCategory,
      canUploadMore: files.length < MAX_FILES,
      canUploadImages: (byCategory.image || 0) < MAX_IMAGES
    };
  };

  return {
    files,
    isDragging,
    setIsDragging,
    handleFileUpload,
    removeFile,
    clearAllFiles,
    getFileStats,
    limits: { maxFiles: MAX_FILES, maxImages: MAX_IMAGES, maxFileSize: MAX_FILE_SIZE }
  };
}
