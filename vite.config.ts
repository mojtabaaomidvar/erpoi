// vite.config.ts

import path from"path";
import { fileURLToPath } from"url";
import tailwindcss from"@tailwindcss/vite";
import react from"@vitejs/plugin-react";
import { defineConfig } from"vite";
import { viteSingleFile } from"vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {"@": path.resolve(__dirname,"src"),"@app": path.resolve(__dirname,"src/app"),"@shared": path.resolve(__dirname,"src/shared"),"@entities": path.resolve(__dirname,"src/entities"),"@features": path.resolve(__dirname,"src/features"),"@widgets": path.resolve(__dirname,"src/widgets"),"@pages": path.resolve(__dirname,"src/pages"),"@infra": path.resolve(__dirname,"src/infrastructure"),"@design-system": path.resolve(__dirname,"src/design-system"),"@data": path.resolve(__dirname,"./src/data"),
}
  },
});