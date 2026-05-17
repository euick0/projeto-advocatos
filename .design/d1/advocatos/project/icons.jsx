// Stroke icons — 18px viewBox, currentColor
const Icon = ({ d, size = 18, stroke = 1.6, fill = "none", style = {}, children }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
    {children || <path d={d} />}
  </svg>
);

const IconDashboard = (p) => (<Icon {...p}><rect x="2.5" y="2.5" width="5.5" height="6.5" rx="1.2"/><rect x="2.5" y="11" width="5.5" height="4.5" rx="1.2"/><rect x="10" y="2.5" width="5.5" height="4.5" rx="1.2"/><rect x="10" y="9" width="5.5" height="6.5" rx="1.2"/></Icon>);
const IconClients = (p) => (<Icon {...p}><circle cx="9" cy="6.5" r="2.6"/><path d="M3.5 15.5c.6-2.7 2.9-4.4 5.5-4.4s4.9 1.7 5.5 4.4"/></Icon>);
const IconMonitor = (p) => (<Icon {...p}><circle cx="9" cy="9" r="6.2"/><path d="M9 5.4V9l2.4 1.4"/></Icon>);
const IconRules = (p) => (<Icon {...p}><path d="M3.5 4.5h11M3.5 9h7M3.5 13.5h11"/><circle cx="13" cy="9" r="1.6" fill="currentColor" stroke="none"/></Icon>);
const IconAnalysis = (p) => (<Icon {...p}><path d="M2.6 15.4h12.8"/><rect x="4" y="9" width="2.2" height="5"/><rect x="7.9" y="6" width="2.2" height="8"/><rect x="11.8" y="3.5" width="2.2" height="10.5"/></Icon>);
const IconSettings = (p) => (<Icon {...p}><circle cx="9" cy="9" r="2.2"/><path d="M9 1.8v1.8M9 14.4v1.8M14.4 9h1.8M1.8 9h1.8M13.1 4.9l1.3-1.3M3.6 14.4l1.3-1.3M13.1 13.1l1.3 1.3M3.6 3.6l1.3 1.3"/></Icon>);
const IconFolder = (p) => (<Icon {...p}><path d="M2.5 5.2c0-.8.6-1.4 1.4-1.4h2.8l1.4 1.6h6c.8 0 1.4.6 1.4 1.4v6.6c0 .8-.6 1.4-1.4 1.4H3.9c-.8 0-1.4-.6-1.4-1.4V5.2z"/></Icon>);
const IconChevron = (p) => (<Icon {...p}><path d="M6.5 4.5L11 9l-4.5 4.5"/></Icon>);
const IconChevronDown = (p) => (<Icon {...p}><path d="M4.5 6.5L9 11l4.5-4.5"/></Icon>);
const IconSearch = (p) => (<Icon {...p}><circle cx="8" cy="8" r="4.5"/><path d="M11.4 11.4L14.5 14.5"/></Icon>);
const IconPause = (p) => (<Icon {...p}><rect x="5" y="3.5" width="2.5" height="11" rx="0.6" fill="currentColor" stroke="none"/><rect x="10.5" y="3.5" width="2.5" height="11" rx="0.6" fill="currentColor" stroke="none"/></Icon>);
const IconPlay = (p) => (<Icon {...p}><path d="M5.5 3.5L14 9 5.5 14.5z" fill="currentColor"/></Icon>);
const IconPlus = (p) => (<Icon {...p}><path d="M9 3.5v11M3.5 9h11"/></Icon>);
const IconEdit = (p) => (<Icon {...p}><path d="M3 15h3l8.4-8.4-3-3L3 12v3z"/><path d="M11.6 3.6l3 3"/></Icon>);
const IconTrash = (p) => (<Icon {...p}><path d="M3.6 5h10.8M7 5V3.4h4V5M5 5l.7 9.4c0 .6.5 1 1.1 1h4.4c.6 0 1.1-.4 1.1-1L13 5"/></Icon>);
const IconDrag = (p) => (<Icon {...p}><circle cx="7" cy="5" r="0.9" fill="currentColor" stroke="none"/><circle cx="11" cy="5" r="0.9" fill="currentColor" stroke="none"/><circle cx="7" cy="9" r="0.9" fill="currentColor" stroke="none"/><circle cx="11" cy="9" r="0.9" fill="currentColor" stroke="none"/><circle cx="7" cy="13" r="0.9" fill="currentColor" stroke="none"/><circle cx="11" cy="13" r="0.9" fill="currentColor" stroke="none"/></Icon>);
const IconCalendar = (p) => (<Icon {...p}><rect x="2.5" y="3.6" width="13" height="11.4" rx="1.4"/><path d="M2.5 7h13M6 2.4v2.4M12 2.4v2.4"/></Icon>);
const IconCheck = (p) => (<Icon {...p}><path d="M3.5 9.4l3.6 3.4L14.5 5.4"/></Icon>);
const IconArrow = (p) => (<Icon {...p}><path d="M3.5 9h11M11 5.5L14.5 9 11 12.5"/></Icon>);
const IconArrowUp = (p) => (<Icon {...p}><path d="M9 14.5V3.6M5 7.5L9 3.5l4 4"/></Icon>);
const IconArrowDown = (p) => (<Icon {...p}><path d="M9 3.5v10.9M5 10.5L9 14.5l4-4"/></Icon>);
const IconBilling = (p) => (<Icon {...p}><path d="M3.5 3.4h11v11.2l-2.2-1.1-2.2 1.1-2.1-1.1-2.2 1.1-2.3-1.1z"/><path d="M6 7.5h6M6 10.4h4.5"/></Icon>);
const IconDb = (p) => (<Icon {...p}><ellipse cx="9" cy="4.2" rx="5.4" ry="1.8"/><path d="M3.6 4.2v9.6c0 1 2.4 1.8 5.4 1.8s5.4-.8 5.4-1.8V4.2"/><path d="M3.6 9c0 1 2.4 1.8 5.4 1.8s5.4-.8 5.4-1.8"/></Icon>);
const IconDownload = (p) => (<Icon {...p}><path d="M9 2.6v8.8M5 7.5L9 11.4l4-3.9M3.5 14.4h11"/></Icon>);
const IconExternal = (p) => (<Icon {...p}><path d="M7.5 3.5H3.5v11h11v-4M9 9l5.5-5.5M10.5 3.5h4v4"/></Icon>);

Object.assign(window, {
  Icon, IconDashboard, IconClients, IconMonitor, IconRules, IconAnalysis, IconSettings,
  IconFolder, IconChevron, IconChevronDown, IconSearch, IconPause, IconPlay, IconPlus,
  IconEdit, IconTrash, IconDrag, IconCalendar, IconCheck, IconArrow, IconArrowUp, IconArrowDown,
  IconBilling, IconDb, IconDownload, IconExternal,
});
