function renderBoard() {
  var board = document.getElementById("board");
  if (!board) return;

  board.innerHTML = "";

  AppState.columns.forEach(function (col) {
    var columnEl = createColumnElement(col);
    board.appendChild(columnEl);
  });

  board.appendChild(document.createElement("div"));
  updateActivityBadge();
}

function createColumnElement(col) {
  var column = document.createElement("div");
  column.className = "column";
  column.dataset.id = col.id;

  var cards = getCardsForColumn(col.id);
  var filteredCards = cards.filter(function (card) {
    return matchesSearch(card, AppState.searchQuery);
  });

  column.innerHTML = `
    <div class="column-header">
      <div class="column-title-group">
        <div class="column-color-dot" style="background: ${col.color}"></div>
        <h3 class="column-title">${escapeHtml(col.title)}</h3>
        <span class="column-count">${cards.length}</span>
      </div>
      <div class="column-actions">
        <button class="column-action-btn edit-col">Edit</button>
        <button class="column-action-btn delete-col">Delete</button>
      </div>
    </div>
    <div class="card-list" data-col-id="${col.id}"></div>
    <button class="add-card-btn" data-col-id="${col.id}">Add Card</button>
  `;

  var cardList = column.querySelector(".card-list");

  if (filteredCards.length === 0 && !AppState.searchQuery) {
    cardList.innerHTML = `<div class="empty-state"><p>No cards yet</p></div>`;
  } else {
    filteredCards.forEach(function (card) {
      cardList.appendChild(createCardElement(card));
    });
  }

  attachColumnListeners(column);
  return column;
}

function createCardElement(card) {
  var cardEl = document.createElement("div");
  cardEl.className = "card";
  cardEl.dataset.id = card.id;
  cardEl.draggable = true;

  cardEl.innerHTML = `
    <div class="card-color-bar" style="background: ${card.color}"></div>
    <div class="card-content">
      <h4>${escapeHtml(card.title)}</h4>
      <p>${escapeHtml(card.description)}</p>
      <div class="priority-badge ${card.priority}">
        ${card.priority}
      </div>
    </div>
  `;

  cardEl.addEventListener("click", function (e) {
    if (!e.target.closest(".card-action-btn")) {
      openCardModal(card.id);
    }
  });

  if (typeof initDragEvent === "function") {
    initDragEvent(cardEl);
  }

  return cardEl;
}


   /*FIXED ACTIVITY LOG ORDER*/

function renderActivityLog() {
  var activityList = document.getElementById("activityList");
  if (!activityList) return;

  activityList.innerHTML = "";

  // Reverse display order so newest appears first
  [...AppState.activityLog].reverse().forEach(function (activity) {
    var li = document.createElement("li");
    li.className = "activity-item";

    li.innerHTML = `
      <div class="activity-dot"></div>
      <div class="activity-content">
        <div class="activity-text">${activity.text}</div>
        <div class="activity-time">${formatTime(activity.timestamp)}</div>
      </div>
    `;

    activityList.appendChild(li);
  });
}

function attachColumnListeners(column) {
  var colId = column.dataset.id;

  column.querySelector(".add-card-btn").addEventListener("click", function () {
    openCardModal(null, colId);
  });

  column.querySelector(".edit-col").addEventListener("click", function () {
    openColumnModal(colId);
  });

  column.querySelector(".delete-col").addEventListener("click", function () {
    confirmDelete(
      "Are you sure you want to delete this column and all its cards?",
      function () {
        var cards = getCardsForColumn(colId);
        cards.forEach(function (card) {
          delete AppState.cards[card.id];
        });

        AppState.columns = AppState.columns.filter(function (col) {
          return col.id !== colId;
        });

        addActivity("Deleted column");
        autoSave();
        renderBoard();
      }
    );
  });
}