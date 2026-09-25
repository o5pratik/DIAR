const fs = require('fs');
const { PNG } = require('pngjs');

const size = 1024;
const colors = {
  cream: [247, 245, 239, 255],
  page: [255, 253, 248, 255],
  green: [55, 78, 62, 255],
  spine: [39, 61, 47, 255],
  gold: [188, 155, 95, 255],
  line: [211, 218, 204, 255],
  transparent: [0, 0, 0, 0],
  black: [0, 0, 0, 255],
};

function rounded(x, y, left, top, width, height, radius) {
  const cx = Math.max(left + radius, Math.min(x, left + width - radius));
  const cy = Math.max(top + radius, Math.min(y, top + height - radius));
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}
function polygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const star = Array.from({ length: 16 }, (_, i) => {
  const angle = -Math.PI / 2 + i * Math.PI / 8;
  const radius = i % 2 ? 27 : 71;
  return [526 + Math.cos(angle) * radius, 393 + Math.sin(angle) * radius];
});
const bookmark = [[646, 231], [712, 231], [712, 364], [679, 336], [646, 364]];

function render(kind, path) {
  const png = new PNG({ width: size, height: size });
  const mono = kind === 'mono';
  const background = kind === 'icon' || kind === 'background' ? colors.cream : colors.transparent;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let color = background;
    if (kind !== 'background') {
      if (rounded(x, y, 213, 168, 598, 688, 86)) color = mono ? colors.black : colors.green;
      if (!mono && rounded(x, y, 270, 222, 488, 582, 45)) color = colors.page;
      if (!mono && rounded(x, y, 213, 168, 89, 688, 86)) color = colors.spine;
      if (!mono && polygon(x, y, bookmark)) color = colors.gold;
      if (!mono && polygon(x, y, star)) color = colors.gold;
      if (!mono && y > 540 && y < 548 && x > 359 && x < 660) color = colors.line;
      if (!mono && y > 589 && y < 597 && x > 359 && x < 686) color = colors.line;
      if (!mono && y > 638 && y < 646 && x > 359 && x < 590) color = colors.line;
    }
    const offset = (y * size + x) * 4;
    png.data[offset] = color[0]; png.data[offset + 1] = color[1];
    png.data[offset + 2] = color[2]; png.data[offset + 3] = color[3];
  }
  fs.writeFileSync(path, PNG.sync.write(png));
}

render('icon', 'assets/icon.png');
render('icon', 'assets/favicon.png');
render('foreground', 'assets/android-icon-foreground.png');
render('background', 'assets/android-icon-background.png');
render('mono', 'assets/android-icon-monochrome.png');
