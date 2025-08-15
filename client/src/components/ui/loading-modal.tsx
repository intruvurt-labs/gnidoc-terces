import { Dialog, DialogContent } from "@/components/ui/dialog";

interface LoadingModalProps {
  isOpen: boolean;
  progress?: number;
  status?: string;
}

export default function LoadingModal({ isOpen, progress = 0, status = "AI PROCESSING" }: LoadingModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="glass-morph border-cyber-green/30 max-w-md" data-testid="loading-modal">
        <div className="text-center p-6">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-cyber-green/20 border-t-cyber-green rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-brain text-cyber-green text-xl animate-pulse"></i>
            </div>
          </div>
          <h3 className="text-xl font-orbitron font-bold text-cyber-green mb-2" data-testid="text-loading-status">{status}</h3>
          <p className="text-gray-300 mb-4">Orchestrating multiple AI models...</p>
          <div className="bg-dark-card rounded-lg p-3">
            <div className="flex justify-between text-xs mb-2">
              <span>Progress</span>
              <span data-testid="text-progress">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-cyber-green to-cyber-cyan h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
                data-testid="progress-bar"
              ></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
