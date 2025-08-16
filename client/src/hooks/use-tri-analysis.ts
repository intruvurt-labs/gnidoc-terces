import { useState, useCallback } from 'react';
import { type UploadedFile } from './use-file-upload';

export interface TriAnalysisResult {
  id: string;
  timestamp: Date;
  fileCount: number;
  codeAnalysis: {
    totalLines: number;
    totalFunctions: number;
    languages: Record<string, number>;
    complexity: {
      average: number;
      highest: number;
      distribution: Record<string, number>;
    };
    qualityScore: number;
    suggestions: string[];
    securityIssues: Array<{
      file: string;
      issue: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
  };
  contentAnalysis: {
    totalWords: number;
    readabilityScore: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    topics: string[];
    keyPhrases: string[];
    documentTypes: Record<string, number>;
    insights: string[];
  };
  imageAnalysis: {
    totalImages: number;
    ocrResults: Array<{
      filename: string;
      extractedText: string;
      confidence: number;
    }>;
    detectedElements: {
      text: number;
      ui: number;
      diagrams: number;
      photos: number;
    };
    designPatterns: string[];
    colorSchemes: Array<{
      primary: string;
      secondary: string;
      accent: string;
    }>;
  };
  recommendations: {
    codeRecommendations: string[];
    contentRecommendations: string[];
    imageRecommendations: string[];
    overallScore: number;
    nextActions: string[];
  };
}

export function useTriAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<TriAnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const analyzeCode = useCallback((codeFiles: UploadedFile[]) => {
    const totalLines = codeFiles.reduce((sum, file) => sum + (file.analysis?.lines || 0), 0);
    const totalFunctions = codeFiles.reduce((sum, file) => sum + (file.analysis?.functions || 0), 0);
    
    const languages: Record<string, number> = {};
    const complexities: number[] = [];
    
    codeFiles.forEach(file => {
      if (file.analysis?.language) {
        languages[file.analysis.language] = (languages[file.analysis.language] || 0) + 1;
      }
      if (file.analysis?.complexity) {
        complexities.push(file.analysis.complexity);
      }
    });

    const averageComplexity = complexities.length > 0 
      ? complexities.reduce((sum, c) => sum + c, 0) / complexities.length 
      : 0;
    
    const highestComplexity = Math.max(...complexities, 0);
    
    const complexityDistribution: Record<string, number> = {
      'Low (1-3)': complexities.filter(c => c <= 3).length,
      'Medium (4-6)': complexities.filter(c => c > 3 && c <= 6).length,
      'High (7-10)': complexities.filter(c => c > 6).length,
    };

    const qualityScore = Math.max(1, Math.min(10, 
      10 - (averageComplexity / 2) + (totalFunctions > 0 ? 2 : 0)
    ));

    const suggestions = [
      totalLines > 1000 ? 'Consider breaking down large files for better maintainability' : '',
      averageComplexity > 7 ? 'High complexity detected - consider refactoring complex functions' : '',
      Object.keys(languages).length > 3 ? 'Multiple languages detected - ensure proper integration' : '',
      totalFunctions === 0 ? 'No functions detected - consider adding modular structure' : '',
    ].filter(Boolean);

    const securityIssues = codeFiles.flatMap(file => {
      const issues = [];
      if (file.content) {
        if (file.content.includes('password') || file.content.includes('api_key')) {
          issues.push({
            file: file.name,
            issue: 'Potential hardcoded credentials detected',
            severity: 'high' as const
          });
        }
        if (file.content.includes('eval(') || file.content.includes('innerHTML =')) {
          issues.push({
            file: file.name,
            issue: 'Potential security vulnerability detected',
            severity: 'medium' as const
          });
        }
      }
      return issues;
    });

    return {
      totalLines,
      totalFunctions,
      languages,
      complexity: {
        average: Math.round(averageComplexity * 10) / 10,
        highest: highestComplexity,
        distribution: complexityDistribution
      },
      qualityScore: Math.round(qualityScore * 10) / 10,
      suggestions,
      securityIssues
    };
  }, []);

