<script>
  export let data = [];
  export let height = 220;
  export let valueKey = "valor";
  export let labelKey = "label";

  $: max = Math.max(...data.map((d) => d[valueKey]));
  $: niceMax = Math.ceil(max / 1000) * 1000;
  $: yTicks = [0, niceMax / 4, niceMax / 2, (niceMax * 3) / 4, niceMax];
  $: chartH = height - 40;
</script>

<div style="display:flex; padding:8px 18px 18px;">
  <div style="display:flex; flex-direction:column; justify-content:space-between; width:56px; height:{chartH}px; padding-right:10px; font-size:10px; color:var(--text-3); text-align:right; font-family:var(--font-mono); font-variant-numeric:tabular-nums;">
    {#each [...yTicks].reverse() as t}
      <div style="line-height:1;">{(t / 1000).toFixed(1)}k €</div>
    {/each}
  </div>
  <div style="flex:1; position:relative; height:{chartH}px; border-left:1px solid var(--border);">
    {#each yTicks as t}
      <div style="position:absolute; left:0; right:0; bottom:{(t / niceMax) * chartH}px; border-top:1px dashed oklch(0.93 0.005 100);"></div>
    {/each}
    <div style="position:absolute; inset:0; display:flex; align-items:flex-end; gap:10px; padding:0 14px;">
      {#each data as d, i}
        {@const h = (d[valueKey] / niceMax) * chartH}
        {@const isLast = i === data.length - 1}
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; height:100%;">
          <div style="flex:1;"></div>
          <div style="width:100%; max-width:36px; height:{h}px; border-radius:4px 4px 0 0; background:{isLast ? 'var(--accent)' : 'oklch(0.78 0.04 250)'}; border:1px solid {isLast ? 'var(--accent)' : 'oklch(0.7 0.05 250)'}; position:relative;">
            <div class="mono num" style="position:absolute; left:50%; top:-18px; transform:translateX(-50%); font-size:10px; color:{isLast ? 'var(--accent)' : 'var(--text-2)'}; font-weight:600; white-space:nowrap;">
              {(d[valueKey] / 1000).toFixed(1)}k
            </div>
          </div>
        </div>
      {/each}
    </div>
    <div style="position:absolute; left:0; right:0; top:{chartH + 8}px; display:flex; gap:10px; padding:0 14px;">
      {#each data as d}
        <div style="flex:1; text-align:center; font-size:10px; color:var(--text-3); font-family:var(--font-mono); font-variant-numeric:tabular-nums;">
          {d[labelKey]}
        </div>
      {/each}
    </div>
  </div>
</div>
