
import { useEffect, useState } from 'react';

export interface CodingQuestion {
  id: number;
  slug: string;
  title: string;
  difficulty: string;
  content: string;
  solutions: {
    java?: string;
    python?: string;
    javascript?: string;
    'c++'?: string;
  };
}

export const useCodingQuestions = () => {
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Fetch questions from the JSON file
        const response = await fetch('/dataset_rows.json');
        
        if (!response.ok) {
          throw new Error('Failed to fetch coding questions');
        }
        
        const data = await response.json();
        
        // Transform the data into a more usable format
        const formattedQuestions = Array.isArray(data) 
          ? data.map((item) => {
              const row = item.row;
              return {
                id: row.id,
                slug: row.slug,
                title: row.title,
                difficulty: row.difficulty,
                content: row.content,
                solutions: {
                  java: row.java,
                  python: row.python,
                  javascript: row.javascript,
                  'c++': row['c++'],
                }
              };
            })
          : []; // If data is not an array, return empty array
        
        setQuestions(formattedQuestions);
      } catch (err) {
        console.error('Error loading coding questions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const getRandomQuestion = (): CodingQuestion | null => {
    if (questions.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  };

  const getQuestionBySlug = (slug: string): CodingQuestion | null => {
    return questions.find(q => q.slug === slug) || null;
  };

  const getQuestionById = (id: number): CodingQuestion | null => {
    return questions.find(q => q.id === id) || null;
  };

  return {
    questions,
    isLoading,
    error,
    getRandomQuestion,
    getQuestionBySlug,
    getQuestionById
  };
};

// Generate mock questions for other interview types (for development purposes)
export const getOOPQuestions = (): string[] => [
  "Explain the four main principles of OOP and provide examples of each.",
  "What is the difference between abstraction and encapsulation?",
  "Explain the concept of inheritance and its benefits. When might you avoid using inheritance?",
  "What is polymorphism and how does it improve code maintainability?",
  "Explain the SOLID principles of object-oriented design.",
  "What is the difference between an abstract class and an interface?",
  "Explain method overloading and method overriding with examples.",
  "What is the difference between composition and inheritance? When would you use one over the other?",
  "How does dependency injection work, and what are its benefits?",
  "Explain the singleton pattern. What are its advantages and disadvantages?"
];

export const getBehavioralQuestions = (): string[] => [
  "Tell me about a time when you had to deal with a challenging team situation.",
  "Describe a project where you had to learn a new technology quickly.",
  "Give me an example of a time when you had to meet a tight deadline.",
  "Tell me about a situation where you had to resolve a conflict with a coworker.",
  "Describe a time when you received critical feedback and how you responded to it.",
  "Tell me about your most challenging project and how you overcame the difficulties.",
  "Give an example of a time when you showed leadership qualities.",
  "Describe a situation where you had to make a difficult decision with limited information.",
  "Tell me about a time when you failed at something and what you learned from it.",
  "Give an example of how you've contributed to improving a process or system."
];

export const getSystemDesignQuestions = (): string[] => [
  "Design a URL shortening service like bit.ly.",
  "Design a social media feed that supports millions of users.",
  "Design a distributed file storage system like Dropbox.",
  "Design a scalable web crawler.",
  "Design a notification system for a social media platform.",
  "Design a ride-sharing service like Uber or Lyft.",
  "Design a video streaming platform like YouTube or Netflix.",
  "Design a real-time chat application that supports millions of users.",
  "Design an e-commerce product search functionality.",
  "Design a rate limiting system for an API gateway."
];
