import type { Stop } from "../../app/state/types";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  stops: Stop[];
  onReorder: (activeId: string, overId: string) => void;
  onRemove: (id: string) => void;
  nextStopIndex?: number;
};

function StopRow({
  stop,
  index,
  onRemove,
  isNext,
  isCompleted,
}: {
  stop: Stop;
  index: number;
  onRemove: (id: string) => void;
  isNext: boolean;
  isCompleted: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const rowClass = [
    "flex items-start gap-3 rounded-lg border bg-white p-3 shadow-sm select-none transition",
    isDragging ? "opacity-70 ring-2 ring-blue-500" : "",
    isNext ? "border-blue-600 border-dashed ring-2 ring-blue-100" : "",
    isCompleted && !isNext ? "border-gray-300 bg-gray-50" : "",
    !isCompleted && !isNext ? "border-gray-200" : "",
  ].join(" ");

  const badgeClass = [
    "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white",
    isNext ? "bg-blue-600" : isCompleted ? "bg-gray-700" : "bg-blue-600",
  ].join(" ");

  return (
    <li ref={setNodeRef} style={style} {...attributes} className={rowClass}>
      {/* number bubble */}
      <div className={badgeClass}>{index + 1}</div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium flex items-center gap-2">
          <span className="truncate">{stop.label}</span>

          {isNext && (
            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              Next
            </span>
          )}

          {isCompleted && !isNext && (
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
              Done
            </span>
          )}
        </div>

        <div className="mt-1 text-xs text-gray-600">
          {stop.lngLat[1].toFixed(5)}, {stop.lngLat[0].toFixed(5)}
        </div>
        <div className="mt-1 text-[11px] text-gray-500">Source: {stop.source}</div>
      </div>

      {/* right actions */}
      <div className="flex items-center gap-2">
        {/* drag handle only */}
        <button
          type="button"
          {...listeners}
          className="cursor-grab rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 active:cursor-grabbing"
          aria-label="Drag stop"
          title="Drag"
        >
          ⠿
        </button>

        {/* delete */}
        <button
          type="button"
          onClick={() => onRemove(stop.id)}
          className="rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
          aria-label="Delete stop"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </li>
  );
}

export default function StopsList({ stops, onReorder, onRemove, nextStopIndex }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  }

  if (stops.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-gray-600">
        Click on the map to add your first stop.
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-gray-700">
        Stops ({stops.length})
      </h2>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {stops.map((stop, idx) => {
              const isNext = nextStopIndex === idx;
              const isCompleted =
                typeof nextStopIndex === "number" ? idx < nextStopIndex : false;

              return (
                <StopRow
                  key={stop.id}
                  stop={stop}
                  index={idx}
                  onRemove={onRemove}
                  isNext={isNext}
                  isCompleted={isCompleted}
                />
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
