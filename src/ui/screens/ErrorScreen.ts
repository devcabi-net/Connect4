import { EventEmitter } from '@core/EventEmitter';

export class ErrorScreen extends EventEmitter {
  private message: string = 'An error occurred';

  setMessage(message: string): void {
    this.message = message;
  }

  render(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'error-screen';
    
    container.innerHTML = `
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h2 class="error-title">Oops! Something went wrong</h2>
        <p class="error-message">${this.message}</p>
        
        <div class="error-actions">
          <button class="btn btn-primary" id="retry-btn">
            <span class="btn-icon">🔄</span>
            Try Again
          </button>
          <button class="btn btn-secondary" id="reload-btn">
            <span class="btn-icon">🔄</span>
            Reload Page
          </button>
        </div>
      </div>
    `;
    
    this.setupEventListeners(container);
    return container;
  }
  
  private setupEventListeners(container: HTMLElement): void {
    container.querySelector('#retry-btn')?.addEventListener('click', () => {
      this.emit('retry');
    });
    
    container.querySelector('#reload-btn')?.addEventListener('click', () => {
      location.reload();
    });
  }
}
