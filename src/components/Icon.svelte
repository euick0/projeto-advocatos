<script>
  export let name;
  export let size = 18;
  export let stroke = 1.6;
  export let fill = "none";
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 18 18"
  {fill}
  stroke="currentColor"
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  style="flex-shrink:0; display:inline-block; vertical-align:middle;"
>
  {#if name === "dashboard"}
    <rect x="2.5" y="2.5" width="5.5" height="6.5" rx="1.2" />
    <rect x="2.5" y="11" width="5.5" height="4.5" rx="1.2" />
    <rect x="10" y="2.5" width="5.5" height="4.5" rx="1.2" />
    <rect x="10" y="9" width="5.5" height="6.5" rx="1.2" />
  {:else if name === "clients"}
    <circle cx="9" cy="6.5" r="2.6" />
    <path d="M3.5 15.5c.6-2.7 2.9-4.4 5.5-4.4s4.9 1.7 5.5 4.4" />
  {:else if name === "monitor"}
    <circle cx="9" cy="9" r="6.2" />
    <path d="M9 5.4V9l2.4 1.4" />
  {:else if name === "rules"}
    <path d="M3.5 4.5h11M3.5 9h7M3.5 13.5h11" />
    <circle cx="13" cy="9" r="1.6" fill="currentColor" stroke="none" />
  {:else if name === "analysis"}
    <path d="M2.6 15.4h12.8" />
    <rect x="4" y="9" width="2.2" height="5" />
    <rect x="7.9" y="6" width="2.2" height="8" />
    <rect x="11.8" y="3.5" width="2.2" height="10.5" />
  {:else if name === "settings"}
    <circle cx="9" cy="9" r="2.2" />
    <path d="M9 1.8v1.8M9 14.4v1.8M14.4 9h1.8M1.8 9h1.8M13.1 4.9l1.3-1.3M3.6 14.4l1.3-1.3M13.1 13.1l1.3 1.3M3.6 3.6l1.3 1.3" />
  {:else if name === "folder"}
    <path d="M2.5 5.2c0-.8.6-1.4 1.4-1.4h2.8l1.4 1.6h6c.8 0 1.4.6 1.4 1.4v6.6c0 .8-.6 1.4-1.4 1.4H3.9c-.8 0-1.4-.6-1.4-1.4V5.2z" />
  {:else if name === "chevron"}
    <path d="M6.5 4.5L11 9l-4.5 4.5" />
  {:else if name === "chevron-down"}
    <path d="M4.5 6.5L9 11l4.5-4.5" />
  {:else if name === "search"}
    <circle cx="8" cy="8" r="4.5" />
    <path d="M11.4 11.4L14.5 14.5" />
  {:else if name === "pause"}
    <rect x="5" y="3.5" width="2.5" height="11" rx="0.6" fill="currentColor" stroke="none" />
    <rect x="10.5" y="3.5" width="2.5" height="11" rx="0.6" fill="currentColor" stroke="none" />
  {:else if name === "play"}
    <path d="M5.5 3.5L14 9 5.5 14.5z" fill="currentColor" />
  {:else if name === "plus"}
    <path d="M9 3.5v11M3.5 9h11" />
  {:else if name === "edit"}
    <path d="M3 15h3l8.4-8.4-3-3L3 12v3z" />
    <path d="M11.6 3.6l3 3" />
  {:else if name === "trash"}
    <path d="M3.6 5h10.8M7 5V3.4h4V5M5 5l.7 9.4c0 .6.5 1 1.1 1h4.4c.6 0 1.1-.4 1.1-1L13 5" />
  {:else if name === "drag"}
    <circle cx="7" cy="5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="11" cy="5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="7" cy="9" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="11" cy="9" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="7" cy="13" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="11" cy="13" r="0.9" fill="currentColor" stroke="none" />
  {:else if name === "calendar"}
    <rect x="2.5" y="3.6" width="13" height="11.4" rx="1.4" />
    <path d="M2.5 7h13M6 2.4v2.4M12 2.4v2.4" />
  {:else if name === "check"}
    <path d="M3.5 9.4l3.6 3.4L14.5 5.4" />
  {:else if name === "arrow"}
    <path d="M3.5 9h11M11 5.5L14.5 9 11 12.5" />
  {:else if name === "arrow-up"}
    <path d="M9 14.5V3.6M5 7.5L9 3.5l4 4" />
  {:else if name === "arrow-down"}
    <path d="M9 3.5v10.9M5 10.5L9 14.5l4-4" />
  {:else if name === "billing"}
    <rect x="3" y="2.5" width="12" height="13" rx="1.4" />
    <path d="M6 6h6M6 9h6M6 12h3.5" />
  {:else if name === "download"}
    <path d="M9 2.8v8.4M5.5 7.7L9 11.2l3.5-3.5" />
    <path d="M3.5 14.5h11" />
  {:else if name === "external"}
    <path d="M10 3.5h4.5V8" />
    <path d="M14.5 3.5L8 10" />
    <path d="M13 10.5v3a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3" />
  {:else if name === "db"}
    <ellipse cx="9" cy="4.4" rx="5.5" ry="2.2" />
    <path d="M3.5 4.4v9.2c0 1.2 2.5 2.2 5.5 2.2s5.5-1 5.5-2.2V4.4" />
    <path d="M3.5 9c0 1.2 2.5 2.2 5.5 2.2s5.5-1 5.5-2.2" />
  {/if}
</svg>
