import { EventEmitter } from '@core/EventEmitter';

export class LoadingScreen extends EventEmitter {
  render(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'loading-screen';
    
    container.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <h2 class="loading-title">Connecting to Discord...</h2>
        <p class="loading-subtitle">Setting up your game hub</p>
      </div>
    `;
    
    return container;
  }
}
