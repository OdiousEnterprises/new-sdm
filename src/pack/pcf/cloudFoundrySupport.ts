import { ExtensionPack } from "@atomist/sdm";
import { AddCloudFoundryManifest } from "./addCloudFoundryManifest";
import { SuggestAddingCloudFoundryManifest } from "./suggestAddingCloudFoundryManifest";

export const CloudFoundrySupport: ExtensionPack = {
    name: "CloudFoundry",
    vendor: "Atomist",
    version: "0.1.0",
    configure: sdm => {
        sdm
            .addEditors(AddCloudFoundryManifest)
            .addChannelLinkListeners(SuggestAddingCloudFoundryManifest);
    },
};
