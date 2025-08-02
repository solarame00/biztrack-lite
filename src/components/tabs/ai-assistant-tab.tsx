
"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Sparkles, Loader2, User } from "lucide-react";
import { askFinancialQuestion } from "@/ai/flows/financial-insights-flow";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback } from "../ui/avatar";

export function AiAssistantTab() {
  const { currentProjectId, transactions, currency } = useData();
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<{ type: 'user' | 'ai'; text: string }[]>([]);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    const userQuestion = question;
    setConversation(prev => [...prev, { type: 'user', text: userQuestion }]);
    setQuestion("");

    try {
      const sanitizedTransactions = transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        name: t.name,
        date: new Date(t.date).toISOString(),
        note: t.note || "",
      }));

      const response = await askFinancialQuestion({
        question: userQuestion,
        transactions: sanitizedTransactions,
        currency: currency,
      });

      setConversation(prev => [...prev, { type: 'ai', text: response }]);
    } catch (error) {
      console.error("Error calling AI flow:", error);
      const errorMessage = "Sorry, I encountered an error trying to answer your question. Please try again.";
      setConversation(prev => [...prev, { type: 'ai', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentProjectId) {
    return (
      <Card className="shadow-lg rounded-xl h-full">
        <CardHeader>
          <CardTitle className="text-2xl">AI Financial Assistant</CardTitle>
          <CardDescription>Select a project to ask questions about its finances.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Please select a project to use the AI Assistant.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-xl h-full flex flex-col transition-all hover:shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary"/>
            <CardTitle className="text-2xl">AI Financial Assistant</CardTitle>
        </div>
        <CardDescription>
          Ask questions about your project's finances in plain English.
          <br/>
          e.g., "What were my top 5 expenses last month?" or "Compare my income in May vs June."
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow gap-4">
        <ScrollArea className="flex-grow h-[400px] rounded-md border p-4 space-y-4">
            {conversation.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <Sparkles className="h-12 w-12 text-primary/50 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">Ready to help!</p>
                    <p className="text-sm text-muted-foreground">Ask me anything about your project's transaction history.</p>
                </div>
            )}
            {conversation.map((entry, index) => (
                <div key={index} className={`flex items-start gap-4 ${entry.type === 'user' ? 'justify-end' : ''}`}>
                    {entry.type === 'ai' && (
                        <Avatar className="h-8 w-8 bg-primary/20 text-primary">
                            <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                        </Avatar>
                    )}
                    <div className={`rounded-lg p-3 max-w-[80%] ${entry.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-sm whitespace-pre-wrap">{entry.text}</p>
                    </div>
                     {entry.type === 'user' && (
                        <Avatar className="h-8 w-8">
                            <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                        </Avatar>
                    )}
                </div>
            ))}
             {isLoading && (
                 <div className="flex items-start gap-4">
                     <Avatar className="h-8 w-8 bg-primary/20 text-primary">
                        <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                     <div className="rounded-lg p-3 bg-muted flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        <p className="text-sm text-muted-foreground">Thinking...</p>
                    </div>
                 </div>
            )}
        </ScrollArea>
        <div className="flex items-start gap-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="resize-none"
            onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAskQuestion();
                }
            }}
            disabled={isLoading}
          />
          <Button onClick={handleAskQuestion} disabled={isLoading || !question.trim()} className="h-full">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            <span className="sr-only">Ask</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
