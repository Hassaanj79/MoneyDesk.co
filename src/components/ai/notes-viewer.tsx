"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Calendar, 
  Trash2, 
  Download,
  Lightbulb,
  Target,
  Quote,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface FinancialNote {
  id: string;
  title: string;
  content: {
    summary: string;
    highlights: string[];
    recommendations: {
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
    }[];
    quote: string;
  };
  dateRange: {
    from: string;
    to: string;
  };
  createdAt: string;
}

interface NotesViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotesViewer({ isOpen, onClose }: NotesViewerProps) {
  const [notes, setNotes] = useState<FinancialNote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      // Try to load from API first
      const response = await fetch('/api/financial-notes?limit=50');
      if (response.ok) {
        const apiNotes = await response.json();
        setNotes(apiNotes);
      } else {
        throw new Error('API failed');
      }
    } catch (error) {
      // Fallback to localStorage
      console.log('Loading notes from localStorage...');
      const localNotes = JSON.parse(localStorage.getItem('financial-notes') || '[]');
      setNotes(localNotes);
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      // Try to delete from API first
      const response = await fetch(`/api/financial-notes/${noteId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        toast.success('Note deleted successfully');
      } else {
        throw new Error('API delete failed');
      }
    } catch (error) {
      // Fallback to localStorage
      const localNotes = JSON.parse(localStorage.getItem('financial-notes') || '[]');
      const updatedNotes = localNotes.filter((note: FinancialNote) => note.id !== noteId);
      localStorage.setItem('financial-notes', JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
      toast.success('Note deleted from local storage');
    }
  };

  const downloadNote = (note: FinancialNote) => {
    const content = `Financial Analysis - ${note.title}

Date Range: ${new Date(note.dateRange.from).toLocaleDateString()} - ${new Date(note.dateRange.to).toLocaleDateString()}

Summary:
${note.content.summary}

Key Highlights:
${note.content.highlights.map(h => `• ${h}`).join('\n')}

Recommendations:
${note.content.recommendations.map(r => `• ${r.title}: ${r.description}`).join('\n')}

Inspiration: "${note.content.quote}"

Generated on: ${new Date(note.createdAt).toLocaleString()}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-analysis-${note.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Note downloaded successfully');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Financial Notes
              </CardTitle>
              <CardDescription>
                Your saved AI financial summaries and insights
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-0 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8 px-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading notes...</p>
              </div>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex items-center justify-center py-8 px-6">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No notes yet</h3>
                <p className="text-sm text-muted-foreground">
                  Save AI financial summaries to see them here
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              <div className="space-y-4">
                {notes.map((note) => (
                  <Card key={note.id} className="p-4">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{note.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(note.dateRange.from).toLocaleDateString()} - {new Date(note.dateRange.to).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadNote(note)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteNote(note.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Summary */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <h4 className="font-medium">Summary</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {note.content.summary}
                        </p>
                      </div>

                      {/* Highlights */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <h4 className="font-medium">Key Highlights</h4>
                        </div>
                        <div className="space-y-1">
                          {note.content.highlights.map((highlight, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">
                                {highlight}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-600" />
                          <h4 className="font-medium">Recommendations</h4>
                        </div>
                        <div className="space-y-2">
                          {note.content.recommendations.map((rec, index) => (
                            <div key={index} className="border-l-2 border-l-yellow-500 pl-3">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-sm">{rec.title}</h5>
                                <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                                  {rec.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {rec.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quote */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Quote className="h-4 w-4 text-purple-600" />
                          <h4 className="font-medium">Daily Inspiration</h4>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border-l-4 border-l-purple-500">
                          <p className="text-sm italic text-purple-800 dark:text-purple-200">
                            "{note.content.quote}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}