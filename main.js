const button = document.getElementById('button');
const playIcon = document.getElementById('play');
const stopIcon = document.getElementById('stop');

button.addEventListener('click', handleClick);

playIcon.style.cssText = 'display:none';

const SMOOTH = 0.02; // 動きのなめらかさ（小さいほどなめらか）

let circles = [];
let px = 0;
let py = 0;
let isPlaying = true;

class Circle {
  constructor(name, x, y, color, size, activity, coordinationLevel) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.activity = activity;
    this.coordinationLevel = coordinationLevel;
    this.path = [{ x: x, y: y }];
  }

  // 現在地に円を描写する
  drawCircle() {
    stroke(this.color);
    strokeWeight(3);
    noFill();
    circle(this.x, this.y, this.size * 2);
  }

  // 現在地までの軌跡を描写する
  drawPath() {
    const length = this.path.length;
    const startPoint = this.path[0];
    const endPoint = this.path[length - 1];

    // 始点
    push();
    noStroke();
    fill(0, 1, 100, 0.4);
    circle(startPoint.x, startPoint.y, 16);
    pop();

    // 軌道
    push();
    stroke(this.color);
    strokeWeight(2);
    noFill();
    beginShape();
    vertex(startPoint.x, startPoint.y);
    for (let i = 1; i < length; i++) {
      vertex(this.path[i].x, this.path[i].y);
    }
    vertex(endPoint.x, endPoint.y);
    endShape();
    pop();

    // 終点
    push();
    noStroke();
    fill(this.color);
    circle(endPoint.x, endPoint.y, 8);
    pop();
  }

  // 通常更新
  normalUpdate(id) {
    const x = px + id / 100;
    const y = py + id / 100;

    noiseSeed(id);
    this.x += map(noise(x, 0), 0, 1, -this.activity * 0.87, this.activity);
    this.y += map(noise(0, y), 0, 1, -this.activity * 0.87, this.activity);
  }

  // 協調更新（もう一方の円を考慮する）
  cooperationUpdate(id) {
    const other = circles.find((circle) => circle.name !== this.name);

    const rate = 1.3;

    const x = px + id / 100;
    const y = py + id / 100;

    noiseSeed(id);

    const toRight = map(
      noise(x, 0),
      0,
      1,
      -this.activity * 0.87,
      this.activity * rate
    );

    const toLeft = map(
      noise(x, 0),
      0,
      1,
      -this.activity * 0.87 * rate,
      this.activity
    );

    const toBottom = map(
      noise(0, y),
      0,
      1,
      -this.activity * 0.87,
      this.activity * rate
    );

    const toTop = map(
      noise(0, y),
      0,
      1,
      -this.activity * 0.87 * rate,
      this.activity
    );

    const onRight = this.coordinationLevel >= 0 ? toLeft : toRight;
    const onLeft = this.coordinationLevel >= 0 ? toRight : toLeft;
    const onBottom = this.coordinationLevel >= 0 ? toTop : toBottom;
    const onTop = this.coordinationLevel >= 0 ? toBottom : toTop;

    if (this.x > other.x) {
      this.x += onRight;
    } else {
      this.x += onLeft;
    }

    if (this.y > other.y) {
      this.y += onBottom;
    } else {
      this.y += onTop;
    }
  }

  // ウィンドウからはみ出ないように位置を調整する
  check() {
    if (this.x + this.size >= width) {
      this.x -= this.activity;
    }

    if (this.x - this.size <= 0) {
      this.x += this.activity;
    }

    if (this.y + this.size >= height) {
      this.y -= this.activity;
    }

    if (this.y - this.size <= 0) {
      this.y += this.activity;
    }
  }

  // 現在地を保存する
  save() {
    this.path.push({ x: this.x, y: this.y });
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  colorMode(HSB);
  background(0, 0, 0);

  const x = width / 2;
  const y = height / 2;
  const blue = color(190, 52, 68);
  const yellow = color(73, 25, 86);
  const size = 40;
  const activity = 3;
  const unconcern = null;
  const approach = 2;
  const leave = -5;

  circles = [
    // 無関心 vs 無関心 (like a "自由人")
    new Circle('blue', x, y, blue, size, activity, unconcern),
    new Circle('yellow', x, y, yellow, size, activity, unconcern),
  ];

  /* circles = [
    // 好き vs 好き (like a "相思相愛")
    new Circle('blue', x, y, blue, size, activity, approach),
    new Circle('yellow', x, y, yellow, size, activity, approach),
  ]; */

  /* circles = [
    // 嫌い vs 嫌い (like a "犬猿の仲")
    new Circle('blue', x, y, blue, size, activity, leave),
    new Circle('yellow', x, y, yellow, size, activity, leave),
  ]; */

  /* circles = [
    // 無関心 vs 好き (like a "来るもの拒まず")
    new Circle('blue', x, y, blue, size, activity, unconcern),
    new Circle('yellow', x, y, yellow, size, activity, approach),
  ]; */

  /* circles = [
    // 無関心 vs 嫌い (like a "去るもの追わず")
    new Circle('blue', x, y, blue, size, activity, unconcern),
    new Circle('yellow', x, y, yellow, size, activity, leave),
  ]; */

  /* circles = [
    // 好き vs 嫌い (like a "一方通行の愛情")
    new Circle('blue', x, y, blue, size, activity, approach),
    new Circle('yellow', x, y, yellow, size, activity, leave),
  ]; */
}

function draw() {
  // noLoop()呼び出し後に、一度だけdraw()が呼ばれるため
  if (!isLooping()) return;

  // 残像を少し残す
  background(0, 0, 0, 0.25);

  // 各円の描写と更新を行う
  for (let i = 0; i < circles.length; i++) {
    circles[i].drawCircle();

    if (circles[i].coordinationLevel === null) {
      circles[i].normalUpdate(i);
    } else if (floor(random(0, abs(circles[i].coordinationLevel))) === 0) {
      circles[i].cooperationUpdate(i);
    } else {
      circles[i].normalUpdate(i);
    }

    circles[i].check();
    circles[i].save();
  }
  px += SMOOTH;
  py += SMOOTH;
}

function startDrawPath() {
  background(0, 0, 0);

  for (let i = 0; i < circles.length; i++) {
    circles[i].drawPath();
  }

  for (let i = 0; i < circles.length; i++) {
    circles[i].drawCircle();
  }
}

function handleClick() {
  if (isPlaying) {
    clickStop();
  } else {
    clickPlay();
  }
  isPlaying = !isPlaying;
}

function keyReleased() {
  if (keyCode === 32) {
    handleClick();
  }
  return false;
}

function clickPlay() {
  loop();
  displayStopIcon();
}

function clickStop() {
  noLoop();
  displayPlayIcon();
  startDrawPath();
}

function displayPlayIcon() {
  playIcon.style.cssText = '';
  stopIcon.style.cssText = 'display:none';
}

function displayStopIcon() {
  playIcon.style.cssText = 'display:none';
  stopIcon.style.cssText = '';
}
