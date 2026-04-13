import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItem {
    question: string;
    answer: string;
}

const FAQItem = ({ q, a }: { q: string; a: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-muted/50 transition-colors"
            >
                {q}
                {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </button>
            {isOpen && (
                <div className="p-4 pt-0 text-[var(--text-secondary)] text-sm leading-relaxed border-t border-border/50 bg-muted/20">
                    {a}
                </div>
            )}
        </div>
    );
};

export const FAQSection = ({ items }: { items: FaqItem[] }) => (
    <div className="container pb-12">
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
                {items.map((item, i) => (
                    <FAQItem key={i} q={item.question} a={item.answer} />
                ))}
            </div>
        </div>
    </div>
);
