let state = {
  count: 0,
  renderCount: 0,
  items: [],
  theme: 'light',
  reducerState: { count: 0, history: [] },
  solvedProblems: JSON.parse(localStorage.getItem('solvedProblems') || '[]')
};

function openProblemModal(id) {
  if (typeof window.problemsData === 'undefined') return;
  
  const problem = window.problemsData.find(p => p.id === id);
  if (!problem) return;

  const modal = document.getElementById('problemModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  modalTitle.textContent = problem.title;
  modalBody.innerHTML = `
    <p style="color: var(--gray-400); margin-bottom: 1.5rem; line-height: 1.7;">${problem.solution}</p>
    <h3 style="margin-top: 2rem;">Código de Exemplo</h3>
    <div class="code-block">
      <pre>${problem.code}</pre>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('problemModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function closeModalOnOverlay(event) {
  if (event.target.id === 'problemModal') {
    closeModal();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

function toggleSolved(id) {
  const index = state.solvedProblems.indexOf(id);
  if (index > -1) {
    state.solvedProblems.splice(index, 1);
  } else {
    state.solvedProblems.push(id);
  }
  localStorage.setItem('solvedProblems', JSON.stringify(state.solvedProblems));
  updateProblemUI(id);
}

function updateProblemUI(id) {
  const card = document.querySelector(`.problem-card-compact[data-problem-id="${id}"]`);
  const button = document.querySelector(`.problem-button[data-problem-id="${id}"]`);
  const buttonText = button ? button.querySelector('.button-text') : null;
  
  if (card) {
    if (state.solvedProblems.includes(id)) {
      card.classList.add('solved');
      if (buttonText) buttonText.textContent = '✓ Resolvido';
    } else {
      card.classList.remove('solved');
      if (buttonText) buttonText.textContent = 'Marcar como Resolvido';
    }
  }
}

function incrementCount() {
  state.count++;
  updateCountDisplay();
  updateRenderCount();
  updateCalculation();
}

function decrementCount() {
  state.count--;
  updateCountDisplay();
  updateRenderCount();
  updateCalculation();
}

function resetCount() {
  state.count = 0;
  updateCountDisplay();
  updateRenderCount();
  updateCalculation();
}

function updateCountDisplay() {
  const display = document.getElementById('count-display');
  if (display) display.textContent = state.count;
}

function updateRenderCount() {
  state.renderCount++;
  const display = document.getElementById('render-count');
  if (display) display.textContent = state.renderCount;
  console.log('Component rendered:', state.renderCount);
}

function focusInput() {
  const input = document.getElementById('test-input');
  if (input) input.focus();
}

function addItem() {
  const input = document.getElementById('item-input');
  if (input && input.value.trim()) {
    state.items.push(input.value.trim());
    input.value = '';
    updateItemsDisplay();
  }
}

function updateItemsDisplay() {
  const count = document.getElementById('items-count');
  const list = document.getElementById('items-list');
  if (count) count.textContent = state.items.length;
  if (list) {
    list.innerHTML = state.items.map(item => `<li>${item}</li>`).join('');
  }
}

function updateCalculation() {
  const result = document.getElementById('calculation-result');
  if (result) {
    console.log('Executando cálculo caro...');
    let calcResult = 0;
    for (let i = 0; i < state.count * 1000000; i++) {
      calcResult += i;
    }
    result.textContent = calcResult;
  }
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  const display = document.getElementById('theme-display');
  if (display) display.textContent = state.theme;
}

function dispatchAction(type) {
  switch (type) {
    case 'increment':
      state.reducerState.count++;
      state.reducerState.history.push(`+1 (${new Date().toLocaleTimeString()})`);
      break;
    case 'decrement':
      state.reducerState.count--;
      state.reducerState.history.push(`-1 (${new Date().toLocaleTimeString()})`);
      break;
    case 'reset':
      state.reducerState = { count: 0, history: [] };
      break;
  }
  updateReducerDisplay();
}

function updateReducerDisplay() {
  const count = document.getElementById('reducer-count');
  const history = document.getElementById('history-list');
  if (count) count.textContent = state.reducerState.count;
  if (history) {
    const recent = state.reducerState.history.slice(-5);
    history.innerHTML = recent.map(item => `<li>${item}</li>`).join('');
  }
}

function initLocalStorage() {
  const nameInput = document.getElementById('name-input');
  const savedName = document.getElementById('saved-name');
  
  if (nameInput && savedName) {
    const saved = localStorage.getItem('userName') || '';
    nameInput.value = saved;
    savedName.textContent = saved || 'Nenhum';
    
    nameInput.addEventListener('input', (e) => {
      localStorage.setItem('userName', e.target.value);
      savedName.textContent = e.target.value || 'Nenhum';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.problem-card-compact').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.problem-button')) return;
      const problemId = parseInt(card.getAttribute('data-problem-id'));
      openProblemModal(problemId);
    });
  });

  document.querySelectorAll('.problem-button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const problemId = parseInt(button.getAttribute('data-problem-id'));
      toggleSolved(problemId);
    });
  });

  const modal = document.getElementById('problemModal');
  const modalClose = document.getElementById('modalClose');
  const modalCloseFooter = document.getElementById('modalCloseFooter');
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'problemModal') {
        closeModal();
      }
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modalCloseFooter) {
    modalCloseFooter.addEventListener('click', closeModal);
  }

  state.solvedProblems.forEach(id => {
    updateProblemUI(id);
  });
  
  initLocalStorage();
  
  const itemInput = document.getElementById('item-input');
  if (itemInput) {
    itemInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addItem();
      }
    });
  }
  
  updateCountDisplay();
  updateRenderCount();
  updateCalculation();
  updateItemsDisplay();
  updateReducerDisplay();
});
