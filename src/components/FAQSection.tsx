import { useState } from 'react';

interface FaqItem {
    question: string;
    answer: string;
}

const ChevronIcon = ({ open }: { open: boolean }) => (
    <svg
        className={`w-5 h-5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
);

const FAQItem = ({ q, a }: { q: string; a: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-muted/50 transition-colors"
            >
                {q}
                <ChevronIcon open={isOpen} />
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
