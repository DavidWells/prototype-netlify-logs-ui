# Netlify Logs UI

Improvements to netlify logs


## User Stories

### Linkable Log lines

As a Netlify user, I'd like to be able to share direct links to log lines to assist in debugging my builds.

Solution in place:

- Clicking on a log line selects the row and updates the URL with the log line number creating a shareable link

### Multi line log links

As a Netlify user, I'd like to able to link to entire blocks of the build log to aid in faster debugging, sharing with support, and asking colleagues questions about different parts of our build process

Solution in place:

- By selecting a line, then holding shift and clicking another line, the range of rows will be selected and the URL hash will update to reflect the current rows selected.

### Easy line deselect

As a Netlify user, I'd like to easily deselect highlighted log lines.

Solution in place:

- Pressing the "esc" escape key will deselect any selected log lines & clear out the line numbers from the URL hash.

### Easy copy / paste

As a Netlify user, I'd like to easily select my log output without dragging to select text.

Solution in place:

- Click to copy button
- "command + A" to select all & right click copy
