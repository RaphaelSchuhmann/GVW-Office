import fs from "fs/promises";
import path from "path";

/** Directory containing email templates */
const TEMPLATE_DIR = path.join(__dirname, "templates");

/**
 * Loads an HTML email template and replaces variables with provided values
 * @param name - Name of the template file (without .html extension)
 * @param variables - Object containing variable replacements for {{key}} placeholders
 * @returns Promise resolving to the processed HTML template string
 */
export async function loadTemplate(name: string, variables: Record<string, string> = {}): Promise<string> {
    let html = await fs.readFile(path.join(TEMPLATE_DIR, `${name}.html`), "utf-8");

    for (const [key, value] of Object.entries(variables)) {
        html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    return html;
}