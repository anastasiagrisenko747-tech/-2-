import { Dashboard } from "./Dashboard.js";

const widgetGrid = document.querySelector("#widget-grid");
const notice = document.querySelector("#notice");
const dashboard = new Dashboard(widgetGrid, notice);

// Восстанавливаем виджеты и задачи. Сетевые виджеты запрашивают свежие данные.
dashboard.restore();

document.querySelectorAll("[data-add]").forEach((button) => {
  button.addEventListener("click", () => dashboard.addWidget(button.dataset.add));
});
