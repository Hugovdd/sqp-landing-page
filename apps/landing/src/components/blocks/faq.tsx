import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
  heading?: string;
  subheading?: string;
  headerTag?: "h1" | "h2";
  className?: string;
}

export const FAQ = ({
  items,
  heading = "Frequently Asked Questions",
  subheading,
  headerTag = "h2",
  className,
}: FAQProps) => {
  const HeadingTag = headerTag;

  return (
    <section className={cn("py-28 lg:py-32", className)}>
      <div className="container max-w-3xl">
        <div className="mb-12 space-y-4 text-center">
          <HeadingTag className="text-2xl tracking-tight md:text-4xl lg:text-5xl">
            {heading}
          </HeadingTag>
          {subheading && (
            <p className="text-muted-foreground mx-auto max-w-md leading-snug">
              {subheading}
            </p>
          )}
        </div>

        <Accordion type="single" collapsible className="w-full">
          {items.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
