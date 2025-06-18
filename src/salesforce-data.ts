
export type SalesforceCredential = {
    accessToken: string;
    instanceUrl: string;
    apiVersion: string;
};

export const getSalesforceCredentials = async (): Promise<SalesforceCredential> => {
    if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.INSTANCE_URL) {
        console.log(`Getting credentials with client_credentials flow`);
        const url = `${process.env.INSTANCE_URL}/services/oauth2/token`;
        const body = `grant_type=client_credentials&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}`;
        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
            },
            body,
        });
        const obj = await resp.json();

        // return
        return {
            accessToken: obj.access_token,
            instanceUrl: obj.instance_url,
            apiVersion: "v64.0",
        };
    }
    throw new Error("Missing configuration");
};
