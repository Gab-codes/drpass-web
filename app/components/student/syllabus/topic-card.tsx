import type { SyllabusTopic } from "@/data/syllabus/syllabus.types";
import { Badge } from "@/components/ui/badge";

interface TopicCardProps {
  topic: SyllabusTopic;
}

export function TopicCard({ topic }: TopicCardProps) {
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-xl bg-card text-card-foreground shadow-sm">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {topic.name}
        </h3>
        {topic.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {topic.description}
          </p>
        )}
      </div>

      {topic.learningObjectives && topic.learningObjectives.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-foreground/80 uppercase tracking-wider">
            Learning Objectives
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground marker:text-primary/50">
            {topic.learningObjectives.map((objective, i) => (
              <li key={i}>{objective}</li>
            ))}
          </ul>
        </div>
      )}

      {topic.concepts && topic.concepts.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          <h4 className="text-sm font-medium text-foreground/80 uppercase tracking-wider">
            Key Concepts
          </h4>
          <div className="flex flex-wrap gap-2">
            {topic.concepts.map((concept) => (
              <Badge key={concept.id} variant="secondary" className="bg-secondary/50 text-secondary-foreground hover:bg-secondary/70">
                {concept.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
