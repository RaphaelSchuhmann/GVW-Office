import fs from "fs/promises";
import path from "path";

const TEMPLATE_DIR = path.join(__dirname, "templates");

export async function loadTemplate(name: string, variables: Record<string, string> = {}): Promise<string> {
    let html = await fs.readFile(path.join(TEMPLATE_DIR, `${name}.html`), "utf-8");

    for (const [key, value] of Object.entries(variables)) {
        html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    return html;
}