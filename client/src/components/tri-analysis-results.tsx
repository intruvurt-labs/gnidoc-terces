import React from 'react';
import { type TriAnalysisResult } from '@/hooks/use-tri-analysis';
import { Button } from '@/components/ui/button';

interface TriAnalysisResultsProps {
  result: TriAnalysisResult;
  onClear?: () => void;
}

export function TriAnalysisResults({ result, onClear }: TriAnalysisResultsProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-cyber-green';
    if (score >= 6) return 'text-cyber-cyan';
    if (score >= 4) return 'text-cyber-yellow';
    return 'text-cyber-red';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-cyber-red bg-cyber-red/20';
      case 'high': return 'text-cyber-red bg-cyber-red/20';
      case 'medium': return 'text-cyber-yellow bg-cyber-yellow/20';
      case 'low': return 'text-cyber-cyan bg-cyber-cyan/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="glass-morph rounded-xl p-4 sm:p-6 smooth-transition animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-orbitron font-bold text-cyber-cyan">
          <i className="fas fa-chart-line mr-3"></i>
          Tri-Analysis Results
        </h3>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-xs text-gray-400">Overall Score</div>
            <div className={`text-2xl font-bold ${getScoreColor(result.recommendations.overallScore)}`}>
              {result.recommendations.overallScore}/10
            </div>
          </div>
          <Button onClick={onClear} variant="ghost" size="sm" className="text-gray-400">
            <i className="fas fa-times"></i>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Code Analysis */}
        <div className="bg-dark-card rounded-lg p-4">
          <h4 className="flex items-center text-lg font-orbitron text-cyber-green mb-3">
            <i className="fas fa-code mr-2"></i>
            Code Analysis
          </h4>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Total Lines:</span>
                <span className="text-white ml-2 font-bold">{result.codeAnalysis.totalLines.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400">Functions:</span>
                <span className="text-white ml-2 font-bold">{result.codeAnalysis.totalFunctions}</span>
              </div>
              <div>
                <span className="text-gray-400">Quality:</span>
                <span className={`ml-2 font-bold ${getScoreColor(result.codeAnalysis.qualityScore)}`}>
                  {result.codeAnalysis.qualityScore}/10
                </span>
              </div>
              <div>
                <span className="text-gray-400">Complexity:</span>
                <span className={`ml-2 font-bold ${getScoreColor(10 - result.codeAnalysis.complexity.average)}`}>
                  {result.codeAnalysis.complexity.average}/10
                </span>
              </div>
            </div>

            {/* Languages */}
            {Object.keys(result.codeAnalysis.languages).length > 0 && (
              <div>
                <div className="text-xs text-cyber-green mb-2 font-orbitron">LANGUAGES:</div>
                <div className="space-y-1">
                  {Object.entries(result.codeAnalysis.languages).map(([lang, count]) => (
                    <div key={lang} className="flex justify-between text-xs">
                      <span className="text-gray-300">{lang}</span>
                      <span className="text-cyber-cyan">{count} files</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Issues */}
            {result.codeAnalysis.securityIssues.length > 0 && (
              <div>
                <div className="text-xs text-cyber-red mb-2 font-orbitron">SECURITY ISSUES:</div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {result.codeAnalysis.securityIssues.map((issue, index) => (
                    <div key={index} className={`text-xs p-2 rounded ${getSeverityColor(issue.severity)}`}>
                      <div className="font-bold">{issue.file}</div>
                      <div>{issue.issue}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Analysis */}
        <div className="bg-dark-card rounded-lg p-4">
          <h4 className="flex items-center text-lg font-orbitron text-cyber-purple mb-3">
            <i className="fas fa-file-alt mr-2"></i>
            Content Analysis
          </h4>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Total Words:</span>
                <span className="text-white ml-2 font-bold">{result.contentAnalysis.totalWords.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400">Readability:</span>
                <span className={`ml-2 font-bold ${getScoreColor(result.contentAnalysis.readabilityScore)}`}>
                  {result.contentAnalysis.readabilityScore}/10
                </span>
              </div>
              <div>
                <span className="text-gray-400">Sentiment:</span>
                <span className={`ml-2 font-bold capitalize ${
                  result.contentAnalysis.sentiment === 'positive' ? 'text-cyber-green' :
                  result.contentAnalysis.sentiment === 'negative' ? 'text-cyber-red' :
                  'text-cyber-cyan'
                }`}>
                  {result.contentAnalysis.sentiment}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Topics:</span>
                <span className="text-white ml-2 font-bold">{result.contentAnalysis.topics.length}</span>
              </div>
            </div>

            {/* Topics */}
            {result.contentAnalysis.topics.length > 0 && (
              <div>
                <div className="text-xs text-cyber-purple mb-2 font-orbitron">TOPICS:</div>
                <div className="flex flex-wrap gap-1">
                  {result.contentAnalysis.topics.slice(0, 5).map((topic, index) => (
                    <span key={index} className="text-xs bg-cyber-purple/20 text-cyber-purple px-2 py-1 rounded">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key Phrases */}
            {result.contentAnalysis.keyPhrases.length > 0 && (
              <div>
                <div className="text-xs text-cyber-purple mb-2 font-orbitron">KEY PHRASES:</div>
                <div className="text-xs text-gray-300 space-y-1">
                  {result.contentAnalysis.keyPhrases.slice(0, 5).map((phrase, index) => (
                    <div key={index} className="truncate">• {phrase}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Analysis */}
        <div className="bg-dark-card rounded-lg p-4">
          <h4 className="flex items-center text-lg font-orbitron text-cyber-cyan mb-3">
            <i className="fas fa-image mr-2"></i>
            Image Analysis
          </h4>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Total Images:</span>
                <span className="text-white ml-2 font-bold">{result.imageAnalysis.totalImages}</span>
              </div>
              <div>
                <span className="text-gray-400">OCR Results:</span>
                <span className="text-white ml-2 font-bold">{result.imageAnalysis.ocrResults.length}</span>
              </div>
              <div>
                <span className="text-gray-400">UI Elements:</span>
                <span className="text-cyber-cyan ml-2 font-bold">{result.imageAnalysis.detectedElements.ui}</span>
              </div>
              <div>
                <span className="text-gray-400">Text Detected:</span>
                <span className="text-cyber-green ml-2 font-bold">{result.imageAnalysis.detectedElements.text}</span>
              </div>
            </div>

            {/* Design Patterns */}
            {result.imageAnalysis.designPatterns.length > 0 && (
              <div>
                <div className="text-xs text-cyber-cyan mb-2 font-orbitron">DESIGN PATTERNS:</div>
                <div className="space-y-1">
                  {result.imageAnalysis.designPatterns.map((pattern, index) => (
                    <div key={index} className="text-xs text-gray-300">• {pattern}</div>
                  ))}
                </div>
              </div>
            )}

            {/* OCR Confidence */}
            {result.imageAnalysis.ocrResults.length > 0 && (
              <div>
                <div className="text-xs text-cyber-cyan mb-2 font-orbitron">OCR CONFIDENCE:</div>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {result.imageAnalysis.ocrResults.map((ocr, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-300 truncate mr-2">{ocr.filename}</span>
                      <span className={`font-bold ${
                        ocr.confidence > 0.8 ? 'text-cyber-green' :
                        ocr.confidence > 0.6 ? 'text-cyber-yellow' :
                        'text-cyber-red'
                      }`}>
                        {Math.round(ocr.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-card rounded-lg p-4">
          <h4 className="flex items-center text-lg font-orbitron text-cyber-yellow mb-3">
            <i className="fas fa-lightbulb mr-2"></i>
            Recommendations
          </h4>
          
          <div className="space-y-4">
            {result.recommendations.codeRecommendations.length > 0 && (
              <div>
                <div className="text-xs text-cyber-green mb-2 font-orbitron">CODE:</div>
                <ul className="text-xs text-gray-300 space-y-1">
                  {result.recommendations.codeRecommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.recommendations.contentRecommendations.length > 0 && (
              <div>
                <div className="text-xs text-cyber-purple mb-2 font-orbitron">CONTENT:</div>
                <ul className="text-xs text-gray-300 space-y-1">
                  {result.recommendations.contentRecommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.recommendations.imageRecommendations.length > 0 && (
              <div>
                <div className="text-xs text-cyber-cyan mb-2 font-orbitron">IMAGES:</div>
                <ul className="text-xs text-gray-300 space-y-1">
                  {result.recommendations.imageRecommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="bg-dark-card rounded-lg p-4">
          <h4 className="flex items-center text-lg font-orbitron text-cyber-green mb-3">
            <i className="fas fa-tasks mr-2"></i>
            Next Actions
          </h4>
          
          <div className="space-y-2">
            {result.recommendations.nextActions.map((action, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-dark-panel rounded">
                <div className="w-6 h-6 rounded-full bg-cyber-green/20 flex items-center justify-center">
                  <span className="text-cyber-green text-xs font-bold">{index + 1}</span>
                </div>
                <span className="text-sm text-gray-300">{action}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-cyber-green/10 rounded border border-cyber-green/30">
            <div className="text-xs text-cyber-green mb-1 font-orbitron">ANALYSIS SUMMARY:</div>
            <div className="text-sm text-white">
              Analyzed {result.fileCount} files with an overall quality score of{' '}
              <span className={`font-bold ${getScoreColor(result.recommendations.overallScore)}`}>
                {result.recommendations.overallScore}/10
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Generated on {result.timestamp.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TriAnalysisResults;
