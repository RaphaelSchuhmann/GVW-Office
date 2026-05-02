import { httpDelete, httpGet, httpPost, parseBodySafe } from "./http.svelte";

const apiUrl = __API_URL__;

/**
 * Fetches all reports
 *
 * Sends a GET request to `/reports/all` endpoint with an Authorization header.
 *
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * The response body may include complete report objects
 *
 * @example
 * const { resp, body } = await getReports();
 *
 * if (resp?.ok) {
 *   console.log("Reports: ", body);
 * }
 */
export async function apiGetReports() {
    const resp = await httpGet(`${apiUrl}/report/all`);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

/**
 * Adds a repot
 *
 * Sends a POST request to `/report/add` endpoint with an Authorization header.
 *
 * @param {Object} report - The report to add
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * @example
 * const { resp } = await apiAddReport({
 *     title: "Report",
 *     author: "Max Mustermann",
 *     type: "ReportType",
 *     description: "Keine Beschreibung"
 * });
 *
 * if (resp?.ok) {
 *   console.log("Report added");
 * }
 */
export async function apiAddReport(report) {
    const resp = await httpPost(`${apiUrl}/report/add`, {
        title: report.title,
        author: report.author,
        type: report.type,
        description: report.description,
    });
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

/**
 * Deletes a report
 *
 * Sends a DELETE request to `/report/delete/{id}` endpoint with an Authorization header.
 *
 * @param {string} reportId - The id of the report to delete
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * @example
 * const { resp } = await apiDeleteReport("report-id");
 *
 * if (resp?.ok) {
 *   console.log("Report deleted");
 * }
 */
export async function apiDeleteReport(reportId) {
    const resp = await httpDelete(`${apiUrl}/report/delete/${reportId}`);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}