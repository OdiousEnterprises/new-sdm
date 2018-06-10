import { ExtensionPack } from "@atomist/sdm";
import { SonarCubeOptions, sonarQubeReviewer } from "./sonarQubeReviewer";

export const SonarQubeSupport: ExtensionPack = {
    name: "SonarQube",
    vendor: "Atomist",
    version: "0.1.0",
    configure: sdm => {
        const options = sdm.configuration.sdm.sonar as SonarCubeOptions;
        if (!!options) {
            sdm.addReviewerRegistrations(sonarQubeReviewer(options));
        }
    },
};
