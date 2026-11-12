// Базовый класс для всех карточек-виджетов.
export class UIComponent {
  constructor(id, title, type, dashboard) {
    this.id = id;
    this.title = title;
    this.type = type;
    this.dashboard = dashboard;
    this.element = null;
    this.abortController = new AbortController();
    this.isCollapsed = false;
  }

  render() {
    const card = document.createElement("article");
    card.className = "widget-card";
    card.dataset.widgetId = this.id;

    const head = document.createElement("header");
    head.className = "widget-head";

    const heading = document.createElement("div");
    heading.className = "widget-heading";

    const icon = document.createElement("div");
    icon.className = `widget-icon icon-${this.type}`;
    icon.textContent = this.getIcon();

    const titleWrap = document.createElement("div");
    const title = document.createElement("div");
    title.className = "widget-title";
    title.textContent = this.title;
    const subtitle = document.createElement("div");
    subtitle.className = "widget-subtitle";
    subtitle.textContent = this.getSubtitle();
    titleWrap.append(title, subtitle);
    heading.append(icon, titleWrap);

    const actions = document.createElement("div");
    actions.className = "widget-actions";

    const collapseButton = document.createElement("button");
    collapseButton.className = "icon-button";
    collapseButton.type = "button";
    collapseButton.title = "Свернуть или развернуть";
    collapseButton.setAttribute("aria-label", "Свернуть или развернуть виджет");
    collapseButton.textContent = "⌃";
    collapseButton.addEventListener("click", () => this.toggleCollapse(), {
      signal: this.abortController.signal
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "icon-button delete";
    deleteButton.type = "button";
    deleteButton.title = "Удалить виджет";
    deleteButton.setAttribute("aria-label", "Удалить виджет");
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", () => this.dashboard.removeWidget(this.id), {
      signal: this.abortController.signal
    });

    actions.append(collapseButton, deleteButton);
    head.append(heading, actions);

    this.body = document.createElement("div");
    this.body.className = "widget-body";
    card.append(head, this.body);
    this.element = card;
    this.collapseButton = collapseButton;
    return card;
  }

  getIcon() { return "✦"; }
  getSubtitle() { return "Ваш инструмент"; }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.element.classList.toggle("collapsed", this.isCollapsed);
    this.collapseButton.textContent = this.isCollapsed ? "⌄" : "⌃";
    this.collapseButton.setAttribute("aria-expanded", String(!this.isCollapsed));
    this.dashboard.save();
  }

  destroy() {
    // Снимает все обработчики, добавленные с этим AbortSignal.
    this.abortController.abort();
    this.element?.remove();
  }
}
