import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageSquare, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RESERVATIONS, ROOMS } from '@/data/frontDeskMock';
import { ROOM_TYPES } from '@/lib/roomTypes';
import { toast } from 'sonner';

type Msg = { role: 'user' | 'assistant'; content: string };

interface Props {
  onNavigate?: (tab: string) => void;
}

const SUGGESTIONS = [
  'Has Maria paid yet?',
  'How many king rooms available?',
  'Show me unpaid 3rd-party bookings',
  'Which rooms are out of order?',
];

export function FrontDeskChat({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hi — I have access to all reservations, rooms and folios. Ask me anything (e.g. "Did Maria pay?" or "Show vacant kings").' },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput('');
    const next = [...messages, { role: 'user' as const, content: q }];
    setMessages(next);
    setLoading(true);

    try {
      // Compact context — keep within token budget
      const ctx = {
        reservations: RESERVATIONS.map(r => ({
          conf: r.id, guest: r.guestName, room: r.roomNumber, type: r.typeCode,
          arr: r.arrival, dep: r.departure, status: r.status,
          payMethod: r.paymentMethod, payStatus: r.paymentStatus,
          balance: r.balance, source: r.source, vip: r.vip,
        })),
        rooms: ROOMS.map(r => ({ num: r.number, floor: r.floor, type: r.typeCode, status: r.status, note: r.note })),
        roomTypes: ROOM_TYPES,
      };

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/front-desk-chat`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next, context: ctx }),
      });

      if (resp.status === 429) { toast.error('Too many requests, slow down a moment.'); setLoading(false); return; }
      if (resp.status === 402) { toast.error('AI credits exhausted. Add funds in workspace settings.'); setLoading(false); return; }
      if (!resp.ok) throw new Error(`AI error ${resp.status}`);

      const data = await resp.json();
      const reply: string = data.reply ?? 'No response.';
      const navigateTo: string | undefined = data.navigateTo;

      setMessages(m => [...m, { role: 'assistant', content: reply }]);
      if (navigateTo && onNavigate) {
        onNavigate(navigateTo);
        toast.success(`Switched to ${navigateTo}`);
      }
    } catch (e) {
      console.error(e);
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry — I had trouble reaching the data service. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 p-0 shadow-lg z-50 bg-primary hover:bg-primary/90"
        aria-label="Open AI assistant"
      >
        <Sparkles className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[380px] h-[520px] flex flex-col shadow-2xl border-primary/30 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary/15 text-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">Front Desk AI</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Reservations · Rooms · Folios</div>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-2.5 bg-background/40">
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[85%] text-xs px-3 py-2 rounded-lg whitespace-pre-wrap leading-relaxed',
              m.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted text-foreground rounded-bl-sm'
            )}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted text-muted-foreground text-xs px-3 py-2 rounded-lg flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
            </div>
          </div>
        )}
        {messages.length <= 1 && !loading && (
          <div className="pt-2 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-1">Try asking</div>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="block w-full text-left text-xs px-2.5 py-1.5 rounded border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t border-border p-2 flex gap-1.5 bg-card">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about a guest, room, or payment…"
          disabled={loading}
          className="text-xs h-9"
        />
        <Button type="submit" size="icon" className="h-9 w-9" disabled={loading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </Card>
  );
}
