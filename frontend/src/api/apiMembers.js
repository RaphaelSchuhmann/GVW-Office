import { httpGet, httpPost, parseBodySafe } from "./http";

const apiUrl = __API_URL__;

/**
 * Fetches all members
 *
 * Sends a GET request to `/members/all` endpoint with an Authorization header.
 *
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * The response body may include complete member objects
 *
 * @example
 * const { resp, body } = await getMembers();
 *
 * if (resp?.ok) {
 *   console.log("Members: ", body);
 * }
 */
export async function apiGetMembers() {
    const resp = await httpGet(`${apiUrl}/members/all`);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

/**
 * Adds a new member
 *
 * Sends a POST request to `/members/add` endpoint with an Authorization header.
 *
 * @param {Object} member - The member object to add
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * @example
 * const { resp } = await addMember({
 *     name: "John",
 *     surname: "Doe",
 *     email: "john.doe@example.com",
 *     phone: "0123456",
 *     address: "Home 1",
 *     voice: "tenor1",
 *     status: "active",
 *     role: "member",
 *     birthday: "2000-01-01"
 *     joined: "2026",
 * });
 *
 * if (resp?.ok) {
 *   console.log("Member added");
 * }
 */
export async function apiAddMember(member) {
    const resp = await httpPost(`${apiUrl}/members/add`, member);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

/**
 * Deletes a member
 *
 * Sends a POST request to `/members/delete` endpoint with an Authorization header.
 *
 * @param {number} id - The id of the member to delete
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * @example
 * const { resp } = await deleteMember(1);
 *
 * if (resp?.ok) {
 *   console.log("Member deleted");
 * }
 */
export async function apiDeleteMember(id) {
    const resp = await httpPost(`${apiUrl}/members/delete`, { id: id });
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

/**
 * Switches a member's status
 *
 * Sends a POST request to `/members/update/status` endpoint with an Authorization header.
 *
 * @param {number} id - The id of the member to update
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * @example
 * const { resp } = await switchMemberStatus(1);
 *
 * if (resp?.ok) {
 *   console.log("Member status updated");
 * }
 */
export async function apiUpdateMemberStatus(id) {
    const resp = await httpPost(`${apiUrl}/members/update/status`, { id: id });
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

/**
 * Resets a member's password
 *
 * Sends a POST request to `/user/reset/password` endpoint with an Authorization header.
 *
 * @param {number} id - The id of the member whose password to reset
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * @example
 * const { resp } = await apiResetMembersPassword(1);
 *
 * if (resp?.ok) {
 *   console.log("Member password reset");
 * }
 */
export async function apiResetMembersPassword(id) {
    const resp = await httpPost(`${apiUrl}/user/reset/password`, { memberId: id });
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}

/**
 * Updates a member
 *
 * Sends a POST request to `/members/update` endpoint with an Authorization header.
 *
 * @param {Object} member - The member object to update
 * @returns {Promise<{ resp: Response | null, body: any | null }>}
 * An object containing the raw fetch Response (`resp`) and the parsed
 * JSON response body (`body`). Returns `{ resp: null, body: null }`
 * if the request fails before a response is received.
 *
 * @example
 * const { resp } = await updateMember({
 *     id: 1,
 *     name: "John",
 *     surname: "Doe",
 *     email: "john.doe@example.com",
 *     phone: "0123456",
 *     address: "Home 1",
 *     voice: "tenor1",
 *     status: "active",
 *     role: "member",
 *     birthday: "2000-01-01"
 *     joined: "2026",
 * });
 *
 * if (resp?.ok) {
 *   console.log("Member updated");
 * }
 */
export async function apiUpdateMember(member) {
    const resp = await httpPost(`${apiUrl}/members/update`, member);
    if (!resp) return { resp: null, body: null };
    const body = await parseBodySafe(resp);
    return { resp, body };
}