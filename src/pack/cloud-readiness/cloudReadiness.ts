import { ExtensionPack } from "@atomist/sdm";
import { CloudReadinessIssueManager } from "./cloudReadinessIssueManager";
import { FileIoImportReviewer } from "./reviewer/fileIoImportReviewer";
import { HardCodedPropertyReviewer } from "./reviewer/hardcodedPropertyReviewer";
import { ImportDotStarReviewer } from "./reviewer/importDotStarReviewer";
import { ProvidedDependencyReviewer } from "./reviewer/providedDependencyReviewer";

export const CloudReadinessChecks: ExtensionPack = {
    name: "CloudReadiness",
    vendor: "Atomist",
    version: "0.1.0",
    configure: softwareDeliveryMachine =>
        softwareDeliveryMachine
            .addReviewerRegistrations(
                HardCodedPropertyReviewer,
                ProvidedDependencyReviewer,
                FileIoImportReviewer,
                ImportDotStarReviewer,
            )
            .addReviewListeners(CloudReadinessIssueManager),
};
