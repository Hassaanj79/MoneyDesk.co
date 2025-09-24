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
  userId: string;
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

  const loadNotes = () => {
    setLoading(true);
    try {
      // Load from localStorage
      const localNotes = JSON.parse(localStorage.getItem('financial-notes') || '[]');
      setNotes(localNotes.sort((a: FinancialNote, b: FinancialNote) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = (noteId: string) => {
    try {
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      localStorage.setItem('financial-notes', JSON.stringify(updatedNotes));
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const exportNote = (note: FinancialNote) => {
    try {
      const text = `${note.title}\n\n${note.content.summary}\n\nHighlights:\n${note.content.highlights.map(h => `• ${h}`).join('\n')}\n\nRecommendations:\n${note.content.recommendations.map(r => `• ${r.title}: ${r.description}`).join('\n')}\n\n"${note.content.quote}"`;
      
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Note exported');
    } catch (error) {
      console.error('Error exporting note:', error);
      toast.error('Failed to export note');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Financial Notes
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your saved AI financial summaries and insights
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden p-0 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8 px-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading notes...</p>
              </div>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 px-6">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No notes yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Save AI summaries as notes to view them here later.
              </p>
            </div>
          ) : (
            <div 
              className="h-full overflow-y-auto"
              style={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}
            >
              <div className="space-y-4 p-6">
                {notes.map((note) => (
                  <Card key={note.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{note.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(note.dateRange.from).toLocaleDateString()} - {new Date(note.dateRange.to).toLocaleDateString()}
                            <span className="text-xs text-muted-foreground">
                              • Saved {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportNote(note)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNote(note.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* Summary */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <h4 className="font-semibold text-sm">Summary</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {note.content.summary}
                        </p>
                      </div>

                      <Separator className="my-4" />

                      {/* Highlights */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <h4 className="font-semibold text-sm">Key Highlights</h4>
                        </div>
                        <div className="space-y-2">
                          {note.content.highlights.map((highlight, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {highlight}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* Recommendations */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-600" />
                          <h4 className="font-semibold text-sm">Recommendations</h4>
                        </div>
                        <div className="space-y-3">
                          {note.content.recommendations.map((rec, index) => (
                            <div key={index} className="border-l-2 border-l-yellow-500 pl-3">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-sm">{rec.title}</h5>
                                <Badge 
                                  variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {rec.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {rec.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* Quote */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Quote className="h-4 w-4 text-purple-600" />
                          <h4 className="font-semibold text-sm">Inspiration</h4>
                        </div>
                        <p className="text-sm italic text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          "{note.content.quote}"
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
