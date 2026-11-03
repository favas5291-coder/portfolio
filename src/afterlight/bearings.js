export const berths = [
  { id: 'projects', name: 'Market quay', detail: 'Projects', number: '01', dial: 50 },
  { id: 'services', name: 'Boatyard', detail: 'Services', number: '02', dial: 15 },
  { id: 'contact', name: 'Signal house', detail: 'Contact', number: '03', dial: 74 },
];
const scale = [[0,-14],[15,5],[50,58],[74,70],[90,93],[100,101]];
export function bearing(value) {
  const dial = Math.max(0,Math.min(100,Number(value)));
  const i = scale.findIndex(([stop]) => stop >= dial);
  if (i <= 0) return scale[0][1];
  const [a,x] = scale[i-1], [b,y] = scale[i];
  return x+(y-x)*(dial-a)/(b-a);
}
export function litBerth(value) {
  return berths.find(place => Math.abs(place.dial-value) <= 7);
}
export function nextSignal(signal, from, to) {
  if (signal === 'sailing') return signal;
  if (signal === 'answered' && Math.min(from,to)<=91 && Math.max(from,to)>=89) return 'sailing';
  if (signal === 'quiet' && to>=96) return 'answered';
  return signal;
}
