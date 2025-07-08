
import { KanbanColumn as Column } from '@/types/crm';
import { LeadCard } from './LeadCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droppable, Draggable } from 'react-beautiful-dnd';

// Suprimir warning específico do react-beautiful-dnd sobre defaultProps
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('Support for defaultProps will be removed from memo components') && 
      args[0]?.includes?.('Connect(Droppable)')) {
    return;
  }
  originalError.apply(console, args);
};

interface KanbanColumnProps {
  column: Column;
  index: number;
}

export const KanbanColumn = ({ column, index }: KanbanColumnProps) => {
  return (
    <div className="flex-shrink-0 w-80 md:w-72">
      <Card className={`h-full ${column.color} border-2`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-700">
              {column.title}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {column.leads.length}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <Droppable droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`
                  min-h-[200px] transition-colors duration-200
                  ${snapshot.isDraggingOver ? 'bg-gray-50 rounded-lg' : ''}
                `}
              >
                {column.leads.map((lead, leadIndex) => (
                  <Draggable
                    key={lead.id}
                    draggableId={lead.id}
                    index={leadIndex}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={provided.draggableProps.style}
                      >
                        <LeadCard 
                          lead={lead} 
                          isDragging={snapshot.isDragging}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </CardContent>
      </Card>
    </div>
  );
};
