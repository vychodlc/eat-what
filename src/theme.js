function injectTailwindTheme() {
  const style = document.createElement('style');
  style.type = 'text/tailwindcss';
  style.textContent = `
    @theme {
      --color-background: #FAF9F6;
      --color-foreground: #333333;

      --color-primary: #FF6B35;
      --color-primary-foreground: #FFFFFF;

      --color-secondary: #2A4747;
      --color-secondary-foreground: #FFFFFF;

      --color-accent: #F7C548;
      --color-accent-foreground: #2A4747;

      --color-muted: #E0E0E0;
      --color-card: #FFFFFF;
      
      --color-border: #D0D0D0;
      --color-ring: #FF6B35;

      --font-display: 'Comic Neue', 'Comic Sans MS', cursive;
      --font-body: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      
      --radius: 1rem;
    }
    
    body {
      background-color: var(--color-background);
      color: var(--color-foreground);
      font-family: var(--font-body);
    }
    
    .font-display {
      font-family: var(--font-display);
    }
    
    .animate-spin-slow {
      animation: spin 3s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
injectTailwindTheme();