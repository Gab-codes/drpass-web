import type { SyllabusTopic } from "@/types/syllabus";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface TopicListProps {
  topics: SyllabusTopic[];
}

export function TopicList({ topics }: TopicListProps) {
  if (!topics || topics.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground border border-dashed rounded-xl">
        No topics found for this subject.
      </div>
    );
  }

  return (
    <Accordion className="w-full flex flex-col border-y border-border divide-y divide-border">
      {topics.map((topic) => (
        <AccordionItem
          key={topic.id}
          value={topic.id}
          className="border-none"
        >
          <AccordionTrigger className="hover:no-underline py-5 group px-1">
            <div className="flex flex-col items-start text-left gap-1">
              <span className="font-medium text-base text-foreground tracking-tight group-hover:text-primary transition-colors">
                {topic.name}
              </span>
              {topic.children && topic.children.length > 0 && (
                <span className="text-xs font-medium text-muted-foreground">
                  {topic.children.length} subtopic{topic.children.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2 px-1">
            <div className="flex flex-col gap-6">
              {topic.description && (
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {topic.description}
                </p>
              )}

              {topic.learningObjectives && topic.learningObjectives.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-sm font-semibold text-foreground">
                    What you should be able to do
                  </h4>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {topic.learningObjectives.map((objective, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 block size-1.5 rounded-full bg-primary/40 shrink-0" />
                        <span className="leading-relaxed">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {topic.concepts && topic.concepts.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-sm font-semibold text-foreground">
                    Key concepts
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {topic.concepts.map((concept) => (
                      <Badge key={concept.id} variant="secondary" className="bg-secondary/40 text-secondary-foreground hover:bg-secondary/60 text-xs font-normal">
                        {concept.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {topic.children && topic.children.length > 0 && (
                <div className="mt-2 pl-4 border-l-2 border-border/60">
                  <TopicList topics={topic.children} />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