  const analyzeContent = useCallback((contentFiles: UploadedFile[]) => {
    const allText = contentFiles
      .map(file => file.content || '')
      .join(' ');

    const totalWords = allText.split(/\s+/).filter(word => word.length > 0).length;

    // Simple readability calculation (Flesch-like)
    const sentences = allText.split(/[.!?]+/).length;
    const avgWordsPerSentence = totalWords / Math.max(sentences, 1);
    const readabilityScore = Math.max(1, Math.min(10, 
      10 - (avgWordsPerSentence - 15) / 3
    ));

    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'perfect', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'wrong', 'error'];
    const positiveCount = positiveWords.reduce((count, word) => 
      count + (allText.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0);
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (allText.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0);
    
    const sentiment = positiveCount > negativeCount ? 'positive' : 
                     negativeCount > positiveCount ? 'negative' : 'neutral';

    // Extract topics and key phrases
    const words = allText.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordFreq = words.reduce((freq: Record<string, number>, word) => {
      freq[word] = (freq[word] || 0) + 1;
      return freq;
    }, {});
    
    const keyPhrases = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    const topics = [
      ...new Set([
        ...keyPhrases.filter(phrase => 
          ['api', 'database', 'user', 'system', 'data', 'service'].includes(phrase)
        ),
        ...(allText.includes('react') || allText.includes('component') ? ['Frontend Development'] : []),
        ...(allText.includes('server') || allText.includes('backend') ? ['Backend Development'] : []),
        ...(allText.includes('design') || allText.includes('ui') ? ['UI/UX Design'] : []),
      ])
    ];

    const documentTypes: Record<string, number> = {};
    contentFiles.forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext) {
        documentTypes[ext] = (documentTypes[ext] || 0) + 1;
      }
    });

    const insights = [
      totalWords > 5000 ? 'Comprehensive documentation detected' : 'Consider expanding documentation',
      readabilityScore > 7 ? 'Good readability score' : 'Consider improving text clarity',
      topics.length > 3 ? 'Diverse topic coverage detected' : 'Consider broader topic coverage',
    ];

    return {
      totalWords,
      readabilityScore: Math.round(readabilityScore * 10) / 10,
      sentiment,
      topics,
      keyPhrases,
      documentTypes,
      insights
    };
  }, []);

  const analyzeImages = useCallback((imageFiles: UploadedFile[]) => {
    const ocrResults = imageFiles.map(file => ({
      filename: file.name,
      extractedText: file.ocrText || '',
      confidence: Math.random() * 0.3 + 0.7 // Simulate 70-100% confidence
    }));

    const allOcrText = ocrResults.map(r => r.extractedText).join(' ').toLowerCase();

    const detectedElements = {
      text: ocrResults.filter(r => r.extractedText.length > 10).length,
      ui: imageFiles.filter(f => 
        f.ocrText?.includes('button') || 
        f.ocrText?.includes('form') || 
        f.ocrText?.includes('menu')
      ).length,
      diagrams: imageFiles.filter(f => 
        f.ocrText?.includes('chart') || 
        f.ocrText?.includes('graph') || 
        f.ocrText?.includes('flow')
      ).length,
      photos: imageFiles.filter(f => 
        !f.ocrText || f.ocrText.length < 10
      ).length
    };

    const designPatterns = [
      ...new Set([
        ...(allOcrText.includes('dashboard') ? ['Dashboard Layout'] : []),
        ...(allOcrText.includes('card') ? ['Card Design'] : []),
        ...(allOcrText.includes('navigation') || allOcrText.includes('menu') ? ['Navigation'] : []),
        ...(allOcrText.includes('form') ? ['Form Design'] : []),
        ...(allOcrText.includes('grid') ? ['Grid Layout'] : []),
      ])
    ];

    // Simulate color scheme detection
    const colorSchemes = imageFiles.map((_, index) => ({
      primary: ['#00FF41', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726'][index % 5],
      secondary: ['#1A1A1A', '#2C3E50', '#34495E', '#7F8C8D', '#BDC3C7'][index % 5],
      accent: ['#00FFFF', '#FFD93D', '#6BCF7F', '#A8E6CF', '#FFB3BA'][index % 5]
    }));

    return {
      totalImages: imageFiles.length,
      ocrResults,
      detectedElements,
      designPatterns,
      colorSchemes
    };
  }, []);

  const performTriAnalysis = useCallback(async (files: UploadedFile[]) => {
    setIsAnalyzing(true);
    setProgress(0);
    
    const codeFiles = files.filter(f => f.category === 'code' && f.status === 'completed');
    const contentFiles = files.filter(f => 
      (f.category === 'document' || f.category === 'data') && f.status === 'completed'
    );
    const imageFiles = files.filter(f => f.category === 'image' && f.status === 'completed');

    try {
      // Step 1: Code Analysis
      setCurrentStep('Analyzing code structure and quality...');
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const codeAnalysis = analyzeCode(codeFiles);

      // Step 2: Content Analysis
      setCurrentStep('Analyzing content and documentation...');
      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const contentAnalysis = analyzeContent(contentFiles);

      // Step 3: Image Analysis
      setCurrentStep('Processing images and OCR results...');
      setProgress(80);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const imageAnalysis = analyzeImages(imageFiles);

      // Step 4: Generate Recommendations
      setCurrentStep('Generating recommendations...');
      setProgress(90);
      await new Promise(resolve => setTimeout(resolve, 500));

      const overallScore = Math.round(
        (codeAnalysis.qualityScore + contentAnalysis.readabilityScore + 
         (imageFiles.length > 0 ? 8 : 7)) / 3 * 10
      ) / 10;

      const codeRecommendations = [
        ...codeAnalysis.suggestions,
        codeAnalysis.securityIssues.length > 0 ? 'Address security vulnerabilities' : '',
        codeAnalysis.complexity.average > 6 ? 'Consider code refactoring for better maintainability' : ''
      ].filter(Boolean);

      const contentRecommendations = [
        ...contentAnalysis.insights,
        contentAnalysis.totalWords < 1000 ? 'Consider adding more comprehensive documentation' : '',
        contentAnalysis.keyPhrases.length < 5 ? 'Expand technical terminology usage' : ''
      ].filter(Boolean);

      const imageRecommendations = [
        imageFiles.length === 0 ? 'Consider adding visual documentation or mockups' : '',
        imageAnalysis.ocrResults.some(r => r.confidence < 0.8) ? 'Some images have low OCR confidence - consider higher quality images' : '',
        imageAnalysis.designPatterns.length === 0 ? 'No clear design patterns detected in images' : ''
      ].filter(Boolean);

      const nextActions = [
        'Review code quality suggestions',
        'Implement security fixes if any',
        'Enhance documentation based on content analysis',
        'Consider design consistency improvements',
        'Plan next development iteration'
      ];

      const result: TriAnalysisResult = {
        id: `analysis_${Date.now()}`,
        timestamp: new Date(),
        fileCount: files.length,
        codeAnalysis,
        contentAnalysis,
        imageAnalysis,
        recommendations: {
          codeRecommendations,
          contentRecommendations,
          imageRecommendations,
          overallScore,
          nextActions
        }
      };

      setProgress(100);
      setCurrentStep('Analysis complete!');
      setAnalysisResult(result);
      
      return result;
    } catch (error) {
      console.error('Tri-analysis failed:', error);
      throw error;
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false);
        setProgress(0);
        setCurrentStep('');
      }, 1000);
    }
  }, [analyzeCode, analyzeContent, analyzeImages]);

  return {
    isAnalyzing,
    analysisResult,
    progress,
    currentStep,
    performTriAnalysis,
    clearResults: () => setAnalysisResult(null)
  };
}
