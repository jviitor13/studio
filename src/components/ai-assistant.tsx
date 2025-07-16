
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Send, User, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { invokeAssistant } from '@/lib/actions';
import type { AssistantFlowOutput } from '@/ai/flows/assistant-flow';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  buttons?: { label: string; value: string }[];
}

const defaultMessages: Message[] = [
  {
    sender: 'bot',
    text: 'Olá! Bem-vindo(a) de volta ao RodoCheck. O que você gostaria de fazer hoje?',
    buttons: [
      { label: 'Checklist de Manutenção', value: 'Criar checklist de manutenção' },
      { label: 'Gestão de Pneus', value: 'Acessar gestão de pneus' },
      { label: 'Consultas', value: 'Realizar uma consulta' },
      { label: 'Relatórios', value: 'Gerar um relatório' },
    ],
  },
];

export function AIAssistant() {
  const router = useRouter();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = (action: AssistantFlowOutput['action'], payload?: string) => {
    if (!payload) return;

    if (action === 'navigate') {
      router.push(payload);
    } else if (action === 'link') {
      window.open(payload, '_blank');
    }
  };

  const sendMessage = async (query: string) => {
    if (!query.trim()) return;

    // Add user message to chat
    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await invokeAssistant({ query });

      if (result.success && result.data) {
        setMessages((prev) => [...prev, { sender: 'bot', text: result.data.response }]);
        handleAction(result.data.action, result.data.payload);
      } else {
        throw new Error(result.error || 'A IA não conseguiu responder.');
      }
    } catch (error) {
      console.error('Assistant error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
      toast({
        variant: 'destructive',
        title: 'Erro no Assistente',
        description: errorMessage,
      });
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Desculpe, não consigo responder no momento.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleButtonClick = (value: string) => {
    sendMessage(value);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Chat Messages */}
        <div className="space-y-4 h-auto max-h-64 overflow-y-auto pr-2">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
              {message.sender === 'bot' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`p-3 rounded-lg max-w-sm ${
                  message.sender === 'bot'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}>
                <p className="text-sm">{message.text}</p>
                 {message.buttons && (
                    <div className="mt-2 flex flex-col items-start gap-1">
                        {message.buttons.map((btn, btnIndex) => (
                            <Button
                                key={btnIndex}
                                variant="link"
                                size="sm"
                                className="p-0 h-auto text-primary hover:text-primary/80 underline"
                                onClick={() => handleButtonClick(btn.value)}
                            >
                                <ChevronRight className="h-4 w-4 mr-1" />
                                {btn.label}
                            </Button>
                        ))}
                    </div>
                )}
              </div>
              {message.sender === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3">
                 <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot />
                  </AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-lg bg-muted text-foreground">
                    <p className="text-sm animate-pulse">Digitando...</p>
                </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite aqui sua dúvida ou comando..."
            className="flex-1"
            disabled={isLoading}
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
