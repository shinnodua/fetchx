import type { ReactNode } from 'react';
import { useId } from 'react';
import { Button } from '../../../../components';
import { cn } from '../../../../utils/cn';
import { useRequestPanelResize } from '../../hooks/useRequestPanelResize';

interface RequestResponseSplitProps {
  request: ReactNode;
  response: ReactNode;
}

export function RequestResponseSplit({
  request,
  response,
}: RequestResponseSplitProps) {
  const split = useRequestPanelResize();
  const instructionsId = useId();
  const requestId = useId();
  const { sideBySide, ratio, minRatio, maxRatio } = split.layout;
  const percent = Math.round(ratio * 100);
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1">
      <div className={sideBySide ? 'flex justify-end' : 'hidden'}>
        <Button
          ref={split.resetRef}
          variant="ghost"
          size="sm"
          type="button"
          onClick={split.reset}
        >
          Reset panel widths
        </Button>
      </div>
      <p id={instructionsId} className="sr-only">
        Drag to resize. Use Left and Right Arrow to adjust by 2 percent, or
        Shift and Arrow by 10 percent. Home and End reach the limits. Press
        Enter to reset panel widths.
      </p>
      <div
        ref={split.containerRef}
        className={cn('grid min-h-0 min-w-0 flex-1', !sideBySide && 'gap-4')}
        style={{
          gridTemplateColumns: sideBySide
            ? `minmax(0, ${ratio}fr) 24px minmax(0, ${1 - ratio}fr)`
            : 'minmax(0, 1fr)',
        }}
      >
        <section
          ref={split.requestRegionRef}
          id={requestId}
          aria-label="Request settings"
          tabIndex={-1}
          className="flex min-h-0 min-w-0 flex-col rounded-2xl focus-visible:outline-2 focus-visible:outline-primary-500"
        >
          {request}
        </section>
        {/* biome-ignore lint/a11y/useSemanticElements: Interactive separator contains a grip; a static hr cannot contain it. */}
        <div
          ref={split.dividerRef}
          role="separator"
          aria-label="Request and response panel widths"
          aria-orientation="vertical"
          aria-controls={requestId}
          aria-describedby={instructionsId}
          aria-valuemin={minRatio * 100}
          aria-valuemax={maxRatio * 100}
          aria-valuenow={ratio * 100}
          aria-valuetext={`Request ${percent}%, response ${100 - percent}%`}
          tabIndex={sideBySide ? 0 : -1}
          title="Drag to resize. Arrow keys adjust; Enter resets."
          onPointerDown={split.onPointerDown}
          onKeyDown={split.onKeyDown}
          className={cn(
            sideBySide ? 'group relative flex' : 'hidden',
            'touch-none cursor-col-resize select-none items-center justify-center rounded-lg outline-none hover:bg-primary-500/5 focus-visible:ring-2 focus-visible:ring-primary-500',
            split.isDragging && 'bg-primary-500/10',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-10 w-0.5 rounded-full bg-foreground/20 transition-colors group-hover:bg-primary-500 group-focus-visible:bg-primary-500',
              split.isDragging && 'bg-primary-500',
            )}
          />
        </div>
        <div className="flex min-h-0 min-w-0 flex-col">{response}</div>
      </div>
    </div>
  );
}
