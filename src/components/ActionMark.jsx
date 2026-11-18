const strokes = {
  outward: 'M3 13 13 3M4 3h9v9',
  back: 'M13 13 3 3m0 9V3h9',
  down: 'M8 2v12m-5-5 5 5 5-5',
  turn: 'M3 4v5h5M3 9a5.2 5.2 0 1 1 4.8 4',
  enlarge: 'M3 7V3h4m6 6v4H9M3 3l4.5 4.5M13 13 8.5 8.5',
};
export default function ActionMark({ icon = 'outward' }) {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-.12em', flexShrink: 0 }}><path d={strokes[icon]}/></svg>;
}
