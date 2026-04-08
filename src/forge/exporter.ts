import { ForgeGraph } from "./types";
import { ForgeCompiler } from "./compiler";

/**
 * Forge Exporter - Standalone Project Generator
 * Converts a Forge Graph into a complete, runnable React + Tailwind project.
 */

export interface ForgeProjectFiles {
  [path: string]: string;
}

export class ForgeExporter {
  private compiler: ForgeCompiler;

  constructor() {
    this.compiler = new ForgeCompiler();
  }

  /**
   * Generates a complete virtual file system for the project.
   */
  public export(graph: ForgeGraph): ForgeProjectFiles {
    const generatedUI = this.compiler.compile(graph);

    return {
      "package.json": this.generatePackageJson(),
      "tailwind.config.js": this.generateTailwindConfig(),
      "src/index.css": this.generateIndexCss(),
      "src/App.tsx": this.generateAppTsx(),
      "src/main.tsx": this.generateMainTsx(),
      "src/components/GeneratedUI.tsx": generatedUI,
      "index.html": this.generateIndexHtml(),
      "vite.config.ts": this.generateViteConfig(),
      "tsconfig.json": this.generateTsConfig(),
    };
  }

  private generatePackageJson(): string {
    return JSON.stringify(
      {
        name: "forge-exported-app",
        private: true,
        version: "0.0.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "tsc && vite build",
          preview: "vite preview",
        },
        dependencies: {
          react: "^19.0.0",
          "react-dom": "^19.0.0",
          "lucide-react": "^0.460.0",
          motion: "^12.0.0",
        },
        devDependencies: {
          "@types/react": "^19.0.0",
          "@types/react-dom": "^19.0.0",
          "@vitejs/plugin-react": "^4.3.4",
          autoprefixer: "^10.4.20",
          postcss: "^8.4.49",
          tailwindcss: "^4.0.0",
          typescript: "^5.7.2",
          vite: "^6.0.1",
        },
      },
      null,
      2
    );
  }

  private generateTailwindConfig(): string {
    return `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
    `.trim();
  }

  private generateIndexCss(): string {
    return `
@import "tailwindcss";
    `.trim();
  }

  private generateAppTsx(): string {
    return `
import React from 'react';
import GeneratedUI from './components/GeneratedUI';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <GeneratedUI />
    </div>
  );
}

export default App;
    `.trim();
  }

  private generateMainTsx(): string {
    return `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
    `.trim();
  }

  private generateIndexHtml(): string {
    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Forge Exported App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
    `.trim();
  }

  private generateViteConfig(): string {
    return `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
    `.trim();
  }

  private generateTsConfig(): string {
    return JSON.stringify(
      {
        compilerOptions: {
          target: "ESNext",
          useDefineForClassFields: true,
          lib: ["DOM", "DOM.Iterable", "ESNext"],
          allowJs: false,
          skipLibCheck: true,
          esModuleInterop: false,
          allowSyntheticDefaultImports: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          module: "ESNext",
          moduleResolution: "Node",
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx",
        },
        include: ["src"],
      },
      null,
      2
    );
  }
}
