const skillTree = [
  { id: "focus", name: "Focus I", cost: 1, effect: "+5% XP" },
  { id: "discipline", name: "Discipline I", cost: 2, effect: "+10% streak bonus" },
  { id: "energy", name: "Energy I", cost: 2, effect: "HP regen" }
];

function renderSkills() {
  $("#skills").html("");
  skillTree.forEach(skill => {
    const unlocked = state.skills[skill.id];
    $("#skills").append(`
      <div class="skill ${unlocked ? '' : 'locked'}"
        onclick="unlockSkill('${skill.id}', ${skill.cost})">
        <b>${skill.name}</b><br>
        <small>${skill.effect}</small><br>
        <small>Cost: ${skill.cost} SP</small>
      </div>
    `);
  });
}

function unlockSkill(id, cost) {
  if (state.sp < cost || state.skills[id]) return;
  state.sp -= cost;
  state.skills[id] = true;
  save();
  renderSkills();
}

renderSkills();

