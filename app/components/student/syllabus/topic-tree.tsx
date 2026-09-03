import type { SyllabusTopic } from "@/data/syllabus/syllabus.types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TopicCard } from "./topic-card";

interface TopicTreeProps {
  topics: SyllabusTopic[];
}

export function TopicTree({ topics }: TopicTreeProps) {
  if (!topics || topics.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No topics found.
      </div>
    );
  }

  return (
    <Accordion className="w-full space-y-4">
      {topics.map((topic) => (
        <AccordionItem
          key={topic.id}
          value={topic.id}
          className="border rounded-xl bg-card px-2 md:px-4 shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex flex-col items-start text-left gap-1">
              <span className="font-semibold text-base md:text-lg text-foreground tracking-tight">
                {topic.name}
              </span>
              {topic.children && topic.children.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider">
                  {topic.children.length} subtopic{topic.children.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 pt-1 flex flex-col gap-4">
            <TopicCard topic={topic} />
            {topic.children && topic.children.length > 0 && (
              <div className="pl-4 md:pl-6 border-l-2 border-border/50 ml-2 mt-4 space-y-4">
                <TopicTree topics={topic.children} />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
