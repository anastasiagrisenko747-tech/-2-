import { UIComponent } from "./UIComponent.js";

export class ToDoWidget extends UIComponent {
  constructor(id, dashboard, savedTasks = [], collapsed = false) {
    super(id, "Список дел", "todo", dashboard);
    this.tasks = Array.isArray(savedTasks) ? savedTasks : [];
    this.isCollapsed = collapsed;
  }

  getIcon() { return "✓"; }
  getSubtitle() { return "Ваш план на день"; }

  render() {
    const card = super.render();
    const form = document.createElement("form");
    form.className = "todo-form";

    this.input = document.createElement("input");
    this.input.className = "todo-input";
    this.input.type = "text";
    this.input.placeholder = "Например, купить билеты...";
    this.input.maxLength = 120;
    this.input.setAttribute("aria-label", "Новая задача");

    const addButton = document.createElement("button");
    addButton.className = "primary-button";
    addButton.type = "submit";
    addButton.textContent = "Добавить";
    form.append(this.input, addButton);

    this.list = document.createElement("ul");
    this.list.className = "todo-list";
    this.summary = document.createElement("div");
    this.summary.className = "todo-summary";

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.addTask(this.input.value);
    }, { signal: this.abortController.signal });

    this.body.append(form, this.list, this.summary);
    this.renderTasks();
    if (this.isCollapsed) this.applyCollapsed();
    return card;
  }

  addTask(value) {
    const text = value.trim();
    if (!text) {
      this.input.focus();
      return;
    }
    this.tasks.push({
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      text,
      done: false
    });
    this.input.value = "";
    this.renderTasks();
    this.dashboard.save();
    this.input.focus();
  }

  renderTasks() {
    this.list.replaceChildren();
    if (this.tasks.length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty-state";
      empty.textContent = "Пока нет задач. Добавьте первую!";
      this.list.append(empty);
    }

    this.tasks.forEach((task) => {
      const item = document.createElement("li");
      item.className = `todo-item${task.done ? " done" : ""}`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "todo-check";
      checkbox.checked = Boolean(task.done);
      checkbox.setAttribute("aria-label", `Выполнено: ${task.text}`);
      checkbox.addEventListener("change", () => {
        task.done = checkbox.checked;
        this.renderTasks();
        this.dashboard.save();
      }, { signal: this.abortController.signal });

      const text = document.createElement("span");
      text.className = "todo-text";
      // Безопасный вывод пользовательского текста — только через textContent.
      text.textContent = task.text;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "todo-delete";
      remove.textContent = "×";
      remove.title = "Удалить задачу";
      remove.setAttribute("aria-label", `Удалить задачу: ${task.text}`);
      remove.addEventListener("click", () => {
        this.tasks = this.tasks.filter((entry) => entry.id !== task.id);
        this.renderTasks();
        this.dashboard.save();
      }, { signal: this.abortController.signal });

      item.append(checkbox, text, remove);
      this.list.append(item);
    });

    const completed = this.tasks.filter((task) => task.done).length;
    this.summary.textContent = `Выполнено: ${completed} из ${this.tasks.length}`;
  }

  applyCollapsed() {
    this.element.classList.add("collapsed");
    this.collapseButton.textContent = "⌄";
    this.collapseButton.setAttribute("aria-expanded", "false");
  }
}
