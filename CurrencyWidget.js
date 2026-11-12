import { UIComponent } from "./UIComponent.js";

// Frankfurter API: актуальный endpoint v1, без секретного API-ключа.
const CURRENCY_URL = "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD";

export class CurrencyWidget extends UIComponent {
  constructor(id, dashboard, collapsed = false) {
    super(id, "Курсы валют", "currency", dashboard);
    this.isCollapsed = collapsed;
    this.requestController = null;
  }
  getIcon() { return "€"; }
  getSubtitle() { return "Обменный курс EUR / USD"; }

  render() {
    const card = super.render();
    this.content = document.createElement("div");
    this.body.append(this.content);
    if (this.isCollapsed) this.applyCollapsed();
    this.loadRate();
    return card;
  }

  applyCollapsed() {
    this.element.classList.add("collapsed");
    this.collapseButton.textContent = "⌄";
    this.collapseButton.setAttribute("aria-expanded", "false");
  }

  async loadRate() {
    this.requestController?.abort();
    this.requestController = new AbortController();
    this.content.innerHTML = '<div class="loading">Загружаем курс валют…</div>';
    try {
      const response = await fetch(CURRENCY_URL, { signal: this.requestController.signal });
      if (!response.ok) throw new Error(`Сервер ответил с кодом ${response.status}`);
      const data = await response.json();
      if (!data.rates || typeof data.rates.USD !== "number" || !data.date) {
        throw new Error("API вернул данные в неожиданном формате.");
      }

      this.content.replaceChildren();
      const pair = document.createElement("div");
      pair.className = "currency-pair";
      const flag = document.createElement("div");
      flag.className = "currency-flag";
      flag.textContent = "€";
      const info = document.createElement("div");
      const label = document.createElement("div");
      label.className = "currency-label";
      label.textContent = "1 EUR равен";
      const rate = document.createElement("div");
      rate.className = "currency-rate";
      rate.textContent = `${data.rates.USD.toFixed(4)} USD`;
      info.append(label, rate);
      const arrow = document.createElement("div");
      arrow.className = "currency-arrow";
      arrow.textContent = "↗";
      pair.append(flag, info, arrow);

      const bottom = document.createElement("div");
      bottom.className = "currency-bottom";
      const dateLabel = document.createElement("span");
      dateLabel.textContent = "Дата курса";
      const date = document.createElement("strong");
      date.textContent = new Date(`${data.date}T00:00:00`).toLocaleDateString("ru-RU");
      bottom.append(dateLabel, date);
      this.content.append(pair, bottom);
    } catch (error) {
      if (error.name === "AbortError") return;
      this.showError("Не удалось загрузить курс валют. Проверьте подключение к интернету.");
    }
  }

  showError(message) {
    this.content.replaceChildren();
    const box = document.createElement("div");
    box.className = "error-box";
    box.textContent = message;
    const retry = document.createElement("button");
    retry.className = "retry-button";
    retry.type = "button";
    retry.textContent = "Повторить";
    retry.addEventListener("click", () => this.loadRate(), { signal: this.abortController.signal });
    box.append(document.createElement("br"), retry);
    this.content.append(box);
  }

  destroy() {
    this.requestController?.abort();
    super.destroy();
  }
}
