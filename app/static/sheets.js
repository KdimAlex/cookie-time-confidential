const list = document.getElementById("list");
const frame = document.getElementById("frame");

function select(button, href) {
  for (const node of list.querySelectorAll("button")) {
    node.setAttribute("aria-pressed", "false");
  }
  button.setAttribute("aria-pressed", "true");
  frame.src = href;
}

fetch("/api/sheets")
  .then((res) => res.json())
  .then((data) => {
    const sheets = data.sheets || [];
    if (!sheets.length) return;
    for (const sheet of sheets) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = sheet.title;
      button.addEventListener("click", () => select(button, sheet.href));
      item.appendChild(button);
      if (sheet.note) {
        const note = document.createElement("p");
        note.className = "note";
        note.textContent = sheet.note;
        item.appendChild(note);
      }
      list.appendChild(item);
      if (list.children.length === 1) select(button, sheet.href);
    }
  });
