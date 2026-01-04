(async () => {
  const cloudData = await cloudLoad();
  if (cloudData) {
    state = cloudData;
    localStorage.setItem("lifeRPG", JSON.stringify(state));
  }
  render();
})();

const habits = ["Morning", "Workout", "Deep Work", "Study", "No Junk", "Review"];
let state = JSON.parse(localStorage.getItem("lifeRPG")) || {
  checks: {},
  xp: 0,
  level: 0,
  sp: 0,
  skills: {}
};

// Build days
let dayRow = "<tr><th>Habit</th>";
for (let i = 1; i <= 30; i++) dayRow += `<th>${i}</th>`;
dayRow += "</tr>";
$("#days").html(dayRow);

// Build habits
habits.forEach((h, hi) => {
  let row = `<tr><th>${h}</th>`;
  for (let d = 1; d <= 30; d++) {
    const key = `${hi}-${d}`;
    row += `<td><div class="cell ${state.checks[key] ? 'checked' : ''}" data-key="${key}"></div></td>`;
  }
  row += "</tr>";
  $("#habits").append(row);
});

$(".cell").click(function () {
  $(this).toggleClass("checked");
  const key = $(this).data("key");
  state.checks[key] = $(this).hasClass("checked");
  recalc();
});

function recalc() {
  let xp = 0;
  $(".cell.checked").each(() => xp += 5);

  let level = Math.floor(Math.sqrt(xp / 25));
  let sp = level - state.level > 0 ? state.sp + (level - state.level) : state.sp;

  state = { ...state, xp, level, sp };
  save();
  render();
}

function render() {
  $("#level").text(state.level);
  $("#sp").text(state.sp);
  $("#gold").text(state.level * 10);

  let nextXP = (state.level + 1) ** 2 * 25;
  $("#xpBar").css("width", `${(state.xp / nextXP) * 100}%`);
}

function save() {
  localStorage.setItem("lifeRPG", JSON.stringify(state));
  cloudSave(state);
}

render();

