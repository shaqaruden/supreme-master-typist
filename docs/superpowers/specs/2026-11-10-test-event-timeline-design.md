# Current-test event timeline

Approved in chat: show an event timeline below finished results, with elapsed seconds on the horizontal axis, neutral completed-word markers and red × mistake markers. Hover, focus or select an event to see time and word; errors include expected and typed character. Corrections do not erase mistakes. Reset clears everything; no persistence or historical sessions.

## Approaches
An event timeline was selected over word-duration plotting because exact error timing is the goal. Use existing vanilla JavaScript and theme variables, with a small SVG and native buttons for accessible selection; no runtime dependency.

## Implementation calls
Record mistakes at input boundaries, not MutationObserver redraws. Use monotonic time from first character. Keep separate word and error lanes so the graph remains legible. Number word occurrences so repeated words can be distinguished. Render only at completion, including partial-word errors in timed tests.
