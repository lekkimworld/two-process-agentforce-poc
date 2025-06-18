import {config as dotenv_config} from "dotenv";
dotenv_config();
import { createPubSub } from "./redis";
import { getSalesforceCredentials} from "./salesforce-data";
import { randomUUID } from "crypto";
import {startSession, sendMessage, endSession} from "./agentforce-lib"

const execute = async () => {
    const pubsub = createPubSub("client1");
    const creds = await getSalesforceCredentials();
    const agentId = process.env.AGENT_ID as string;

    // start session
    const resp1 = await startSession(creds, agentId, {
        externalSessionKey: randomUUID().toString(),
        featureSupport: "Sync",
        bypassUser: true,
        instanceConfig: {
            endpoint: creds.instanceUrl
        },
        streamingCapabilities: {
            chunkTypes: ["Text"]
        }
    });
    console.log(`Started conversation: ${resp1.sessionId}`);

    // send message into redis
    pubsub.pub.publish("SESSION", JSON.stringify({
        sessionId: resp1.sessionId,
        accessToken: creds.accessToken
    }));

    // wait for message
    pubsub.sub.subscribe("SAVED", err => {
        if (err) {
            console.error(`Failed to subscribe to Redis channel 'SAVED'`, err);
            process.exit(1);
        }
        pubsub.sub.on("message", async (redisChannel, message) => {
            if (redisChannel === "SAVED") {
                console.log("Received SAVED back: " + message);

                // ask agent
                const msg = await sendMessage(creds, resp1.sessionId, {
                    message: {
                        sequenceId: 2,
                        type: "Text",
                        text: "what is KEY?"
                    }
                })
                console.log(msg.messages[0].message);

                // end session
                await endSession(creds, resp1.sessionId, "UserRequest");
                process.exit(0);
            }
        })
    })
}

execute();

