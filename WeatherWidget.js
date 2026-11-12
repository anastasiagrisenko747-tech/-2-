import { UIComponent } from "./UIComponent.js";

const WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=50.1109&longitude=8.6821&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto";

const weatherDescriptions = {
  0: ["Ясно", "☀️"], 1: ["Преимущественно ясно", "🌤️"], 2: ["Переменная облачность", "⛅"],
  3: ["Пасмурно", "☁️"], 45: ["Туман", "🌫️"], 48: ["Изморозь", "🌫️"],
  51: ["Лёгкая морось", "🌦️"], 53: ["Морось", "🌦️"], 55: ["Сильная морось", "🌧️"],
  61: ["Небольшой дождь", "🌧️"], 63: ["Дождь", "🌧️"], 65: ["Сильный дождь", "🌧️"],
  71: ["Небольшой снег", "🌨️"], 73: ["Снег", "🌨️"], 75: ["Сильный снег", "❄️"],
  80: ["Ливень", "🌧️"], 81: ["Ливень", "🌧️"], 82: ["Сильный ливень", "⛈️"],
  95: ["Гроза", "⛈️"], 96: ["Гроза с градом", "⛈️"], 99: ["Сильная гроза", "⛈️"]
};

export class WeatherWidget extends UIComponent {
  constructor(id, dashboard, collapsed = false) {
    super(id, "Погода", "weather", dashboard);
    this.isCollapsed = collapsed;
    this.requestController = null;
  }
  getIcon() { return "☼"; }
  getSubtitle() { return "Сейчас во Франкфурте-на-Майне"; }

  render() {
    const card = super.render();
    this.content = document.createElement("div");
    this.body.append(this.content);
    if (this.isCollapsed) this.applyCollapsed();
    this.loadWeather();
    return card;
  }

  applyCollapsed() {
    this.element.classList.add("collapsed");
    this.collapseButton.textContent = "⌄";
    this.collapseButton.setAttribute("aria-expanded", "false");
  }

  async loadWeather() {
    this.requestController?.abort();
    this.requestController = new AbortController();
    this.content.innerHTML = '<div class="loading">Загружаем погоду…</div>';
    try {
      const response = await fetch(WEATHER_URL, { signal: this.requestController.signal });
      if (!response.ok) throw new Error(`Сервер ответил с кодом ${response.status}`);
      const data = await response.json();
      if (!data.current) throw new Error("В ответе API нет текущих погодных данных.");
      const current = data.current;
      const [description, symbol] = weatherDescriptions[current.weather_code] ?? ["Погодные условия", "🌡️"];
      this.content.replaceChildren();

      const main = document.createElement("div");
      main.className = "weather-main";
      const info = document.createElement("div");
      const place = document.createElement("div");
      place.className = "weather-place";
      place.textContent = "Франкфурт-на-Майне · Германия";
      const temp = document.createElement("div");
      temp.className = "weather-temp";
      temp.textContent = `${Math.round(current.temperature_2m)}°`;
      const desc = document.createElement("div");
      desc.className = "weather-desc";
      desc.textContent = description;
      info.append(place, temp, desc);
      const icon = document.createElement("div");
      icon.className = "weather-symbol";
      icon.textContent = symbol;
      main.append(info, icon);

      const details = document.createElement("div");
      details.className = "weather-details";
      const metrics = [
        ["Ощущается", `${Math.round(current.apparent_temperature)}°C`],
        ["Влажность", `${current.relative_humidity_2m}%`],
        ["Ветер", `${Math.round(current.wind_speed_10m)} км/ч`]
      ];
      metrics.forEach(([label, value]) => {
        const block = document.createElement("div");
        const l = document.createElement("div"); l.className = "detail-label"; l.textContent = label;
        const v = document.createElement("div"); v.className = "detail-value"; v.textContent = value;
        block.append(l, v); details.append(block);
      });
      const status = document.createElement("div");
      status.className = "data-status";
      status.textContent = `Обновлено: ${new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
      this.content.append(main, details, status);
    } catch (error) {
      if (error.name === "AbortError") return;
      this.showError("Не удалось загрузить погоду. Проверьте подключение к интернету.");
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
    retry.addEventListener("click", () => this.loadWeather(), { signal: this.abortController.signal });
    box.append(document.createElement("br"), retry);
    this.content.append(box);
  }

  destroy() {
    this.requestController?.abort();
    super.destroy();
  }
}
