import { ExtensionPack } from "@atomist/sdm";
import { AddSentry } from "./addSentryEditor";

export const SentrySupport: ExtensionPack = {
    name: "Sentry",
    vendor: "Atomist",
    version: "0.1.0",
    configure:
        sdm => {
            sdm.addEditors(AddSentry);
        },
};
