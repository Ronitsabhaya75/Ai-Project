
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Delete, Copy, Save } from 'lucide-react';
import { toast } from 'sonner';

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  onRun?: (code: string) => void;
  readOnly?: boolean;
  height?: string;
  className?: string;
}

const CodeEditor = ({
  initialCode = '',
  language = 'javascript',
  onRun,
  readOnly = false,
  height = '400px',
  className = '',
}: CodeEditorProps) => {
  const [code, setCode] = useState(initialCode);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const codeRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
  };

  const handleRun = () => {
    if (onRun) {
      // Only run non-empty code
      if (code.trim()) {
        onRun(code);
      } else {
        toast.warning('Please write some code before running');
      }
    } else {
      toast.info('Code execution is simulated in this demo');
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the code?')) {
      setCode('');
      if (codeRef.current) {
        codeRef.current.focus();
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const handleSave = () => {
    // Simulate saving (in a real app, this would save to a database)
    localStorage.setItem('savedCode', code);
    toast.success('Code saved successfully');
  };

  const getLanguageClass = () => {
    switch (selectedLanguage) {
      case 'javascript':
        return 'language-javascript';
      case 'python':
        return 'language-python';
      case 'java':
        return 'language-java';
      case 'c++':
        return 'language-cpp';
      default:
        return 'language-javascript';
    }
  };

  return (
    <div className={`glass-panel flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-dark-lighter rounded-t-xl">
        <div className="flex items-center space-x-2">
          <Select
            value={selectedLanguage}
            onValueChange={handleLanguageChange}
            disabled={readOnly}
          >
            <SelectTrigger className="w-[180px] bg-transparent border-white/20 text-white">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="c++">C++</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleCopy}
          >
            <Copy size={16} />
          </Button>
          {!readOnly && (
            <>
              <Button 
                size="sm"
                variant="ghost" 
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleSave}
              >
                <Save size={16} />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-white/70 hover:text-red-400 hover:bg-white/10"
                onClick={handleClear}
              >
                <Delete size={16} />
              </Button>
              <Button 
                size="sm" 
                className="bg-radium text-black hover:bg-radium-light"
                onClick={handleRun}
              >
                <Play size={16} className="mr-1" /> Run
              </Button>
            </>
          )}
        </div>
      </div>
      <div 
        className="relative flex-grow bg-dark-lighter rounded-b-xl"
        style={{ height }}
      >
        <textarea
          ref={codeRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          readOnly={readOnly}
          className={`
            w-full h-full p-4 bg-transparent text-white font-mono text-sm 
            resize-none focus:outline-none focus:ring-0 border-0
            ${getLanguageClass()} code-editor
          `}
          spellCheck="false"
          placeholder={`Enter your ${selectedLanguage} code here...`}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
