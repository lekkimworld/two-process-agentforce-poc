import {config as dotenv_config} from "dotenv";
dotenv_config();
import { createPubSub } from "./redis";
import { getSalesforceCredentials } from "./salesforce-data";
import { randomUUID } from "crypto";
import { sendMessage } from "./agentforce-lib";

const execute = async () => {
    const pubsub = createPubSub("client2");

    pubsub.sub.subscribe("SESSION", err => {
        if (err) {
            console.error(`Failed to subscribe to Redis channel 'SESSION'`, err);
            process.exit(1);
        }
        pubsub.sub.on("message", async (redisChannel, message) => {
            if (redisChannel === "SESSION") {
                console.log("Received SESSION data");
            }
            const uuid = randomUUID().toString();
            console.log(`Setting uuid to <${uuid}>`);
            const obj = JSON.parse(message) as {sessionId: string, accessToken: string};
            await sendMessage({
                accessToken: obj.accessToken,
                instanceUrl: "",
                apiVersion: ""
            }, obj.sessionId, {
                message: {
                    type: "Text",
                    sequenceId: 1,
                    text: `Please remember KEY as ${uuid}`
                }
            })

            console.log("Sending uuid back");
            pubsub.pub.publish("SAVED", uuid);
            console.log("Sent uuid back");
            process.exit(0);

        });
    })
}

execute();

