import {SalesforceCredential} from "./salesforce-data";

export const BASE_URL = "https://api.salesforce.com/einstein/ai-agent/v1";

export type AgentVariable = {
    name: string;
    type: "Text";
    value: string|number|boolean
}
export type AgentStartSession = {
    externalSessionKey: string;
    tz?: string;
    featureSupport?: "Sync" | "Streaming";
    variables?: Record<string,AgentVariable>;
    instanceConfig: {
        endpoint: string;
    },
    "streamingCapabilities": {
        "chunkTypes": ["Text"]
    },
    "bypassUser": boolean
}

export type HrefObject = {
    href: string;
}

export type AgentMessage = {
    "type": "Inform" | "SessionEnded",
    "id": string,
    "feedbackId": string,
    "planId": string,
    "isContentSafe": boolean
    "message": string,
    "result": Array<any>,
    "citedReferences": Array<any>
}

export type AgentLinks = {
    "self": string | null,
    "messages": HrefObject,
    "session": HrefObject,
    "end": HrefObject
}

export type AgentStartSessionResponse = {
    "sessionId": string;
    "_links": AgentLinks,
    "messages": Array<AgentMessage>
}

export type AgentMessageRequest = {
    "message": {
        "sequenceId": number,
        "type": "Text",
        "text": string
    }
}

export type AgentMessageResponse = {
    messages: Array<AgentMessage>;
    _links: AgentLinks;
}

export type AgentEndSessionResponse = {
    messages: Array<AgentMessage>;
    _links: AgentLinks
}

export type AgentEndSessionReason = "UserRequest" | "Transfer" | "Expiration" | "Error" | "Other";

export type RequestContext = {
    url: string;
    method: "POST"|"DELETE";
    credentials: SalesforceCredential;
    headers?: Record<string,string>;
    body?: any
}

const sfRequest = async <T> (ctx: RequestContext) : Promise<T> => {
    const fetchCtx : any = {
        method: ctx.method,
        headers: ctx.headers ?
            Object.assign({"authorization": `Bearer ${ctx.credentials.accessToken}`}, ctx.headers) :
            {
                "content-type": "application/json",
                "accept": "application/json",
                "authorization": `Bearer ${ctx.credentials.accessToken}`
            }
    }
    if (ctx.body) fetchCtx.body = JSON.stringify(ctx.body);
    const resp = await fetch(ctx.url, fetchCtx);
    if (!resp.ok) {
        throw new Error(`Unable to perform request <${resp.status}> / <${resp.statusText}>`);
    }
    return await resp.json();
}

export const startSession = async (credentials: SalesforceCredential, agentId: string, payload: AgentStartSession) : Promise<AgentStartSessionResponse> => {
    const url = `${BASE_URL}/agents/${agentId}/sessions`;
    return sfRequest<AgentStartSessionResponse>({
        url,
        method: "POST",
        credentials,
        body: payload
    });
}

export const sendMessage = async (credentials: SalesforceCredential, sessionId: string, payload: AgentMessageRequest) : Promise<AgentMessageResponse> => {
    const url = `${BASE_URL}/sessions/${sessionId}/messages`;
    return sfRequest<AgentMessageResponse>({
        credentials,
        url,
        method: "POST",
        body: payload
    });
}

export const endSession = async (credentials: SalesforceCredential, sessionId: string, reason: AgentEndSessionReason) : Promise<AgentEndSessionResponse> => {
    const url = `${BASE_URL}/sessions/${sessionId}`;
    return sfRequest({
        url,
        credentials,
        method: "DELETE",
        headers: {
            "x-session-end-reason": reason
        }
    });
}
