const button = document.getElementById('button');
const playIcon = document.getElementById('play');
const stopIcon = document.getElementById('stop');

button.addEventListener('click', handleClick);

playIcon.style.cssText = 'display:none';

const SMOOTH = 0.02; // 動きのなめらかさ（小さいほどなめらか）
const LINE_WEIGHT = 3;

let circles = [];
let isPlaying = true;

class Circle {
  constructor(name, x, y, color, size, activity, coordinationLevel) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.lowerActivity = -activity * 0.87;
    this.upperActivity = activity;
    this.coordinationLevel = coordinationLevel;
    this.path = [{ x: x, y: y }];
    this.seed = floor(random(100000));
  }

  // 現在地に円を描写する
  drawCircle() {
    stroke(this.color);
    strokeWeight(LINE_WEIGHT);
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
    noiseSeed(this.seed);
    this.x += map(
      this.noiseX(id),
      0,
      1,
      this.lowerActivity,
      this.upperActivity
    );
    this.y += map(
      this.noiseY(id),
      0,
      1,
      this.lowerActivity,
      this.upperActivity
    );
  }

  // 協調更新（もう一方の円を考慮する）
  cooperationUpdate(id) {
    const other = circles.find((circle) => circle.name !== this.name);

    const rate = 1.3;

    noiseSeed(this.seed);

    const toRight = map(
      this.noiseX(id),
      0,
      1,
      this.lowerActivity,
      this.upperActivity * rate
    );

    const toLeft = map(
      this.noiseX(id),
      0,
      1,
      this.lowerActivity * rate,
      this.upperActivity
    );

    const toBottom = map(
      this.noiseY(id),
      0,
      1,
      this.lowerActivity,
      this.upperActivity * rate
    );

    const toTop = map(
      this.noiseY(id),
      0,
      1,
      this.lowerActivity * rate,
      this.upperActivity
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

  getStep(id) {
    const noiseCycleShift = id;
    return frameCount * SMOOTH + noiseCycleShift;
  }

  noiseX(id) {
    return noise(this.getStep(id), 0);
  }

  noiseY(id) {
    return noise(0, this.getStep(id));
  }

  // ウィンドウからはみ出ないように位置を調整する
  check() {
    const lineWeight = round(LINE_WEIGHT / 2);
    // 右端に衝突
    if (this.x + this.size + lineWeight >= width) {
      this.x = width - this.size - lineWeight;
    }

    // 左端に衝突
    if (this.x - this.size - lineWeight <= 0) {
      this.x = this.size + lineWeight;
    }

    // 下端に衝突
    if (this.y + this.size + lineWeight >= height) {
      this.y = height - this.size - lineWeight;
    }

    // 上端に衝突
    if (this.y - this.size - lineWeight <= 0) {
      this.y = this.size + lineWeight;
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
  const activity = 2.5;

  circles = [
    // 無関心 vs 無関心 (like a "自由人")
    new Circle('blue', x, y, blue, size, activity, null),
    new Circle('yellow', x, y, yellow, size, activity, null),
  ];

  /* circles = [
    // 好き vs 好き (like a "相思相愛")
    new Circle('blue', x, y, blue, size, activity, 1.5),
    new Circle('yellow', x, y, yellow, size, activity, 1.5),
  ]; */

  /* circles = [
    // 嫌い vs 嫌い (like a "犬猿の仲")
    new Circle('blue', x, y, blue, size, activity, -5),
    new Circle('yellow', x, y, yellow, size, activity, -5),
  ]; */

  /* circles = [
    // 無関心 vs 好き (like a "来るもの拒まず")
    new Circle('blue', x, y, blue, size, activity, null),
    new Circle('yellow', x, y, yellow, size, activity, 2),
  ]; */

  /* circles = [
    // 無関心 vs 嫌い (like a "去るもの追わず")
    new Circle('blue', x, y, blue, size, activity, null),
    new Circle('yellow', x, y, yellow, size, activity, -2),
  ]; */

  /* circles = [
    // 好き vs 嫌い (like a "一方通行の愛情")
    new Circle('blue', x, y, blue, size, activity, 2),
    new Circle('yellow', x, y, yellow, size, activity, -2),
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
