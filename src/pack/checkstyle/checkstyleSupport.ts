/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { logger } from "@atomist/automation-client";
import { ExtensionPack, SoftwareDeliveryMachine } from "@atomist/sdm";
import { checkstyleReviewerRegistration } from "@atomist/sdm/pack/checkstyle/checkstyleReviewer";

export interface CheckstyleSupportOptions {
    enabled: boolean;
    path: boolean;
    reviewOnlyChangedFiles: boolean;
}

/**
 * Configuration common to Java SDMs, wherever they deploy
 * @param {SoftwareDeliveryMachine} softwareDeliveryMachine
 * @param {{useCheckstyle: boolean}} configuration
 */
export const CheckstyleSupport: ExtensionPack = {
    name: "Checkstyle",
    vendor: "Atomist",
    version: "0.1.0",
    configure: (softwareDeliveryMachine: SoftwareDeliveryMachine) => {
        const opts = softwareDeliveryMachine.configuration.sdm.checkstyle as CheckstyleSupportOptions;
        if (opts && opts.enabled) {
            const checkStylePath = opts.path;
            if (!!checkStylePath) {
                softwareDeliveryMachine.addReviewerRegistrations(checkstyleReviewerRegistration(opts.reviewOnlyChangedFiles));
            } else {
                logger.warn("Skipping Checkstyle; to enable it, set 'sdm.checkstyle.path' to the location of a downloaded checkstyle jar");
            }
        }
    },
};
