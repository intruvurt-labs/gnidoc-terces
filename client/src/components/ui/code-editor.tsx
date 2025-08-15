import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, Maximize2 } from "lucide-react";

interface CodeEditorProps {
  code: string;
  language?: string;
  fileName?: string;
  onCopy?: () => void;
  onDownload?: () => void;
  className?: string;
}

export default function CodeEditor({ 
  code, 
  language = "javascript", 
  fileName = "generated-code",
  onCopy,
  onDownload,
  className = ""
}: CodeEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code copied!",
        description: "Code has been copied to clipboard",
      });
      onCopy?.();
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy code to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onDownload?.();
  };

  const getFileExtension = (lang: string): string => {
    const extensions: { [key: string]: string } = {
      javascript: 'js',
      typescript: 'ts',
      jsx: 'jsx',
      tsx: 'tsx',
      css: 'css',
      html: 'html',
      json: 'json',
      python: 'py',
    };
    return extensions[lang] || 'txt';
  };

  const highlightCode = (code: string) => {
    // Simple syntax highlighting for display purposes
    return code
      .replace(/(import|export|const|let|var|function|class|interface|type)/g, '<span class="text-cyber-cyan">$1</span>')
      .replace(/(true|false|null|undefined)/g, '<span class="text-cyber-purple">$1</span>')
      .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="text-yellow-400">$1</span>')
      .replace(/(\/\/.*$)/gm, '<span class="text-gray-400">$1</span>')
      .replace(/(\{|\}|\[|\]|\(|\))/g, '<span class="text-gray-500">$1</span>');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-3 right-3 flex space-x-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-cyber-green hover:text-cyber-cyan transition-colors h-8 w-8 p-0"
          title="Copy Code"
          data-testid="button-copy-code"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="text-cyber-green hover:text-cyber-cyan transition-colors h-8 w-8 p-0"
          title="Download"
          data-testid="button-download-code"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-cyber-green hover:text-cyber-cyan transition-colors h-8 w-8 p-0"
          title="Expand"
          data-testid="button-expand-code"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
      
      <pre className={`bg-dark-card border border-cyber-green/30 rounded-lg p-4 text-sm font-fira overflow-x-auto ${
        isExpanded ? 'max-h-screen' : 'max-h-96'
      } overflow-y-auto`}>
        <code 
          className="text-cyber-green"
          dangerouslySetInnerHTML={{ __html: highlightCode(code) }}
          data-testid="code-content"
        />
      </pre>
    </div>
  );
}
