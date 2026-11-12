import { ToDoWidget } from "./ToDoWidget.js";
import { WeatherWidget } from "./WeatherWidget.js";
import { CurrencyWidget } from "./CurrencyWidget.js";

const STORAGE_KEY = "tripmate-dashboard-v1";

export class Dashboard {
  constructor(container, noticeElement) {
    this.container = container;
    this.noticeElement = noticeElement;
    this.widgets = new Map();
    this.factories = {
      todo: (id, state) => new ToDoWidget(id, this, state?.tasks ?? [], state?.collapsed ?? false),
      weather: (id, state) => new WeatherWidget(id, this, state?.collapsed ?? false),
      currency: (id, state) => new CurrencyWidget(id, this, state?.collapsed ?? false)
    };
  }

  addWidget(type, savedState = null) {
    if (!this.factories[type]) {
      this.showNotice("Неизвестный тип виджета.");
      return false;
    }
    if ([...this.widgets.values()].some((widget) => widget.type === type)) {
      this.showNotice("Этот виджет уже добавлен. Удалите его, если хотите добавить заново.");
      return false;
    }

    const id = savedState?.id ?? `${type}-${crypto.randomUUID?.() ?? Date.now()}`;
    const widget = this.factories[type](id, savedState);
    this.widgets.set(id, widget);
    this.container.append(widget.render());
    this.save();
    this.showNotice("");
    return true;
  }

  removeWidget(id) {
    const widget = this.widgets.get(id);
    if (!widget) return;
    widget.destroy();
    this.widgets.delete(id);
    this.save();
    this.showNotice("");
  }

  save() {
    try {
      const state = [...this.widgets.values()].map((widget) => ({
        id: widget.id,
        type: widget.type,
        collapsed: widget.isCollapsed,
        ...(widget.type === "todo" ? { tasks: widget.tasks } : {})
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // Например, localStorage запрещён настройками браузера или переполнен.
      this.showNotice("Не удалось сохранить изменения в этом браузере. Панель продолжит работать до закрытия вкладки.");
    }
  }

  restore() {
    let saved;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.addWidget("todo");
        this.addWidget("weather");
        this.addWidget("currency");
        return;
      }
      saved = JSON.parse(raw);
      if (!Array.isArray(saved)) throw new Error("Некорректный формат сохранения");
    } catch (error) {
      this.showNotice("Сохранённые данные повреждены. Создана новая панель.");
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      this.addWidget("todo");
      this.addWidget("weather");
      this.addWidget("currency");
      return;
    }

    saved.forEach((item) => {
      if (!item || !this.factories[item.type]) return;
      // Повторные типы в повреждённом хранилище пропускаются.
      if ([...this.widgets.values()].some((widget) => widget.type === item.type)) return;
      this.addWidget(item.type, item);
    });
    if (this.widgets.size === 0) {
      this.addWidget("todo");
      this.addWidget("weather");
      this.addWidget("currency");
    }
  }

  showNotice(message) {
    this.noticeElement.textContent = message;
  }
}
